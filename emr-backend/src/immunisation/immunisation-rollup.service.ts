import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

const DEFAULT_BATCH_SIZE = 50_000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1_000_000;
const DAILY_ROLLUP_LOCK_ID = 1_906_202_607;
const DAILY_ROLLUP_CRON_NAME = 'immunisation-daily-rollup';
const DAILY_ROLLUP_JOB_NAME = 'immunisation-daily-rollup-v1';

type AdvisoryLockRow = {
  locked: boolean;
};

type CheckpointRow = {
  last_processed_id: string;
  high_watermark_id: string;
  completed: boolean;
};

type QueryExecutor = {
  query: (query: string, parameters?: unknown[]) => Promise<unknown>;
};

@Injectable()
export class ImmunisationRollupService {
  private readonly logger = new Logger(ImmunisationRollupService.name);
  private rollupStarted = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('* * * * * *', { name: DAILY_ROLLUP_CRON_NAME })
  async runOnceDailyRollup(): Promise<void> {
    if (this.rollupStarted) return;
    this.rollupStarted = true;

    if (!this.isCronEnabled()) {
      console.log(
        '[Immunisation Rollup] Cron is disabled. Set ' +
          'IMMUNISATION_ROLLUP_CRON_ENABLED=true and restart the application ' +
          'to enable it.',
      );
      this.deleteCronJob();
      return;
    }

    console.log(
      `[Immunisation Rollup] Cron started at ${new Date().toISOString()}.`,
    );

    try {
      await this.runIncrementalRollup();
      console.log('[Immunisation Rollup] Incremental backfill completed.');
    } catch (error: unknown) {
      this.logger.error(
        `[Immunisation Rollup] Backfill failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      console.error(
        '[Immunisation Rollup] Backfill failed:',
        (error as Error)?.message,
      );
      throw error;
    } finally {
      this.deleteCronJob();
    }
  }

  async incrementForCreatedDose(
    doseId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    if (!Number.isSafeInteger(doseId) || doseId <= 0) {
      throw new Error(`Invalid immunisation dose ID for rollup: ${doseId}`);
    }

    await entityManager.query('SELECT pg_advisory_xact_lock($1)', [
      DAILY_ROLLUP_LOCK_ID,
    ]);

    const checkpoint = await this.findCheckpoint(entityManager, true);
    if (!checkpoint || !checkpoint.completed) {
      console.log(
        '[Immunisation Rollup] Skipping immediate dose rollup increment ' +
          `for dose ID ${doseId}; checkpoint is not ready.`,
      );
      return;
    }

    const lastProcessedId = this.parseCheckpointId(
      checkpoint.last_processed_id,
      'last_processed_id',
    );
    const highWatermarkId = this.parseCheckpointId(
      checkpoint.high_watermark_id,
      'high_watermark_id',
    );

    if (doseId <= lastProcessedId) {
      return;
    }

    if (doseId !== lastProcessedId + 1) {
      console.log(
        '[Immunisation Rollup] Skipping immediate dose rollup increment ' +
          `for dose ID ${doseId}; waiting for cron to fill the ID gap ` +
          `after dose ID ${lastProcessedId}.`,
      );
      return;
    }

    await this.incrementCountsForCreatedDose(entityManager, doseId);
    await entityManager.query(
      `
        UPDATE immunisation_rollup_checkpoint
        SET
          last_processed_id = $2::bigint,
          high_watermark_id = GREATEST(high_watermark_id, $2::bigint),
          completed = TRUE,
          updated_at = NOW()
        WHERE job_name = $1::character varying
      `,
      [DAILY_ROLLUP_JOB_NAME, doseId],
    );

    console.log(
      `[Immunisation Rollup] Incremented daily rollup for created dose ID ${doseId}; ` +
        `previous high watermark was ${highWatermarkId}.`,
    );
  }

  private async runIncrementalRollup(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let lockAcquired = false;
    try {
      lockAcquired = await this.acquireJobLock(queryRunner);
      if (!lockAcquired) {
        console.warn(
          '[Immunisation Rollup] Another application instance is already ' +
            'running this backfill.',
        );
        return;
      }

      let checkpoint = await this.getOrCreateCheckpoint(queryRunner);
      if (checkpoint.completed) {
        console.log(
          '[Immunisation Rollup] The persisted checkpoint is already complete.',
        );
        return;
      }

      const batchSize = this.getBatchSize();
      console.log(
        `[Immunisation Rollup] Resuming after dose ID ` +
          `${checkpoint.last_processed_id}; high watermark is ` +
          `${checkpoint.high_watermark_id}; batch ID span is ${batchSize}.`,
      );

      while (!checkpoint.completed) {
        const lastProcessedId = this.parseCheckpointId(
          checkpoint.last_processed_id,
          'last_processed_id',
        );
        const highWatermarkId = this.parseCheckpointId(
          checkpoint.high_watermark_id,
          'high_watermark_id',
        );
        const batchEndId = Math.min(
          lastProcessedId + batchSize,
          highWatermarkId,
        );

        checkpoint = await this.processBatch(
          queryRunner,
          lastProcessedId,
          batchEndId,
          highWatermarkId,
        );
      }
    } finally {
      if (lockAcquired) {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [
          DAILY_ROLLUP_LOCK_ID,
        ]);
      }
      await queryRunner.release();
    }
  }

  private async acquireJobLock(queryRunner: QueryRunner): Promise<boolean> {
    const result: unknown = await queryRunner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [DAILY_ROLLUP_LOCK_ID],
    );
    return (result as AdvisoryLockRow[])[0]?.locked === true;
  }

  private async getOrCreateCheckpoint(
    queryRunner: QueryRunner,
  ): Promise<CheckpointRow> {
    await queryRunner.startTransaction();
    try {
      await queryRunner.query("SET LOCAL statement_timeout = '0'");

      const checkpoint = await this.findCheckpoint(queryRunner, true);
      if (checkpoint) {
        await queryRunner.commitTransaction();
        return checkpoint;
      }

      const highWatermarkResult: unknown = await queryRunner.query(`
        SELECT COALESCE(MAX(id), 0)::bigint AS high_watermark_id
        FROM immunisation_doses
      `);
      const highWatermarkId = String(
        (
          highWatermarkResult as Array<{
            high_watermark_id: string;
          }>
        )[0]?.high_watermark_id ?? '0',
      );

      await queryRunner.query(`
        TRUNCATE TABLE
          immunisation_daily_rollups,
          immunisation_rollup_seen_patients,
          immunisation_rollup_seen_vaccines
      `);

      const insertedResult: unknown = await queryRunner.query(
        `
          INSERT INTO immunisation_rollup_checkpoint (
            job_name,
            last_processed_id,
            high_watermark_id,
            completed,
            updated_at
          )
          VALUES (
            $1::character varying,
            0::bigint,
            $2::bigint,
            $2::bigint = 0::bigint,
            NOW()
          )
          RETURNING
            last_processed_id::text,
            high_watermark_id::text,
            completed
        `,
        [DAILY_ROLLUP_JOB_NAME, highWatermarkId],
      );

      await queryRunner.commitTransaction();
      return (insertedResult as CheckpointRow[])[0];
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    }
  }

  private async findCheckpoint(
    queryRunner: QueryExecutor,
    forUpdate = false,
  ): Promise<CheckpointRow | null> {
    const result: unknown = await queryRunner.query(
      `
        SELECT
          last_processed_id::text,
          high_watermark_id::text,
          completed
        FROM immunisation_rollup_checkpoint
        WHERE job_name = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [DAILY_ROLLUP_JOB_NAME],
    );
    return (result as CheckpointRow[])[0] ?? null;
  }

  private async processBatch(
    queryRunner: QueryRunner,
    lastProcessedId: number,
    batchEndId: number,
    highWatermarkId: number,
  ): Promise<CheckpointRow> {
    const startedAt = Date.now();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query("SET LOCAL statement_timeout = '0'");
      await this.createBatchDimensions(
        queryRunner,
        lastProcessedId,
        batchEndId,
      );
      await this.incrementDoseCounts(queryRunner);
      await this.incrementDistinctPatientCounts(queryRunner);
      await this.incrementDistinctVaccineCounts(queryRunner);

      const completed = batchEndId >= highWatermarkId;
      await queryRunner.query(
        `
          UPDATE immunisation_rollup_checkpoint
          SET
            last_processed_id = $2::bigint,
            completed = $3::boolean,
            updated_at = NOW()
          WHERE job_name = $1::character varying
        `,
        [DAILY_ROLLUP_JOB_NAME, batchEndId, completed],
      );

      if (completed) {
        await queryRunner.query(`
          TRUNCATE TABLE
            immunisation_rollup_seen_patients,
            immunisation_rollup_seen_vaccines
        `);
      }

      await queryRunner.commitTransaction();
      const checkpoint = await this.findCheckpoint(queryRunner);
      if (!checkpoint) {
        throw new Error(
          'Rollup checkpoint disappeared after the batch was committed.',
        );
      }

      console.log(
        `[Immunisation Rollup] Committed dose ID range ` +
          `(${lastProcessedId}, ${batchEndId}] in ` +
          `${Date.now() - startedAt}ms.`,
      );

      return checkpoint;
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    }
  }

