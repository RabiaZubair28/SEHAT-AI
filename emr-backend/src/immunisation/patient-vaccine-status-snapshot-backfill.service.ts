import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { DataSource, QueryRunner } from 'typeorm';
import { ImmunisationService } from './immunisation.service';

const DEFAULT_BATCH_SIZE = 500;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 10_000;
const SNAPSHOT_BACKFILL_LOCK_ID = 1_906_202_618;
const SNAPSHOT_BACKFILL_CRON_NAME =
  'patient-vaccine-status-snapshot-backfill';
const SNAPSHOT_BACKFILL_JOB_NAME =
  'patient-vaccine-status-snapshot-backfill-v1';

type AdvisoryLockRow = {
  locked: boolean;
};

type CheckpointRow = {
  last_processed_patient_id: string;
  high_watermark_patient_id: string;
  completed: boolean;
};

@Injectable()
export class PatientVaccineStatusSnapshotBackfillService {
  private readonly logger = new Logger(
    PatientVaccineStatusSnapshotBackfillService.name,
  );
  private backfillStarted = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly immunisationService: ImmunisationService,
  ) {}

  @Cron('* * * * * *', { name: SNAPSHOT_BACKFILL_CRON_NAME })
  async runOnceSnapshotBackfill(): Promise<void> {
    if (this.backfillStarted) return;
    this.backfillStarted = true;

    console.log('[Patient Vaccine Snapshot Backfill] Env config:', {
      cronEnabled: process.env.PATIENT_VACCINE_STATUS_SNAPSHOT_CRON_ENABLED,
      batchSize: process.env.PATIENT_VACCINE_STATUS_SNAPSHOT_BATCH_SIZE,
    });

    if (!this.isCronEnabled()) {
      console.log(
        '[Patient Vaccine Snapshot Backfill] Cron is disabled. Set ' +
          'PATIENT_VACCINE_STATUS_SNAPSHOT_CRON_ENABLED=true and restart ' +
          'the application to enable it.',
      );
      this.deleteCronJob();
      return;
    }

    console.log(
      `[Patient Vaccine Snapshot Backfill] Cron started at ${new Date().toISOString()}.`,
    );
    console.log(
      '[Patient Vaccine Snapshot Backfill] Scope: all patients.',
    );

    try {
      await this.runIncrementalBackfill();
      console.log(
        '[Patient Vaccine Snapshot Backfill] Incremental backfill completed.',
      );
    } catch (error: unknown) {
      console.error(
        '[Patient Vaccine Snapshot Backfill] Backfill failed:',
        (error as Error)?.message,
      );
      this.logger.error(
        `[Patient Vaccine Snapshot Backfill] Backfill failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw error;
    } finally {
      this.deleteCronJob();
    }
  }

  private async runIncrementalBackfill(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let lockAcquired = false;
    try {
      lockAcquired = await this.acquireJobLock(queryRunner);
      if (!lockAcquired) {
        console.warn(
          '[Patient Vaccine Snapshot Backfill] Another application instance is already running this backfill.',
        );
        return;
      }

      await this.ensureCheckpointTable(queryRunner);

      let checkpoint = await this.getOrCreateCheckpoint(queryRunner);
      if (checkpoint.completed) {
        console.log(
          '[Patient Vaccine Snapshot Backfill] The persisted checkpoint is already complete.',
        );
        return;
      }

      const batchSize = this.getBatchSize();
      console.log(
        `[Patient Vaccine Snapshot Backfill] Resuming after patient ID ` +
          `${checkpoint.last_processed_patient_id}; high watermark is ` +
          `${checkpoint.high_watermark_patient_id}; batch size is ${batchSize}.`,
      );

      while (!checkpoint.completed) {
        checkpoint = await this.processBatch(
          queryRunner,
          checkpoint,
          batchSize,
        );
      }
    } finally {
      if (lockAcquired) {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [
          SNAPSHOT_BACKFILL_LOCK_ID,
        ]);
      }
      await queryRunner.release();
    }
  }

  private async acquireJobLock(queryRunner: QueryRunner): Promise<boolean> {
    const result: unknown = await queryRunner.query(
      'SELECT pg_try_advisory_lock($1) AS locked',
      [SNAPSHOT_BACKFILL_LOCK_ID],
    );
    return (result as AdvisoryLockRow[])[0]?.locked === true;
  }

  private async ensureCheckpointTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS patient_vaccine_status_snapshot_checkpoint (
        job_name character varying(100) PRIMARY KEY,
        last_processed_patient_id bigint NOT NULL DEFAULT 0,
        high_watermark_patient_id bigint NOT NULL DEFAULT 0,
        completed boolean NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async getOrCreateCheckpoint(
    queryRunner: QueryRunner,
  ): Promise<CheckpointRow> {
    await queryRunner.startTransaction();
    try {
      await queryRunner.query("SET LOCAL statement_timeout = '0'");

      const existing = await this.findCheckpoint(queryRunner, true);
      if (existing) {
        await queryRunner.commitTransaction();
        return existing;
      }

      const highWatermarkResult: unknown = await queryRunner.query(`
        SELECT COALESCE(MAX(patient.id), 0)::bigint AS high_watermark_patient_id
        FROM patients patient
      `);
      const highWatermarkPatientId = String(
        (
          highWatermarkResult as Array<{
            high_watermark_patient_id: string;
          }>
        )[0]?.high_watermark_patient_id ?? '0',
      );

      const insertedResult: unknown = await queryRunner.query(
        `
          INSERT INTO patient_vaccine_status_snapshot_checkpoint (
            job_name,
            last_processed_patient_id,
            high_watermark_patient_id,
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
            last_processed_patient_id::text,
            high_watermark_patient_id::text,
            completed
        `,
        [SNAPSHOT_BACKFILL_JOB_NAME, highWatermarkPatientId],
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
          last_processed_patient_id::text,
          high_watermark_patient_id::text,
          completed
        FROM patient_vaccine_status_snapshot_checkpoint
        WHERE job_name = $1
        ${forUpdate ? 'FOR UPDATE' : ''}
      `,
      [SNAPSHOT_BACKFILL_JOB_NAME],
    );
    return (result as CheckpointRow[])[0] ?? null;
  }

  private async processBatch(
    queryRunner: QueryRunner,
    checkpoint: CheckpointRow,
    batchSize: number,
  ): Promise<CheckpointRow> {
    const startedAt = Date.now();
    const lastProcessedPatientId = this.parseCheckpointId(
      checkpoint.last_processed_patient_id,
      'last_processed_patient_id',
    );
    const highWatermarkPatientId = this.parseCheckpointId(
      checkpoint.high_watermark_patient_id,
      'high_watermark_patient_id',
    );

    const patientRows: Array<{ id: string | number }> = await queryRunner.query(
      `
        SELECT DISTINCT patient.id AS id
        FROM patients patient
        WHERE patient.id > $1::integer
          AND patient.id <= $2::integer
        ORDER BY patient.id ASC
        LIMIT $3::integer
      `,
      [lastProcessedPatientId, highWatermarkPatientId, batchSize],
    );

    console.log(
      `[Patient Vaccine Snapshot Backfill] Loaded ${patientRows.length} ` +
        `patient(s) after ID ${lastProcessedPatientId}.`,
    );

    if (!patientRows.length) {
      await this.updateCheckpoint(
        queryRunner,
        highWatermarkPatientId,
        true,
      );
      const completedCheckpoint = await this.findCheckpoint(queryRunner);
      if (!completedCheckpoint) {
        throw new Error(
          'Patient vaccine status snapshot checkpoint disappeared after completion.',
        );
      }
      return completedCheckpoint;
    }

    let latestProcessedPatientId = lastProcessedPatientId;
    let succeeded = 0;
    let failed = 0;
    for (const row of patientRows) {
      const patientId = this.parseCheckpointId(row.id, 'patient_id');
      console.log(
        `[Patient Vaccine Snapshot Backfill] Refreshing patient ID ${patientId}.`,
      );
      latestProcessedPatientId = patientId;
      try {
        await this.immunisationService.refreshPatientVaccineStatusSnapshot(
          patientId,
          queryRunner.manager,
        );
        succeeded += 1;
      } catch (error: unknown) {
        failed += 1;
        this.logger.error(
          `[Patient Vaccine Snapshot Backfill] Failed patient ID ${patientId}: ${(error as Error)?.message}`,
          (error as Error)?.stack,
        );
        console.error(
          `[Patient Vaccine Snapshot Backfill] Failed patient ID ${patientId}:`,
          (error as Error)?.message,
        );
      }
    }

    const completed = latestProcessedPatientId >= highWatermarkPatientId;
    await this.updateCheckpoint(
      queryRunner,
      latestProcessedPatientId,
      completed,
    );

    const updatedCheckpoint = await this.findCheckpoint(queryRunner);
    if (!updatedCheckpoint) {
      throw new Error(
        'Patient vaccine status snapshot checkpoint disappeared after batch.',
      );
    }

    console.log(
      `[Patient Vaccine Snapshot Backfill] Processed ${patientRows.length} ` +
        `patient(s) through ID ${latestProcessedPatientId}; ` +
        `succeeded=${succeeded}, failed=${failed} in ` +
        `${Date.now() - startedAt}ms.`,
    );

    return updatedCheckpoint;
  }

  private async updateCheckpoint(
    queryRunner: QueryRunner,
    lastProcessedPatientId: number,
    completed: boolean,
  ): Promise<void> {
    await queryRunner.query(
      `
        UPDATE patient_vaccine_status_snapshot_checkpoint
        SET
          last_processed_patient_id = $2::bigint,
          completed = $3::boolean,
          updated_at = NOW()
        WHERE job_name = $1::character varying
      `,
      [SNAPSHOT_BACKFILL_JOB_NAME, lastProcessedPatientId, completed],
    );
  }

  private deleteCronJob(): void {
    try {
      this.schedulerRegistry.deleteCronJob(SNAPSHOT_BACKFILL_CRON_NAME);
      console.log(
        '[Patient Vaccine Snapshot Backfill] One-shot cron deleted.',
      );
    } catch (error: unknown) {
      this.logger.warn(`deleteCronJob failed: ${(error as Error)?.message}`);
    }
  }

  private getBatchSize(): number {
    const configured = Number(
      process.env.PATIENT_VACCINE_STATUS_SNAPSHOT_BATCH_SIZE,
    );
    if (!Number.isInteger(configured)) return DEFAULT_BATCH_SIZE;
    return Math.min(Math.max(configured, MIN_BATCH_SIZE), MAX_BATCH_SIZE);
  }

  private isCronEnabled(): boolean {
    return (
      String(process.env.PATIENT_VACCINE_STATUS_SNAPSHOT_CRON_ENABLED)
        .trim()
        .toLowerCase() === 'true'
    );
  }

  private parseCheckpointId(value: string | number, column: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid ${column} value in patient vaccine status snapshot checkpoint: ${value}`,
      );
    }
    return parsed;
  }
}
