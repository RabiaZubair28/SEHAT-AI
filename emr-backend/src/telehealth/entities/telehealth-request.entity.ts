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
import { User } from 'src/users/entities/user.entity';
import { TelehealthSession } from './telehealth-session.entity';
import { TelehealthConsultationNote } from './telehealth-consultation-note.entity';
import { TelehealthRequestStatus } from '../enums/telehealth.enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('telehealth_requests')
export class TelehealthRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id', type: 'int' })
  patientId: number;

  @ManyToOne(() => Patient, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'appointment_service_id', type: 'int' })
  appointmentServiceId: number;

  @ManyToOne(() => AppointmentService, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ name: 'requesting_doctor_id', type: 'int' })
  requestingDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesting_doctor_id' })
  requestingDoctor: User;

  @Column({ name: 'consultant_doctor_id', type: 'int' })
  consultantDoctorId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultant_doctor_id' })
  consultantDoctor: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialty: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: TelehealthRequestStatus,
    default: TelehealthRequestStatus.PENDING,
  })
  status: TelehealthRequestStatus;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamp' })
  requestedAt: Date;

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason: string;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @OneToOne(() => TelehealthSession, (session) => session.request)
  session: TelehealthSession;

  @OneToOne(() => TelehealthConsultationNote, (note) => note.request)
  consultationNote: TelehealthConsultationNote;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}
