import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Albumin, BloodGroup, WarningSign } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('anc_vital_assessments')
export class AncVitalAssesment {
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
  temperature: number;

  @Column({ type: 'double precision', default: 0 })
  pulse: number;

  @Column({ type: 'double precision', default: 0 })
  body_mass_index: number;

  @Column({ type: 'double precision', default: 0 }) // in kgs
  change_in_weight: number;

  @Column({ type: 'double precision', default: 0 })
  systolic_bp: number;

  @Column({ type: 'double precision', default: 0 })
  diastolic_bp: number;

  @Column({ type: 'double precision', default: 0 })
  respiratory_rate: number;

  @Column({ type: 'double precision', default: 0 })
  spo2: number;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  blood_group?: BloodGroup;

  // ANC Specific Screening
  @Column({ type: 'double precision', default: 0 })
  haemoglobin: number;

  @Column({ type: 'double precision', nullable: true })
  fundal_height?: number;

  @Column({ type: 'double precision', nullable: true })
  blood_sugar_random?: number;

  @Column({
    type: 'enum',
    enum: Albumin,
    nullable: true,
  })
  albumin_urine_dipstick?: Albumin;

  @Column({ type: 'double precision', default: 0 })
  muac: number;

  @Column({
    type: 'enum',
    enum: WarningSign,
    array: true,
    default: [],
  })
  warning_signs: WarningSign[];

  @Column({
    type: 'text',
    nullable: true
  })
  otherWarningSign: string;
}
