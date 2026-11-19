import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { DataSource, QueryRunner } from 'typeorm';

const DEFAULT_BATCH_SIZE = 50_000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1_000_000;
const PATIENT_IMMUNISATION_ROLLUP_LOCK_ID = 1_906_202_609;
const PATIENT_IMMUNISATION_ROLLUP_CRON_NAME =
  'patient-immunisation-daily-rollup';
const PATIENT_IMMUNISATION_ROLLUP_JOB_NAME =
  'patient-immunisation-daily-rollup-v1';

type AdvisoryLockRow = {
  locked: boolean;
};

type CheckpointRow = {
  last_processed_id: string;
  high_watermark_id: string;
  completed: boolean;
};

@Injectable()
export class PatientImmunisationRollupService {
  private readonly logger = new Logger(PatientImmunisationRollupService.name);
  private rollupStarted = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('* * * * * *', { name: PATIENT_IMMUNISATION_ROLLUP_CRON_NAME })
  async runOnceDailyRollup(): Promise<void> {
    if (this.rollupStarted) return;
    this.rollupStarted = true;

    if (!this.isCronEnabled()) {
      console.log(
        `[Patient Immunisation Rollup] Cron "${PATIENT_IMMUNISATION_ROLLUP_CRON_NAME}" is disabled. Set ` +
          'PATIENT_IMMUNISATION_ROLLUP_CRON_ENABLED=true and restart the ' +
          'application to enable it.',
      );
      this.deleteCronJob();
      return;
    }

    console.log(
      `[Patient Immunisation Rollup] Cron "${PATIENT_IMMUNISATION_ROLLUP_CRON_NAME}" started at ${new Date().toISOString()}.`,
    );

    try {
      await this.runIncrementalRollup();
      console.log(
        '[Patient Immunisation Rollup] Incremental backfill completed.',
      );
    } catch (error: unknown) {
      this.logger.error(
        `[Patient Immunisation Rollup] Backfill failed: ${
          (error as Error)?.message
        }`,
        (error as Error)?.stack,
      );
      throw error;
    } finally {
      this.deleteCronJob();
    }
  }

