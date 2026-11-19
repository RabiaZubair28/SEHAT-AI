import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BloodGroup, PncWarningSign } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('pnc_vital_assessments')
export class PncVitalAssesment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.ancVitalAssessment,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ type: 'double precision', default: 0 }) // in kg
  weight: number;

  @Column({ type: 'double precision', default: 0 }) // in inches
  height: number;

  @Column({ type: 'double precision', default: 0 })
  systolic_bp: number;

  @Column({ type: 'double precision', default: 0 })
  diastolic_bp: number;

  @Column({ type: 'double precision', default: 0 })
  temperature: number;

  @Column({ type: 'double precision', default: 0 })
  pulse: number;

  @Column({ type: 'double precision', default: 0 })
  spo2: number;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  blood_group?: BloodGroup;

  // PNC Specific Screening
  @Column({ type: 'double precision', default: 0 })
  haemoglobin: number;

  @Column({ type: 'double precision', default: 0 })
  blood_sugar_random: number;

  @Column({ type: 'double precision', default: 0 })
  muac: number;

  @Column({
    type: 'enum',
    enum: PncWarningSign,
    array: true,
  })
  warning_signs: PncWarningSign[];

  @Column({
    name: 'other_pnc_warning_sign',
    type: 'text',
    nullable: true,
  })
  otherWarningSign?: string;
}
