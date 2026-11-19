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

export enum YearsOfEducation {
  NoFormalEducation = 'No formal education',
  Primary = 'Primary',
  Secondary = 'Secondary',
  Intermediate = 'Intermediate',
  Diploma = 'Diploma',
  BachelorOrHigher = 'Bachelor or higher',
}

@Entity('patient_social_determinants')
export class PatientSocialDeterminants {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, { onDelete: 'CASCADE' })
  @Index('idx_patient_social_det')
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dwelling_type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  occupation_head_of_household: string;

  @Column({ type: 'int', nullable: true })
  household_members_count: number;

  @Column({ length: 15, nullable: true })
  mother_tongue: string;

  @Column({
    type: 'enum',
    enum: YearsOfEducation,
    nullable: true,
  })
  years_of_education: YearsOfEducation;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
