import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { ImmunisationDosageStatus } from 'src/common/enums/enums';

@Entity('patient_immunisations')
@Index('idx_pi_status', ['status'])
@Index('idx_pi_next_due_date', ['nextDueDate'])
export class PatientImmunisation {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, (patient) => patient.patientImmunisation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: ImmunisationDosageStatus,
    default: ImmunisationDosageStatus.PENDING,
  })
  status: ImmunisationDosageStatus;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'boolean', default: false })
  updated: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
