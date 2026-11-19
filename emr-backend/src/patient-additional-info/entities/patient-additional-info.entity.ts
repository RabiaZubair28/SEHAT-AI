import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { BloodGroup, MaritalStatus } from 'src/common/enums/enums';

@Entity('patient_additional_infos')
export class PatientAdditionalInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, { onDelete: 'CASCADE' })
  @Index('idx_patient_additional_info')
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({
    type: 'enum',
    enum: MaritalStatus,
  })
  marital_status: MaritalStatus;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  blood_group: BloodGroup;

  @Column({ length: 50, nullable: true })
  guardian_name: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
