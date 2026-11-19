import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { EmergencyPatient } from './emergency-patient.entity';

@Entity('emergency_vitals')
export class EmergencyVital {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => EmergencyPatient, (patient) => patient.vitals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emergency_patient_id' })
  patient: EmergencyPatient;

  @Column({ type: 'double precision', nullable: true })
  temperature?: number;

  @Column({ type: 'double precision', nullable: true })
  pulse?: number;

  @Column({ type: 'double precision', nullable: true })
  systolic_bp?: number;

  @Column({ type: 'double precision', nullable: true })
  diastolic_bp?: number;

  @Column({ type: 'double precision', nullable: true })
  respiratory_rate?: number;

  @Column({ type: 'double precision', nullable: true })
  spo2?: number;
}
