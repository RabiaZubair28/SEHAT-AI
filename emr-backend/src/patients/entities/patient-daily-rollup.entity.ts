import { PatientDailyRollupType } from 'src/common/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patient_daily_rollups')
@Unique('uq_patient_daily_rollup_date_type_dimension', [
  'rollupDate',
  'aggregationType',
  'dimensionId',
])
@Index('idx_patient_daily_rollup_lookup', [
  'aggregationType',
  'dimensionId',
  'rollupDate',
])
export class PatientDailyRollup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'rollup_date', type: 'date' })
  rollupDate: string;

  @Column({ name: 'aggregation_type', type: 'varchar', length: 20 })
  aggregationType: PatientDailyRollupType;

  @Column({ name: 'dimension_id', type: 'int', default: 0 })
  dimensionId: number;

  @Column({ name: 'patient_count', type: 'bigint', default: 0 })
  patientCount: string;

  @Column({ name: 'male_count', type: 'bigint', default: 0 })
  maleCount: string;

  @Column({ name: 'female_count', type: 'bigint', default: 0 })
  femaleCount: string;

  @Column({ name: 'other_count', type: 'bigint', default: 0 })
  otherCount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
