import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import {
  Sex,
  ChildCondition,
  NewbornSymptomsAssessment,
  DeliveryProgressStatus,
  BabyDeathCauses,
} from '../../common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { Patient } from 'src/patients/entities/patient.entity';

@Entity('newborn_assessments')
export class NewbornAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.newbornAssesment,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService

  @OneToOne(() => Patient, (patient) => patient.newbornAssessments, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'patient_id' })
  patient?: Patient;

  @OneToOne(() => Immunisation, (immunisation) => immunisation.newbornAssessment, {
    nullable: true,
  })
  @JoinColumn({ name: 'immunisation_id' })
  immunisation?: Immunisation;

  @Column({ type: 'enum', enum: Sex, nullable: true })
  sex: Sex;

  @Column({ type: 'enum', enum: ChildCondition, nullable: true })
  condition: ChildCondition;

  @Column({ type: 'double precision', nullable: true })
  weight: number;

  @Column({ type: 'double precision', nullable: true })
  temperature: number;

  @Column({ type: 'double precision', nullable: true })
  muac: number;

  @Column({ type: 'double precision', nullable: true })
  headCircumference: number;

  @Column({ type: 'int', nullable: true })
  apgarScore: number;

  @Column({
    type: 'enum',
    enum: NewbornSymptomsAssessment,
    array: true,
    nullable: true,
  })
  symptomsAssessment: NewbornSymptomsAssessment[];

  @Column({ nullable: true })
  otherSymptom: string;

  @Column({ type: 'boolean', default: false })
  kmcAdministered: boolean;

  @Column({ type: 'boolean', default: false })
  breastfeedingInitiated: boolean;

  @Column({ type: 'boolean', nullable: true })
  medicineProvided?: boolean;

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

  @Column({ type: 'boolean', default: false })
  congenitalAnomaly?: boolean;

  @Column({
    type: 'enum',
    enum: BabyDeathCauses,
    array: true,
    nullable: true,
  })
  causeOfDeath?: BabyDeathCauses[];

  @Column({ type: 'enum', enum: DeliveryProgressStatus, default: DeliveryProgressStatus.CONTINUE })
  status: DeliveryProgressStatus;
}
