import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { User } from 'src/users/entities/user.entity';
import { TelehealthRequest } from './telehealth-request.entity';

@Entity('telehealth_consultation_notes')
export class TelehealthConsultationNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'request_id', type: 'int' })
  requestId: number;

  @OneToOne(() => TelehealthRequest, (request) => request.consultationNote, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'request_id' })
  request: TelehealthRequest;

  @Column({ name: 'patient_id', type: 'int' })
  patientId: number;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'appointment_id', type: 'int', nullable: true })
  appointmentId: number;

  @ManyToOne(() => Appointment, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'consultant_doctor_id', type: 'int' })
  consultantDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_doctor_id' })
  consultantDoctor: User;

  @Column({ name: 'primary_doctor_id', type: 'int', nullable: true })
  primaryDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'primary_doctor_id' })
  primaryDoctor: User;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
