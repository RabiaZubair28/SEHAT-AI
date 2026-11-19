import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import {
  PatientOutcome,
  LevelOfCare,
  EmergencyOutcomeServiceType,
} from 'src/common/enums/enums';
import { EmergencyPatient } from './emergency-patient.entity';
import { District } from 'src/districts/entities/district.entity';
import { Facility } from 'src/facilities/entities/facility.entity';

@Entity('emergency_outcomes')
export class EmergencyOutcome {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => EmergencyPatient, (patient) => patient.outcome, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emergency_patient_id' })
  patient: EmergencyPatient;

  @Column({ type: 'enum', enum: PatientOutcome })
  outcome: PatientOutcome;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district?: District;

  @Column({
    type: 'enum',
    enum: LevelOfCare,
    nullable: true,
  })
  level_of_care?: LevelOfCare;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility?: Facility;

  @Column({
    type: 'enum',
    enum: EmergencyOutcomeServiceType,
    nullable: true,
  })
  type_of_service?: EmergencyOutcomeServiceType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  other_service?: string;

  @Column({ type: 'text', nullable: true })
  reason_of_referral?: string;
}