  private async runIncrementalRollup(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let lockAcquired = false;
    try {
      lockAcquired = await this.acquireJobLock(queryRunner);
      if (!lockAcquired) {
        console.warn(
          '[Patient Immunisation Rollup] Another application instance is ' +
            'already running this backfill.',
        );
        return;
      }

      await this.ensureRollupTables(queryRunner);
      let checkpoint = await this.getOrCreateCheckpoint(queryRunner);
      if (checkpoint.completed) {
        console.log(
          '[Patient Immunisation Rollup] The persisted checkpoint is already complete.',
        );
        return;
      }

      const batchSize = this.getBatchSize();
      console.log(
        `[Patient Immunisation Rollup] Resuming after summary ID ` +
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
          PATIENT_IMMUNISATION_ROLLUP_LOCK_ID,
        ]);
      }
      await queryRunner.release();
    }
  }

  private async acquireJobLock(queryRunner: QueryRunner): Promise<boolean> {
    const result: unknown = await queryRunner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [PATIENT_IMMUNISATION_ROLLUP_LOCK_ID],
    );
    return (result as AdvisoryLockRow[])[0]?.locked === true;
  }

  private async ensureRollupTables(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS patient_immunisation_daily_rollups (
        id BIGSERIAL PRIMARY KEY,
        rollup_date date NOT NULL,
        facility_id integer NOT NULL DEFAULT 0,
        uc_id integer NOT NULL DEFAULT 0,
        status character varying(50) NOT NULL,
        remarks_bucket character varying(20) NOT NULL,
        immunisation_count bigint NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_patient_immunisation_daily_rollup_filters
          UNIQUE (
            rollup_date,
            facility_id,
            uc_id,
            status,
            remarks_bucket
          )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_patient_immunisation_daily_rollup_lookup
      ON patient_immunisation_daily_rollups (
        facility_id,
        uc_id,
        status,
        remarks_bucket,
        rollup_date
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS patient_immunisation_rollup_checkpoint (
        job_name character varying(100) PRIMARY KEY,
        last_processed_id bigint NOT NULL DEFAULT 0,
        high_watermark_id bigint NOT NULL DEFAULT 0,
        completed boolean NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('[Patient Immunisation Rollup] Rollup state tables are ready.');
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
        FROM patient_immunisations
      `);
      const highWatermarkId = String(
        (
          highWatermarkResult as Array<{
            high_watermark_id: string;
          }>
        )[0]?.high_watermark_id ?? '0',
      );

      await queryRunner.query(
        'TRUNCATE TABLE patient_immunisation_daily_rollups',
      );

      const insertedResult: unknown = await queryRunner.query(
        `
          INSERT INTO patient_immunisation_rollup_checkpoint (
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
        [PATIENT_IMMUNISATION_ROLLUP_JOB_NAME, highWatermarkId],
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
    queryRunner: QueryRunner,
    forUpdate = false,
  ): Promise<CheckpointRow | null> {
    const result: unknown = await queryRunner.query(
      `
        SELECT
          last_processed_id::text,
          high_watermark_id::text,
          completed
        FROM patient_immunisation_rollup_checkpoint
        WHERE job_name = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [PATIENT_IMMUNISATION_ROLLUP_JOB_NAME],
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
      await this.createBatchRollups(queryRunner, lastProcessedId, batchEndId);

      const completed = batchEndId >= highWatermarkId;
      await queryRunner.query(
        `
          UPDATE patient_immunisation_rollup_checkpoint
          SET
            last_processed_id = $2::bigint,
            completed = $3::boolean,
            updated_at = NOW()
          WHERE job_name = $1::character varying
        `,
        [PATIENT_IMMUNISATION_ROLLUP_JOB_NAME, batchEndId, completed],
      );

      await queryRunner.commitTransaction();
      const checkpoint = await this.findCheckpoint(queryRunner);
      if (!checkpoint) {
        throw new Error(
          'Patient immunisation rollup checkpoint disappeared after commit.',
        );
      }

      console.log(
        `[Patient Immunisation Rollup] Committed summary ID range ` +
          `(${lastProcessedId}, ${batchEndId}] in ${Date.now() - startedAt}ms.`,
      );

      return checkpoint;
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    }
  }

  private async createBatchRollups(
    queryRunner: QueryRunner,
    lastProcessedId: number,
    batchEndId: number,
  ): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO patient_immunisation_daily_rollups (
          rollup_date,
          facility_id,
          uc_id,
          status,
          remarks_bucket,
          immunisation_count,
          created_at,
          updated_at
        )
        SELECT
          DATE(patientImmunisation.created_at) AS rollup_date,
          COALESCE(patient.facility_id, 0) AS facility_id,
          COALESCE(patient.uc_id, 0) AS uc_id,
          patientImmunisation.status,
          CASE
            WHEN patientImmunisation.remarks IS NOT NULL
             AND TRIM(patientImmunisation.remarks) <> ''
            THEN 'HAS_REMARKS'
            ELSE 'NO_REMARKS'
          END AS remarks_bucket,
          COUNT(*)::bigint AS immunisation_count,
          NOW(),
          NOW()
        FROM patient_immunisations patientImmunisation
        LEFT JOIN patients patient
          ON patient.id = patientImmunisation.patient_id
        WHERE patientImmunisation.id > $1::integer
          AND patientImmunisation.id <= $2::integer
          AND patientImmunisation.created_at IS NOT NULL
        GROUP BY
          DATE(patientImmunisation.created_at),
          COALESCE(patient.facility_id, 0),
          COALESCE(patient.uc_id, 0),
          patientImmunisation.status,
          remarks_bucket
        ON CONFLICT ON CONSTRAINT uq_patient_immunisation_daily_rollup_filters
        DO UPDATE SET
          immunisation_count =
            patient_immunisation_daily_rollups.immunisation_count +
            EXCLUDED.immunisation_count,
          updated_at = NOW()
      `,
      [lastProcessedId, batchEndId],
    );
  }

  private deleteCronJob(): void {
    try {
      this.schedulerRegistry.deleteCronJob(
        PATIENT_IMMUNISATION_ROLLUP_CRON_NAME,
      );
      console.log(
        `[Patient Immunisation Rollup] One-shot cron "${PATIENT_IMMUNISATION_ROLLUP_CRON_NAME}" deleted.`,
      );
    } catch (error: unknown) {
      this.logger.warn(`deleteCronJob failed: ${(error as Error)?.message}`);
    }
  }

  private getBatchSize(): number {
    const configured = Number(
      process.env.PATIENT_IMMUNISATION_ROLLUP_BATCH_SIZE,
    );
    if (!Number.isInteger(configured)) return DEFAULT_BATCH_SIZE;
    return Math.min(Math.max(configured, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private isCronEnabled(): boolean {
    return (
      String(process.env.PATIENT_IMMUNISATION_ROLLUP_CRON_ENABLED)
        .trim()
        .toLowerCase() === 'true'
    );
  }

  private parseCheckpointId(value: string, column: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid ${column} value in patient immunisation rollup checkpoint: ${value}`,
      );
    }
    return parsed;
  }
}
