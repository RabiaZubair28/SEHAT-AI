import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import {
  TypeOfDelivery,
  CSectionReason,
  MotherCondition,
  SymptomsAssessment,
  ImmediateSteps,
  Complications,
  DeliveryProgressStatus,
  MotherDeathCauses,
} from '../../common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('post_delivery_assessments')
export class PostDeliveryAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => AppointmentService, (as) => as.postDeliveryAssesment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ type: 'enum', enum: TypeOfDelivery })
  typeOfDelivery: TypeOfDelivery;

  @Column({ type: 'enum', enum: CSectionReason, nullable: true })
  reasonForCSection: CSectionReason;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  otherReasonForCSection?: string;

  @Column({ type: 'enum', enum: MotherCondition })
  motherCondition: MotherCondition;

  @Column({
    type: 'enum',
    enum: SymptomsAssessment,
    array: true,
    nullable: true,
  })
  symptomsAssessment: SymptomsAssessment[];

  @Column({
    type: 'enum',
    enum: ImmediateSteps,
    array: true,
    nullable: true,
  })
  immediateSteps: ImmediateSteps[];

  @Column({
    type: 'enum',
    enum: Complications,
    array: true,
    nullable: true,
  })
  complications: Complications[];

  @Column({ nullable: true })
  otherComplication: string;

  @Column({ type: 'double precision', nullable: true })
  temperature: number;

  @Column({ type: 'double precision', nullable: true })
  pulse: number;

  @Column({ type: 'double precision', nullable: true })
  systolicBP: number;

  @Column({ type: 'double precision', nullable: true })
  diastolicBP: number;

  @Column({ type: 'double precision', nullable: true })
  respiratoryRate: number;

  @Column({ type: 'double precision', nullable: true })
  rbs: number;

  @Column({ type: 'double precision', nullable: true })
  hb: number;

  @Column({ type: 'double precision', nullable: true })
  spo2: number;

  /**
   * Stored: medicine_variant_id, quantity.
   * Hydrated at read time by hydrateMedicinesAdministered():
   *   medicine_id, medicine_name, variant_unit, variant_strength.
   * See: ES-774
   */
  @Column({ type: 'json', nullable: true })
  medicinesAdministered?: {
    medicine_variant_id: number;
    quantity: number;
    medicine_id: number | null;
    medicine_name: string | null;
    variant_unit: string | null;
    variant_strength: string | null;
  }[];

  @Column({
    type: 'enum',
    enum: MotherDeathCauses,
    array: true,
    nullable: true,
  })
  causeOfDeath?: MotherDeathCauses[];

  @Column({ type: 'enum', enum: DeliveryProgressStatus, default: DeliveryProgressStatus.CONTINUE })
  status: DeliveryProgressStatus;
}
