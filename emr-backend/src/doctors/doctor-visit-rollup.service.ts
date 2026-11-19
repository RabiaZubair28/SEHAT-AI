import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { DataSource, QueryRunner } from 'typeorm';

const DEFAULT_BATCH_SIZE = 50_000;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1_000_000;
const DOCTOR_VISIT_ROLLUP_LOCK_ID = 1_906_202_617;
const DOCTOR_VISIT_ROLLUP_CRON_NAME = 'doctor-visit-daily-rollup';
export const DOCTOR_VISIT_ROLLUP_JOB_NAME = 'doctor-visit-daily-rollup-v1';

type AdvisoryLockRow = {
  locked: boolean;
};

type CheckpointRow = {
  last_processed_id: string;
  high_watermark_id: string;
  completed: boolean;
};

@Injectable()
export class DoctorVisitRollupService {
  private readonly logger = new Logger(DoctorVisitRollupService.name);
  private rollupStarted = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  @Cron('* * * * * *', { name: DOCTOR_VISIT_ROLLUP_CRON_NAME })
  async runOnceDailyRollup(): Promise<void> {
    if (this.rollupStarted) return;
    this.rollupStarted = true;

    if (!this.isCronEnabled()) {
      console.log(
        '[Doctor Visit Rollup] Cron is disabled. Set ' +
          'DOCTOR_VISIT_ROLLUP_CRON_ENABLED=true and restart the application ' +
          'to enable it.',
      );
      this.deleteCronJob();
      return;
    }

    console.log(
      `[Doctor Visit Rollup] Cron started at ${new Date().toISOString()}.`,
    );

    try {
      await this.runIncrementalRollup();
      console.log('[Doctor Visit Rollup] Incremental backfill completed.');
    } catch (error: unknown) {
      this.logger.error(
        `[Doctor Visit Rollup] Backfill failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      console.error(
        '[Doctor Visit Rollup] Backfill failed:',
        (error as Error)?.message,
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
          '[Doctor Visit Rollup] Another application instance is already running this backfill.',
        );
        return;
      }

      let checkpoint = await this.getOrCreateCheckpoint(queryRunner);
      if (checkpoint.completed) {
        console.log(
          '[Doctor Visit Rollup] The persisted checkpoint is already complete.',
        );
        return;
      }

      const batchSize = this.getBatchSize();
      console.log(
        `[Doctor Visit Rollup] Resuming after visit ID ${checkpoint.last_processed_id}; ` +
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
          DOCTOR_VISIT_ROLLUP_LOCK_ID,
        ]);
      }
      await queryRunner.release();
    }
  }

  private async acquireJobLock(queryRunner: QueryRunner): Promise<boolean> {
    const result: unknown = await queryRunner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [DOCTOR_VISIT_ROLLUP_LOCK_ID],
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
        FROM visits
      `);
      const highWatermarkId = String(
        (
          highWatermarkResult as Array<{
            high_watermark_id: string;
          }>
        )[0]?.high_watermark_id ?? '0',
      );

      await queryRunner.query('TRUNCATE TABLE doctor_visit_daily_rollups');

      const insertedResult: unknown = await queryRunner.query(
        `
          INSERT INTO doctor_visit_rollup_checkpoint (
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
        [DOCTOR_VISIT_ROLLUP_JOB_NAME, highWatermarkId],
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
        FROM doctor_visit_rollup_checkpoint
        WHERE job_name = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [DOCTOR_VISIT_ROLLUP_JOB_NAME],
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
      await this.incrementVisitCounts(queryRunner);

      const completed = batchEndId >= highWatermarkId;
      await queryRunner.query(
        `
          UPDATE doctor_visit_rollup_checkpoint
          SET
            last_processed_id = $2::bigint,
            completed = $3::boolean,
            updated_at = NOW()
          WHERE job_name = $1::character varying
        `,
        [DOCTOR_VISIT_ROLLUP_JOB_NAME, batchEndId, completed],
      );

      await queryRunner.commitTransaction();
      const checkpoint = await this.findCheckpoint(queryRunner);
      if (!checkpoint) {
        throw new Error(
          'Doctor visit rollup checkpoint disappeared after the batch was committed.',
        );
      }

      console.log(
        `[Doctor Visit Rollup] Committed visit ID range (${lastProcessedId}, ` +
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
        CREATE TEMP TABLE doctor_visit_rollup_batch_dimensions
        ON COMMIT DROP
        AS
        SELECT DISTINCT
          visit.id AS visit_id,
          DATE(visit.visit_date) AS rollup_date,
          appointment.doctor_id
        FROM visits visit
        INNER JOIN appointments appointment
          ON appointment.visit_id = visit.id
        WHERE visit.id > $1::integer
          AND visit.id <= $2::integer
          AND visit.status IN ('in_progress', 'dispatched')
          AND appointment.doctor_id IS NOT NULL
          AND visit.visit_date IS NOT NULL
      `,
      [lastProcessedId, batchEndId],
    );
  }

  private async incrementVisitCounts(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO doctor_visit_daily_rollups (
        rollup_date,
        aggregation_type,
        doctor_id,
        visit_count,
        created_at,
        updated_at
      )
      SELECT
        rollup_date,
        'DOCTOR',
        doctor_id,
        COUNT(*)::bigint,
        NOW(),
        NOW()
      FROM doctor_visit_rollup_batch_dimensions
      GROUP BY rollup_date, doctor_id
      ON CONFLICT ON CONSTRAINT uq_doctor_visit_daily_rollup_date_type_doctor
      DO UPDATE SET
        visit_count = doctor_visit_daily_rollups.visit_count + EXCLUDED.visit_count,
        updated_at = NOW()
    `);
  }

  private deleteCronJob(): void {
    try {
      this.schedulerRegistry.deleteCronJob(DOCTOR_VISIT_ROLLUP_CRON_NAME);
      console.log('[Doctor Visit Rollup] One-shot cron deleted.');
    } catch (error: unknown) {
      this.logger.warn(`deleteCronJob failed: ${(error as Error)?.message}`);
    }
  }

  private getBatchSize(): number {
    const configured = Number(process.env.DOCTOR_VISIT_ROLLUP_BATCH_SIZE);
    if (!Number.isInteger(configured)) return DEFAULT_BATCH_SIZE;
    return Math.min(Math.max(configured, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private isCronEnabled(): boolean {
    return (
      String(process.env.DOCTOR_VISIT_ROLLUP_CRON_ENABLED)
        .trim()
        .toLowerCase() === 'true'
    );
  }

  private parseCheckpointId(value: string, column: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid ${column} value in doctor visit rollup checkpoint: ${value}`,
      );
    }
    return parsed;
  }
}
