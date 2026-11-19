import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('doctor_visit_daily_rollups')
@Unique('uq_doctor_visit_daily_rollup_date_type_doctor', [
  'rollupDate',
  'aggregationType',
  'doctorId',
])
@Index('idx_doctor_visit_daily_rollup_lookup', [
  'aggregationType',
  'doctorId',
  'rollupDate',
])
export class DoctorVisitDailyRollup {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'rollup_date', type: 'date' })
  rollupDate: string;

  @Column({ name: 'aggregation_type', type: 'varchar', length: 20 })
  aggregationType: string;

  @Column({ name: 'doctor_id', type: 'int' })
  doctorId: number;

  @Column({ name: 'visit_count', type: 'bigint', default: 0 })
  visitCount: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
