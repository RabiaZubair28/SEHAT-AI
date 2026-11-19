import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import {
  AmnioticFluidColor,
  BloodGroup,
  DeliveryProgressStatus,
  HighRiskSign,
  MembraneRuptureDuration,
  PreDeliverySymptomsAssessment,
  Trimester,
} from '../../common/enums/enums';
import { NotOlderThan10Months } from 'src/common/validators/not-older-than-10-months.validator';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('pre_delivery_assessments')
export class PreDeliveryAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.preDeliveryAssesment,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService

  @Column({ nullable: true })
  @NotOlderThan10Months()
  lmp: Date;

  @Column({ type: 'float' })
  gestational_age: number;

  @Column({ type: 'enum', enum: Trimester })
  trimester: Trimester;

  @Column({ type: 'enum', enum: BloodGroup, nullable: true })
  blood_group?: BloodGroup;

  @Column({
    type: 'enum',
    enum: HighRiskSign,
    nullable: true,
    array: true
  })
  high_risk_signs: HighRiskSign[];

  @Column({
    type: 'varchar',
    nullable: true,
  })
  other_high_risk_sign?: string;

  @Column({ type: 'double precision', default: 0 })
  temperature: number;

  @Column({ type: 'double precision', default: 0 })
  pulse: number;

  @Column({ type: 'double precision', default: 0 })
  systolicBP: number;

  @Column({ type: 'double precision', default: 0 })
  diastolicBP: number;

  @Column({ type: 'double precision', default: 0 })
  respiratoryRate: number;

  @Column({ type: 'double precision', default: 0 })
  spo2: number;

  @Column({ type: 'boolean' })
  fetalMovement: boolean;

  @Column({ type: 'double precision', nullable: true })
  fetalHeartRate: number;

  @Column({ type: 'double precision', default: 0 })
  cervicalDilation: number;

  @Column({ type: 'boolean' })
  membraneRuptured?: boolean;

  @Column({ type: 'enum', enum: MembraneRuptureDuration, nullable: true })
  hoursSinceRupture: MembraneRuptureDuration;

  @Column({ type: 'enum', enum: AmnioticFluidColor })
  amnioticFluidColor: AmnioticFluidColor;

  @Column({
    type: 'enum',
    enum: PreDeliverySymptomsAssessment,
    array: true,
    nullable: true,
  })
  symptomsAssessment: PreDeliverySymptomsAssessment[];

  @Column({ type: 'enum', enum: DeliveryProgressStatus, default: DeliveryProgressStatus.CONTINUE })
  status: DeliveryProgressStatus;
}
