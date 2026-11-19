import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('immunisation_rollup_checkpoint')
export class ImmunisationRollupCheckpoint {
  @PrimaryColumn({ name: 'job_name', type: 'varchar', length: 100 })
  jobName: string;

  @Column({ name: 'last_processed_id', type: 'bigint', default: 0 })
  lastProcessedId: string;

  @Column({ name: 'high_watermark_id', type: 'bigint', default: 0 })
  highWatermarkId: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
