import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';
import { PatientStatus } from 'src/common/enums/enums';
import { AppointmentService } from './appointment-service.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { AppointmentDoctor } from './appointment-doctor.entity';

@Entity('appointments')
export class Appointment extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  token_number: string;

  @Index('idx_appointments_patient_id')
  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
  @Column({ name: 'patient_id' })
  patient_id: number;

  @ManyToOne(() => User)
  @Index('idx_appointments_doctor_id')
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @OneToMany(() => AppointmentDoctor, (ad) => ad.appointment, {
    cascade: true,
  })
  appointmentDoctors: AppointmentDoctor[];

  @OneToMany(() => AppointmentService, (as) => as.appointment, {
    eager: true,
    cascade: true,
  })
  appointmentServices: AppointmentService[];

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.PENDING,
  })
  status: PatientStatus;

  @OneToOne(() => PatientQueue, (queue) => queue.appointment)
  patientQueue: PatientQueue;

  @OneToOne(() => VitalAssessment, (assessment) => assessment.appointment, {
    cascade: true,
    eager: true,
  })
  vitalAssessment: VitalAssessment;

  @ManyToOne(() => Facility, (facility) => facility.appointments, {
    eager: true,
  })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ManyToOne(() => Visit, (visit) => visit.appointments, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @Index('idx_appointments_visit')
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;
  @Column({ name: 'visit_id', nullable: true })
  visit_id: number | null;
}
