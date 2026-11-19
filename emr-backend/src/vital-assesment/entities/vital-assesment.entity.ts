import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  ContraceptiveMethod,
  DehydrationLevel,
} from 'src/common/enums/enums';
import { Visit } from 'src/visit/entities/visit.entity';
import { ValidateIf } from 'class-validator';

@Entity('vital_assessments')
export class VitalAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Appointment)
  @Index('idx_vital_assessments_appt')
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @OneToOne(() => Visit)
  @Index('idx_vital_assessments_visit')
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @Column({ type: 'double precision', default: 0 }) // in kg
  weight: number;

  @Column({ type: 'double precision', default: 0 }) // in inches
  height: number;

  @Column({ type: 'double precision', default: 0 })
  body_mass_index: number;

  @Column({ type: 'double precision', default: 0 })
  pulse: number;

  @Column({ type: 'double precision', nullable: true })
  systolic_bp: number;

  @Column({ type: 'double precision', nullable: true })
  diastolic_bp: number;

  @Column({ type: 'double precision', default: 0 })
  temperature: number;

  @Column({ type: 'double precision', default: 0 })
  respiratory_rate: number;

  // General Screening
  @Column({ type: 'double precision', nullable: true })
  spo2: number;

  @Column({ type: 'boolean', nullable: true })
  is_anemic: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_dehydrated: boolean;

  @Column({
    type: 'enum',
    enum: DehydrationLevel,
    nullable: true,
  })
  dehydration_level: DehydrationLevel;

  @Column({ type: 'boolean', nullable: true })
  cough_gt_2_weeks: boolean;

  @Column({ type: 'boolean', nullable: true })
  family_planning_user: boolean;

  @Column({
    type: 'enum',
    enum: ContraceptiveMethod,
    array: true,
    nullable: true,
  })
  @ValidateIf((o) => o.family_planning_user === true)
  family_planning_methods?: ContraceptiveMethod[];
}