  private async createBatchDimensions(
    queryRunner: QueryRunner,
    lastProcessedId: number,
    batchEndId: number,
  ): Promise<void> {
    await queryRunner.query(
      `
        CREATE TEMP TABLE immunisation_rollup_batch_dimensions
        ON COMMIT DROP
        AS
        SELECT
          dose.date_administered AS rollup_date,
          dimension.aggregation_type,
          dimension.dimension_id,
          dose.patient_id,
          dose.vaccine_id
        FROM immunisation_doses dose
        INNER JOIN vaccines vaccine
          ON vaccine.id = dose.vaccine_id
         AND vaccine.is_active = TRUE
        LEFT JOIN patients patient
          ON patient.id = dose.patient_id
        CROSS JOIN LATERAL (
          VALUES
            ('TOTAL', 0),
            ('VACCINE', dose.vaccine_id),
            ('FACILITY', patient.facility_id),
            ('DIVISION', patient.division_id),
            ('DISTRICT', patient.district_id),
            ('TALUKA', patient.taluka_id),
            ('UC', patient.uc_id)
        ) AS dimension(aggregation_type, dimension_id)
        WHERE dose.id > $1::integer
          AND dose.id <= $2::integer
          AND dose.date_administered IS NOT NULL
          AND dimension.dimension_id IS NOT NULL
      `,
      [lastProcessedId, batchEndId],
    );
  }

