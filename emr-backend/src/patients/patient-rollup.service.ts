import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

const DEFAULT_BATCH_SIZE = 50_000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1_000_000;
const PATIENT_ROLLUP_LOCK_ID = 1_906_202_608;
const PATIENT_ROLLUP_CRON_NAME = 'patient-daily-rollup';
const PATIENT_ROLLUP_JOB_NAME = 'patient-daily-rollup-v1';

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
export class PatientRollupService {
  private readonly logger = new Logger(PatientRollupService.name);
  private rollupStarted = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('* * * * * *', { name: PATIENT_ROLLUP_CRON_NAME })
  async runOnceDailyRollup(): Promise<void> {
    if (this.rollupStarted) return;
    this.rollupStarted = true;

    if (!this.isCronEnabled()) {
      console.log(
        '[Patient Rollup] Cron is disabled. Set ' +
          'PATIENT_ROLLUP_CRON_ENABLED=true and restart the application ' +
          'to enable it.',
      );
      this.deleteCronJob();
      return;
    }

    console.log(
      `[Patient Rollup] Cron started at ${new Date().toISOString()}.`,
    );

    try {
      await this.runIncrementalRollup();
      console.log('[Patient Rollup] Incremental backfill completed.');
    } catch (error: unknown) {
      this.logger.error(
        `[Patient Rollup] Backfill failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      console.error(
        '[Patient Rollup] Backfill failed:',
        (error as Error)?.message,
      );
      throw error;
    } finally {
      this.deleteCronJob();
    }
  }

  // Acquire before INSERT so IDs cannot commit out of order across creators
  // or be skipped by the backfill's high watermark. Held until commit/rollback.
  async lockForPatientCreation(entityManager: EntityManager): Promise<void> {
    if (!entityManager.queryRunner?.isTransactionActive) {
      throw new Error('Patient rollup requires an active creation transaction.');
    }
    await entityManager.query('SELECT pg_advisory_xact_lock($1)', [
      PATIENT_ROLLUP_LOCK_ID,
    ]);
  }

  async incrementForCreatedPatient(
    patientId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      throw new Error(`Invalid patient ID for rollup increment: ${patientId}`);
    }

    await entityManager.query('SELECT pg_advisory_xact_lock($1)', [
      PATIENT_ROLLUP_LOCK_ID,
    ]);
    await this.ensureRollupTables(entityManager);

    const checkpoint = await this.findCheckpoint(entityManager, true);
    if (!checkpoint || !checkpoint.completed) {
      console.log(
        '[Patient Rollup] Skipping immediate patient rollup increment ' +
          `for patient ID ${patientId}; checkpoint is not ready.`,
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

    if (patientId <= lastProcessedId) {
      return;
    }

    // Sequence gaps need not correspond to patient rows. Count the actual rows
    // since the checkpoint, including any previously skipped creations.
    await this.incrementCountsForCreatedPatient(
      entityManager,
      lastProcessedId,
      patientId,
    );
    await entityManager.query(
      `
        UPDATE patient_rollup_checkpoint
        SET
          last_processed_id = $2::bigint,
          high_watermark_id = GREATEST(high_watermark_id, $2::bigint),
          completed = TRUE,
          updated_at = NOW()
        WHERE job_name = $1::character varying
      `,
      [PATIENT_ROLLUP_JOB_NAME, patientId],
    );

    console.log(
      `[Patient Rollup] Incremented daily rollup for created patient ID ${patientId}; ` +
        `previous high watermark was ${highWatermarkId}.`,
    );
  }

  async incrementForCreatedEmergencyPatient(
    emergencyPatientId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    if (!Number.isSafeInteger(emergencyPatientId) || emergencyPatientId <= 0) {
      throw new Error(
        `Invalid emergency patient ID for rollup increment: ${emergencyPatientId}`,
      );
    }

    await entityManager.query('SELECT pg_advisory_xact_lock($1)', [
      PATIENT_ROLLUP_LOCK_ID,
    ]);
    await this.ensureRollupTables(entityManager);

    const checkpoint = await this.findCheckpoint(entityManager, true);
    if (!checkpoint || !checkpoint.completed) {
      console.log(
        '[Patient Rollup] Skipping immediate emergency patient rollup ' +
          `increment for emergency patient ID ${emergencyPatientId}; ` +
          'checkpoint is not ready.',
      );
      return;
    }

    await this.incrementCountsForCreatedEmergencyPatient(
      entityManager,
      emergencyPatientId,
    );

    console.log(
      '[Patient Rollup] Incremented daily rollup for created emergency ' +
        `patient ID ${emergencyPatientId}.`,
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
          '[Patient Rollup] Another application instance is already running this backfill.',
        );
        return;
      }

      await this.ensureRollupTables(queryRunner);
      let checkpoint = await this.getOrCreateCheckpoint(queryRunner);
      if (checkpoint.completed) {
        console.log(
          '[Patient Rollup] The persisted checkpoint is already complete.',
        );
        return;
      }

      const batchSize = this.getBatchSize();
      console.log(
        `[Patient Rollup] Resuming after patient ID ${checkpoint.last_processed_id}; ` +
          `high watermark is ${checkpoint.high_watermark_id}; ` +
          `batch ID span is ${batchSize}.`,
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
          PATIENT_ROLLUP_LOCK_ID,
        ]);
      }
      await queryRunner.release();
    }
  }

  private async acquireJobLock(queryRunner: QueryRunner): Promise<boolean> {
    const result: unknown = await queryRunner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [PATIENT_ROLLUP_LOCK_ID],
    );
    return (result as AdvisoryLockRow[])[0]?.locked === true;
  }

  private async ensureRollupTables(executor: QueryExecutor): Promise<void> {
    await executor.query(`
      CREATE TABLE IF NOT EXISTS patient_daily_rollups (
        id BIGSERIAL PRIMARY KEY,
        rollup_date date NOT NULL,
        aggregation_type character varying(20) NOT NULL,
        dimension_id integer NOT NULL DEFAULT 0,
        patient_count bigint NOT NULL DEFAULT 0,
        male_count bigint NOT NULL DEFAULT 0,
        female_count bigint NOT NULL DEFAULT 0,
        other_count bigint NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_patient_daily_rollup_date_type_dimension
          UNIQUE (rollup_date, aggregation_type, dimension_id)
      )
    `);

    await executor.query(`
      CREATE INDEX IF NOT EXISTS idx_patient_daily_rollup_lookup
      ON patient_daily_rollups (
        aggregation_type,
        dimension_id,
        rollup_date
      )
    `);

    await executor.query(`
      CREATE TABLE IF NOT EXISTS patient_rollup_checkpoint (
        job_name character varying(100) PRIMARY KEY,
        last_processed_id bigint NOT NULL DEFAULT 0,
        high_watermark_id bigint NOT NULL DEFAULT 0,
        completed boolean NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('[Patient Rollup] Rollup state tables are ready.');
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
        FROM patients
      `);
      const highWatermarkId = String(
        (
          highWatermarkResult as Array<{
            high_watermark_id: string;
          }>
        )[0]?.high_watermark_id ?? '0',
      );

      await queryRunner.query('TRUNCATE TABLE patient_daily_rollups');

      const insertedResult: unknown = await queryRunner.query(
        `
          INSERT INTO patient_rollup_checkpoint (
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
        [PATIENT_ROLLUP_JOB_NAME, highWatermarkId],
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
    executor: QueryExecutor,
    forUpdate = false,
  ): Promise<CheckpointRow | null> {
    const result: unknown = await executor.query(
      `
        SELECT
          last_processed_id::text,
          high_watermark_id::text,
          completed
        FROM patient_rollup_checkpoint
        WHERE job_name = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [PATIENT_ROLLUP_JOB_NAME],
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
      await this.incrementPatientCounts(queryRunner);

      const completed = batchEndId >= highWatermarkId;
      await queryRunner.query(
        `
          UPDATE patient_rollup_checkpoint
          SET
            last_processed_id = $2::bigint,
            completed = $3::boolean,
            updated_at = NOW()
          WHERE job_name = $1::character varying
        `,
        [PATIENT_ROLLUP_JOB_NAME, batchEndId, completed],
      );

      await queryRunner.commitTransaction();
      const checkpoint = await this.findCheckpoint(queryRunner);
      if (!checkpoint) {
        throw new Error(
          'Patient rollup checkpoint disappeared after the batch was committed.',
        );
      }

      console.log(
        `[Patient Rollup] Committed patient ID range (${lastProcessedId}, ` +
          `${batchEndId}] in ${Date.now() - startedAt}ms.`,
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
        CREATE TEMP TABLE patient_rollup_batch_dimensions
        ON COMMIT DROP
        AS
        SELECT
          DATE(patient.created_at) AS rollup_date,
          dimension.aggregation_type,
          dimension.dimension_id,
          patient.gender
        FROM patients patient
        CROSS JOIN LATERAL (
          VALUES
            ('TOTAL', 0),
            ('FACILITY', patient.facility_id),
            ('DIVISION', patient.division_id),
            ('DISTRICT', patient.district_id),
            ('TALUKA', patient.taluka_id),
            ('UC', patient.uc_id)
        ) AS dimension(aggregation_type, dimension_id)
        WHERE patient.id > $1::integer
          AND patient.id <= $2::integer
          AND patient.created_at IS NOT NULL
          AND dimension.dimension_id IS NOT NULL
      `,
      [lastProcessedId, batchEndId],
    );
  }

  private async incrementPatientCounts(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      INSERT INTO patient_daily_rollups (
        rollup_date,
        aggregation_type,
        dimension_id,
        patient_count,
        male_count,
        female_count,
        other_count,
        created_at,
        updated_at
      )
      SELECT
        rollup_date,
        aggregation_type,
        dimension_id,
        COUNT(*)::bigint,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END)::bigint,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END)::bigint,
        SUM(CASE WHEN gender = 'Other' THEN 1 ELSE 0 END)::bigint,
        NOW(),
        NOW()
      FROM patient_rollup_batch_dimensions
      GROUP BY rollup_date, aggregation_type, dimension_id
      ON CONFLICT ON CONSTRAINT uq_patient_daily_rollup_date_type_dimension
      DO UPDATE SET
        patient_count = patient_daily_rollups.patient_count + EXCLUDED.patient_count,
        male_count = patient_daily_rollups.male_count + EXCLUDED.male_count,
        female_count = patient_daily_rollups.female_count + EXCLUDED.female_count,
        other_count = patient_daily_rollups.other_count + EXCLUDED.other_count,
        updated_at = NOW()
    `);
  }

  private async incrementCountsForCreatedPatient(
    executor: QueryExecutor,
    lastProcessedId: number,
    patientId: number,
  ): Promise<void> {
    await executor.query(
      `
        INSERT INTO patient_daily_rollups (
          rollup_date,
          aggregation_type,
          dimension_id,
          patient_count,
          male_count,
          female_count,
          other_count,
          created_at,
          updated_at
        )
        SELECT
          DATE(patient.created_at),
          dimension.aggregation_type,
          dimension.dimension_id,
          COUNT(*)::bigint,
          SUM(CASE WHEN patient.gender = 'Male' THEN 1 ELSE 0 END)::bigint,
          SUM(CASE WHEN patient.gender = 'Female' THEN 1 ELSE 0 END)::bigint,
          SUM(CASE WHEN patient.gender = 'Other' THEN 1 ELSE 0 END)::bigint,
          NOW(),
          NOW()
        FROM patients patient
        CROSS JOIN LATERAL (
          VALUES
            ('TOTAL', 0),
            ('FACILITY', patient.facility_id),
            ('DIVISION', patient.division_id),
            ('DISTRICT', patient.district_id),
            ('TALUKA', patient.taluka_id),
            ('UC', patient.uc_id)
        ) AS dimension(aggregation_type, dimension_id)
        WHERE patient.id > $1::integer
          AND patient.id <= $2::integer
          AND patient.created_at IS NOT NULL
          AND dimension.dimension_id IS NOT NULL
        GROUP BY
          DATE(patient.created_at),
          dimension.aggregation_type,
          dimension.dimension_id
        ON CONFLICT ON CONSTRAINT uq_patient_daily_rollup_date_type_dimension
        DO UPDATE SET
          patient_count = patient_daily_rollups.patient_count + EXCLUDED.patient_count,
          male_count = patient_daily_rollups.male_count + EXCLUDED.male_count,
          female_count = patient_daily_rollups.female_count + EXCLUDED.female_count,
          other_count = patient_daily_rollups.other_count + EXCLUDED.other_count,
          updated_at = NOW()
      `,
      [lastProcessedId, patientId],
    );
  }

  private async incrementCountsForCreatedEmergencyPatient(
    executor: QueryExecutor,
    emergencyPatientId: number,
  ): Promise<void> {
    await executor.query(
      `
        INSERT INTO patient_daily_rollups (
          rollup_date,
          aggregation_type,
          dimension_id,
          patient_count,
          male_count,
          female_count,
          other_count,
          created_at,
          updated_at
        )
        SELECT
          DATE(patient.created_at),
          dimension.aggregation_type,
          dimension.dimension_id,
          COUNT(*)::bigint,
          SUM(CASE WHEN patient.sex = 'Male' THEN 1 ELSE 0 END)::bigint,
          SUM(CASE WHEN patient.sex = 'Female' THEN 1 ELSE 0 END)::bigint,
          SUM(CASE WHEN patient.sex = 'Other' THEN 1 ELSE 0 END)::bigint,
          NOW(),
          NOW()
        FROM emergency_patients patient
        CROSS JOIN LATERAL (
          VALUES
            ('TOTAL', 0),
            ('FACILITY', patient.facility_id)
        ) AS dimension(aggregation_type, dimension_id)
        WHERE patient.id = $1::integer
          AND patient.created_at IS NOT NULL
          AND dimension.dimension_id IS NOT NULL
        GROUP BY
          DATE(patient.created_at),
          dimension.aggregation_type,
          dimension.dimension_id
        ON CONFLICT ON CONSTRAINT uq_patient_daily_rollup_date_type_dimension
        DO UPDATE SET
          patient_count = patient_daily_rollups.patient_count + EXCLUDED.patient_count,
          male_count = patient_daily_rollups.male_count + EXCLUDED.male_count,
          female_count = patient_daily_rollups.female_count + EXCLUDED.female_count,
          other_count = patient_daily_rollups.other_count + EXCLUDED.other_count,
          updated_at = NOW()
      `,
      [emergencyPatientId],
    );
  }

  private deleteCronJob(): void {
    try {
      this.schedulerRegistry.deleteCronJob(PATIENT_ROLLUP_CRON_NAME);
      console.log('[Patient Rollup] One-shot cron deleted.');
    } catch (error: unknown) {
      this.logger.warn(`deleteCronJob failed: ${(error as Error)?.message}`);
    }
  }

  private getBatchSize(): number {
    const configured = Number(process.env.PATIENT_ROLLUP_BATCH_SIZE);
    if (!Number.isInteger(configured)) return DEFAULT_BATCH_SIZE;
    return Math.min(Math.max(configured, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private isCronEnabled(): boolean {
    return (
      String(process.env.PATIENT_ROLLUP_CRON_ENABLED).trim().toLowerCase() ===
      'true'
    );
  }

  private parseCheckpointId(value: string, column: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid ${column} value in patient rollup checkpoint: ${value}`,
      );
    }
    return parsed;
  }
}
