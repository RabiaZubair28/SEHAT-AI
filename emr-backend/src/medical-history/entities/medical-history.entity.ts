import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('medical_histories')
export class MedicalHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, (patient) => patient.medicalHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'jsonb', nullable: true })
  allergies: any;

  @Column({ type: 'jsonb', nullable: true })
  previous_illness: any;

  @Column({ type: 'jsonb', nullable: true })
  addictions: any;

  @ManyToOne(() => User, (user) => user.createdMedicalHistories, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
