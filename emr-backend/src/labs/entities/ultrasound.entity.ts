import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  FetalPresentation,
  PlacentaPosition,
  PregnancyType,
  FetalAttitude,
  FetalMovement,
  UltrasoundReportings,
} from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('ultrasounds')
export class Ultrasound {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.ultrasound,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  //codebook
  @Column({ name: 'requires_ultrasound', type: 'boolean', default: false })
  requiresUltrasound: boolean;

  @Column({
    name: 'ultrasound_machine_available',
    type: 'boolean',
    nullable: true,
  })
  ultrasoundMachineAvailable: boolean;

  @Column({
    name: 'type_of_pregnancy',
    type: 'enum',
    enum: PregnancyType,
    nullable: true,
  })
  typeOfPregnancy?: PregnancyType;

  @Column({
    name: 'fetal_movement',
    type: 'enum',
    enum: FetalMovement,
    nullable: true,
  })
  fetalMovement: FetalMovement;

  @Column({
    name: 'fetal_presentation',
    type: 'enum',
    enum: FetalPresentation,
    nullable: true,
  })
  fetalPresentation?: FetalPresentation;

  @Column({ type: 'enum', enum: FetalAttitude, nullable: true })
  attitude: FetalAttitude;

  @Column({
    name: 'placenta',
    type: 'enum',
    enum: PlacentaPosition,
    nullable: true,
  })
  placenta: PlacentaPosition;

  @Column({ name: 'amniotic_fluid_index', type: 'double precision', nullable: true })
  amnioticFluidIndex: number;

  @Column({ name: 'fetal_heart_rate', type: 'double precision', nullable: true })
  fetalHeartRate: number;

  @Column({ name: 'fundal_height', type: 'double precision', nullable: true })
  fundalHeight: number;

  @Column({
    name: 'ultrasound_reporting',
    type: 'simple-array',
    nullable: true,
  })
  ultrasoundReporting: UltrasoundReportings[];

  @Column({
    name: 'other_ultrasound_reporting',
    type: 'text',
    nullable: true,
  })
  otherUltrasoundReporting?: string;

  @Column({
    name: 'gestational_age_weeks',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  gestationalAgeWeeks: string;

  @Column({ name: 'ultrasound_observations', type: 'text', nullable: true })
  ultrasoundObservations: string;
}