  private async incrementDoseCounts(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO immunisation_daily_rollups (
        rollup_date,
        aggregation_type,
        dimension_id,
        dose_count,
        distinct_patient_count,
        distinct_vaccine_count,
        created_at,
        updated_at
      )
      SELECT
        rollup_date,
        aggregation_type,
        dimension_id,
        COUNT(*)::bigint,
        0,
        0,
        NOW(),
        NOW()
      FROM immunisation_rollup_batch_dimensions
      GROUP BY rollup_date, aggregation_type, dimension_id
      ON CONFLICT ON CONSTRAINT
        uq_immunisation_daily_rollup_date_type_dimension
      DO UPDATE SET
        dose_count =
          immunisation_daily_rollups.dose_count + EXCLUDED.dose_count,
        updated_at = NOW()
    `);
  }

  private async incrementDistinctPatientCounts(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      WITH newly_seen AS (
        INSERT INTO immunisation_rollup_seen_patients (
          rollup_date,
          aggregation_type,
          dimension_id,
          patient_id
        )
        SELECT DISTINCT
          rollup_date,
          aggregation_type,
          dimension_id,
          patient_id
        FROM immunisation_rollup_batch_dimensions
        WHERE patient_id IS NOT NULL
        ON CONFLICT DO NOTHING
        RETURNING rollup_date, aggregation_type, dimension_id
      ),
      new_counts AS (
        SELECT
          rollup_date,
          aggregation_type,
          dimension_id,
          COUNT(*)::bigint AS patient_count
        FROM newly_seen
        GROUP BY rollup_date, aggregation_type, dimension_id
      )
      INSERT INTO immunisation_daily_rollups (
        rollup_date,
        aggregation_type,
        dimension_id,
        dose_count,
        distinct_patient_count,
        distinct_vaccine_count,
        created_at,
        updated_at
      )
      SELECT
        rollup_date,
        aggregation_type,
        dimension_id,
        0,
        patient_count,
        0,
        NOW(),
        NOW()
      FROM new_counts
      ON CONFLICT ON CONSTRAINT
        uq_immunisation_daily_rollup_date_type_dimension
      DO UPDATE SET
        distinct_patient_count =
          immunisation_daily_rollups.distinct_patient_count +
          EXCLUDED.distinct_patient_count,
        updated_at = NOW()
    `);
  }

  private async incrementDistinctVaccineCounts(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      WITH newly_seen AS (
        INSERT INTO immunisation_rollup_seen_vaccines (
          rollup_date,
          aggregation_type,
          dimension_id,
          vaccine_id
        )
        SELECT DISTINCT
          rollup_date,
          aggregation_type,
          dimension_id,
          vaccine_id
        FROM immunisation_rollup_batch_dimensions
        WHERE vaccine_id IS NOT NULL
        ON CONFLICT DO NOTHING
        RETURNING rollup_date, aggregation_type, dimension_id
      ),
      new_counts AS (
        SELECT
          rollup_date,
          aggregation_type,
          dimension_id,
          COUNT(*)::int AS vaccine_count
        FROM newly_seen
        GROUP BY rollup_date, aggregation_type, dimension_id
      )
      INSERT INTO immunisation_daily_rollups (
        rollup_date,
        aggregation_type,
        dimension_id,
        dose_count,
        distinct_patient_count,
        distinct_vaccine_count,
        created_at,
        updated_at
      )
      SELECT
        rollup_date,
        aggregation_type,
        dimension_id,
        0,
        0,
        vaccine_count,
        NOW(),
        NOW()
      FROM new_counts
      ON CONFLICT ON CONSTRAINT
        uq_immunisation_daily_rollup_date_type_dimension
      DO UPDATE SET
        distinct_vaccine_count =
          immunisation_daily_rollups.distinct_vaccine_count +
          EXCLUDED.distinct_vaccine_count,
        updated_at = NOW()
    `);
  }

  private async incrementCountsForCreatedDose(
    executor: QueryExecutor,
    doseId: number,
  ): Promise<void> {
    await executor.query(
      `
        INSERT INTO immunisation_daily_rollups (
          rollup_date,
          aggregation_type,
          dimension_id,
          dose_count,
          distinct_patient_count,
          distinct_vaccine_count,
          created_at,
          updated_at
        )
        SELECT
          dimension.rollup_date,
          dimension.aggregation_type,
          dimension.dimension_id,
          1::bigint,
          CASE
            WHEN dimension.patient_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM immunisation_doses previous_dose
                INNER JOIN vaccines previous_vaccine
                  ON previous_vaccine.id = previous_dose.vaccine_id
                 AND previous_vaccine.is_active = TRUE
                LEFT JOIN patients previous_patient
                  ON previous_patient.id = previous_dose.patient_id
                CROSS JOIN LATERAL (
                  VALUES
                    ('TOTAL', 0),
                    ('VACCINE', previous_dose.vaccine_id),
                    ('FACILITY', previous_patient.facility_id),
                    ('DIVISION', previous_patient.division_id),
                    ('DISTRICT', previous_patient.district_id),
                    ('TALUKA', previous_patient.taluka_id),
                    ('UC', previous_patient.uc_id)
                ) AS previous_dimension(aggregation_type, dimension_id)
                WHERE previous_dose.id < dimension.dose_id
                  AND previous_dose.date_administered = dimension.rollup_date
                  AND previous_dose.patient_id = dimension.patient_id
                  AND previous_dimension.aggregation_type =
                    dimension.aggregation_type
                  AND previous_dimension.dimension_id = dimension.dimension_id
              )
            THEN 1::bigint
            ELSE 0::bigint
          END,
          CASE
            WHEN dimension.vaccine_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM immunisation_doses previous_dose
                INNER JOIN vaccines previous_vaccine
                  ON previous_vaccine.id = previous_dose.vaccine_id
                 AND previous_vaccine.is_active = TRUE
                LEFT JOIN patients previous_patient
                  ON previous_patient.id = previous_dose.patient_id
                CROSS JOIN LATERAL (
                  VALUES
                    ('TOTAL', 0),
                    ('VACCINE', previous_dose.vaccine_id),
                    ('FACILITY', previous_patient.facility_id),
                    ('DIVISION', previous_patient.division_id),
                    ('DISTRICT', previous_patient.district_id),
                    ('TALUKA', previous_patient.taluka_id),
                    ('UC', previous_patient.uc_id)
                ) AS previous_dimension(aggregation_type, dimension_id)
                WHERE previous_dose.id < dimension.dose_id
                  AND previous_dose.date_administered = dimension.rollup_date
                  AND previous_dose.vaccine_id = dimension.vaccine_id
                  AND previous_dimension.aggregation_type =
                    dimension.aggregation_type
                  AND previous_dimension.dimension_id = dimension.dimension_id
              )
            THEN 1::int
            ELSE 0::int
          END,
          NOW(),
          NOW()
        FROM (
          SELECT
            dose.id AS dose_id,
            dose.date_administered AS rollup_date,
            dimension.aggregation_type,
            dimension.dimension_id,
            dose.patient_id,
            dose.vaccine_id
          FROM immunisation_doses dose
          INNER JOIN vaccines vaccine
            ON vaccine.id = dose.vaccine_id
           AND vaccine.is_active = TRUE
          LEFT JOIN patients patient
            ON patient.id = dose.patient_id
          CROSS JOIN LATERAL (
            VALUES
              ('TOTAL', 0),
              ('VACCINE', dose.vaccine_id),
              ('FACILITY', patient.facility_id),
              ('DIVISION', patient.division_id),
              ('DISTRICT', patient.district_id),
              ('TALUKA', patient.taluka_id),
              ('UC', patient.uc_id)
          ) AS dimension(aggregation_type, dimension_id)
          WHERE dose.id = $1::integer
            AND dose.date_administered IS NOT NULL
            AND dimension.dimension_id IS NOT NULL
        ) dimension
        ON CONFLICT ON CONSTRAINT
          uq_immunisation_daily_rollup_date_type_dimension
        DO UPDATE SET
          dose_count =
            immunisation_daily_rollups.dose_count + EXCLUDED.dose_count,
          distinct_patient_count =
            immunisation_daily_rollups.distinct_patient_count +
            EXCLUDED.distinct_patient_count,
          distinct_vaccine_count =
            immunisation_daily_rollups.distinct_vaccine_count +
            EXCLUDED.distinct_vaccine_count,
          updated_at = NOW()
      `,
      [doseId],
    );
  }

  private deleteCronJob(): void {
    try {
      this.schedulerRegistry.deleteCronJob(DAILY_ROLLUP_CRON_NAME);
      console.log('[Immunisation Rollup] One-shot cron deleted.');
    } catch (error: unknown) {
      this.logger.warn(`deleteCronJob failed: ${(error as Error)?.message}`);
    }
  }

  private getBatchSize(): number {
    const configured = Number(process.env.IMMUNISATION_ROLLUP_BATCH_SIZE);
    if (!Number.isInteger(configured)) return DEFAULT_BATCH_SIZE;
    return Math.min(Math.max(configured, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private isCronEnabled(): boolean {
    return String(process.env.IMMUNISATION_ROLLUP_CRON_ENABLED)
      .trim()
      .toLowerCase() === 'true';
  }

  private parseCheckpointId(value: string, column: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(`Invalid ${column} value in rollup checkpoint: ${value}`);
    }
    return parsed;
  }
}
