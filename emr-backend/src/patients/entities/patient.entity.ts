import { Appointment } from 'src/appointments/entities/appointment.entity';
import { FollowUp } from 'src/follow-ups/entities/follow-up.entity';
import { MedicalHistory } from 'src/medical-history/entities/medical-history.entity';
import { PatientAdditionalInfo } from 'src/patient-additional-info/entities/patient-additional-info.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { PatientSocialDeterminants } from 'src/patient-social-determinants/entities/patient-social-determinant.entity';
import { Immunisation } from '../../immunisation/entities/immunisation.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { CNICProvider, Gender, NationalityStatus, PatientRegistrationType, PhoneProvider } from 'src/common/enums/enums';
import { DeliveryPatient } from 'src/delivery/entities/delivery-patients.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { NewbornAssessment } from 'src/delivery/entities/newborn-assesment.entity';
import { PatientImmunisation } from 'src/immunisation/entities/patient-immunisation.entity';
import { ImmunisationCard } from 'src/immunisation/entities/immunisation-card.entity';

@Entity('patients')
@Index('uq_patients_cnic_self', ['cnic'], {
  unique: true,
  where: `"cnic_provider" = 'Self'`,
})
@Index('uq_patients_immunisation_number', ['immunisation_number'], { unique: true })
@Index('uq_patients_mobile_hash', ['mobile_hash'], { unique: true })
@Index('idx_patients_created_at', ['created_at'])
@Index('idx_patients_uc_id', ['uc_id'])
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: CNICProvider,
  })
  cnic_provider: CNICProvider;

  @Column({
    name: 'nationality_status',
    type: 'enum',
    enum: NationalityStatus,
    default: NationalityStatus.PAKISTANI,
  })
  nationalityStatus: NationalityStatus;

  @Index()
  @Column({ type: 'varchar', length: 20, nullable: true })
  cnic: string | null;

  @Index(
    'IDX_patients_first_name_lower_pattern',
    { synchronize: false },
  )
  @Column()
  first_name: string;

  @Index(
    'IDX_patients_last_name_lower_pattern',
    { synchronize: false },
  )
  @Column()
  last_name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  immunisation_number?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mobile_hash?: string | null;

  @Column({
    type: 'enum',
    enum: PatientRegistrationType,
    nullable: true,
  })
  registration_type?: PatientRegistrationType | null;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: PhoneProvider,
    default: PhoneProvider.Self,
  })
  phone_provider: PhoneProvider;

  @Index()
  @Column({ length: 15 })
  phone_number: string;

  @Column('text')
  address: string;

  @Column()
  division_id: number;

  @Column()
  district_id: number;

  @Column({ type: 'int', nullable: true })
  facility_id: number | null;

  @Column()
  taluka_id: number;

  @Column({ type: 'int', nullable: true })
  uc_id?: number;

  @Index()
  @Column({ name: 'mr_no', type: 'varchar', unique: true })
  mr_no: string;

  @OneToOne(() => PatientAdditionalInfo, (info) => info.patient, {
    cascade: true,
    eager: true,
  })
  additionalInfo: PatientAdditionalInfo;

  @OneToOne(() => PatientSocialDeterminants, (social) => social.patient, {
    cascade: true,
    eager: true,
  })
  socialDeterminants: PatientSocialDeterminants;

  @OneToMany(() => FollowUp, (followUp) => followUp.patient)
  followUps: FollowUp[];

  @OneToMany(() => PatientQueue, (queue) => queue.patient)
  patientQueue: PatientQueue[];

  @OneToOne(() => MedicalHistory, (history) => history.patient)
  medicalHistories: MedicalHistory[];

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => Immunisation, (immunisation) => immunisation.patient)
  immunisations: Immunisation[];

  // A mother can have multiple deliveries
  @OneToMany(() => DeliveryPatient, (delivery) => delivery.mother)
  deliveries: DeliveryPatient[];

  @OneToMany(() => ImmunisationDose, (dose) => dose.patient)
  immunisationsDoses: ImmunisationDose[];

  @OneToOne(() => ImmunisationCard, (card) => card.patient)
  immunisationCard: ImmunisationCard;

  @OneToOne(() => NewbornAssessment, (assessment) => assessment.patient)
  newbornAssessments: NewbornAssessment[];

  @OneToOne(() => PatientImmunisation, (pi) => pi.patient)
  patientImmunisation: PatientImmunisation;

  @OneToOne(() => DeliveryPatient, (delivery) => delivery.child)
  deliveryAsChild: DeliveryPatient;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
