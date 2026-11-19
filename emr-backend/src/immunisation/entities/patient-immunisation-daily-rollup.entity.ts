import { ImmunisationDosageStatus } from 'src/common/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('patient_immunisation_daily_rollups')
@Unique('uq_patient_immunisation_daily_rollup_filters', [
  'rollupDate',
  'facilityId',
  'ucId',
  'status',
  'remarksBucket',
])
@Index('idx_patient_immunisation_daily_rollup_lookup', [
  'facilityId',
  'ucId',
  'status',
  'remarksBucket',
  'rollupDate',
])
export class PatientImmunisationDailyRollup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'rollup_date', type: 'date' })
  rollupDate: string;

  @Column({ name: 'facility_id', type: 'int', default: 0 })
  facilityId: number;

  @Column({ name: 'uc_id', type: 'int', default: 0 })
  ucId: number;

  @Column({ type: 'varchar', length: 50 })
  status: ImmunisationDosageStatus;

  @Column({ name: 'remarks_bucket', type: 'varchar', length: 20 })
  remarksBucket: 'HAS_REMARKS' | 'NO_REMARKS';

  @Column({ name: 'immunisation_count', type: 'bigint', default: 0 })
  immunisationCount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
