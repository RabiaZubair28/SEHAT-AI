import { ImmunisationDailyRollupType } from 'src/common/enums/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('immunisation_daily_rollups')
@Unique('uq_immunisation_daily_rollup_date_type_dimension', [
  'rollupDate',
  'aggregationType',
  'dimensionId',
])
@Index('idx_immunisation_daily_rollup_lookup', [
  'aggregationType',
  'dimensionId',
  'rollupDate',
])
export class ImmunisationDailyRollup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'rollup_date', type: 'date' })
  rollupDate: string;

  @Column({ name: 'aggregation_type', type: 'varchar', length: 20 })
  aggregationType: ImmunisationDailyRollupType;

  /**
   * Zero represents the TOTAL bucket. Other values are IDs belonging to the
   * entity identified by aggregationType.
   */
  @Column({ name: 'dimension_id', type: 'int', default: 0 })
  dimensionId: number;

  @Column({ name: 'dose_count', type: 'bigint', default: 0 })
  doseCount: string;

  @Column({ name: 'distinct_patient_count', type: 'bigint', default: 0 })
  distinctPatientCount: string;

  @Column({ name: 'distinct_vaccine_count', type: 'int', default: 0 })
  distinctVaccineCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
