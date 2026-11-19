import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {
  IdentityProvider,
  EmergencyServiceType,
  BloodGroup,
  Gender,
  NationalityStatus,
} from 'src/common/enums/enums';
import { EmergencyVital } from './emergency-vital.entity';
import { EmergencyOutcome } from './emergency-outcome.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('emergency_patients')
export class EmergencyPatient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;
  @Column({ type: 'varchar', unique: true, nullable: true })
  er_no: string;
  @Column({
    type: 'enum',
    enum: IdentityProvider,
    nullable: true,
  })
  identity_provider?: IdentityProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  other_identity_provider?: string;

  @Column({
    type: 'enum',
    enum: NationalityStatus,
    nullable: true,
  })
  nationality_status?: NationalityStatus;

  @Column({ type: 'varchar', length: 15, nullable: true })
  cnic?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  international_id?: string;

  @Column({ type: 'varchar', length: 12 })
  mobile_no: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  age?: string;

  @Column({
    type: 'enum',
    enum: Gender,
    name: 'sex',
    nullable: false,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: BloodGroup,
    nullable: true,
  })
  blood_group?: BloodGroup;

  @Column({
    type: 'enum',
    enum: EmergencyServiceType,
  })
  service_required: EmergencyServiceType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  other_service?: string;

  @Column({ type: 'text' })
  presenting_complaint: string;

  @Column({ type: 'text', nullable: true })
  past_medical_history?: string;

  @Column({ type: 'boolean', default: false })
  medicine_administered: boolean;

  @ManyToOne(() => Facility, { nullable: false })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: User;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId?: number;

  @OneToOne(() => EmergencyVital, (vital) => vital.patient, { cascade: true })
  vitals?: EmergencyVital;

  @OneToOne(() => EmergencyOutcome, (outcome) => outcome.patient, {
    cascade: true,
  })
  outcome?: EmergencyOutcome;

  @OneToMany(
    () => Prescription,
    (prescription) => prescription.emergencyPatient,
  )
  prescriptions: Prescription[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
