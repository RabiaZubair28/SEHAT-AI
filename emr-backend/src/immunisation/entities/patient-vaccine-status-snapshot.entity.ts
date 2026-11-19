import { ImmunisationDosageStatus } from 'src/common/enums/enums';
import { Patient } from 'src/patients/entities/patient.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Vaccine } from './vaccine.entity';

@Entity('patient_vaccine_status_snapshots')
@Unique('uq_patient_vaccine_status_snapshot', ['patientId', 'vaccineId'])
@Index('idx_patient_vaccine_status_patient', ['patientId'])
@Index('idx_patient_vaccine_status_updated_at', ['updatedAt'])
@Index('idx_patient_vaccine_status_patient_updated', ['patientId', 'updatedAt'])
export class PatientVaccineStatusSnapshot {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'patient_id', type: 'int' })
  patientId: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'vaccine_id', type: 'int' })
  vaccineId: number;

  @ManyToOne(() => Vaccine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vaccine_id' })
  vaccine: Vaccine;

  @Column({ type: 'varchar', length: 50 })
  status: ImmunisationDosageStatus;

  @Column({ name: 'date_administered', type: 'date', nullable: true })
  dateAdministered: Date | null;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate: Date | null;

  @Column({ name: 'calculated_at', type: 'timestamp', default: () => 'NOW()' })
  calculatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
