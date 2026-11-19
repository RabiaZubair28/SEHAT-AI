import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  PreviousIllness,
  PresentingComplaints,
  PastObstetricComplication,
  AssociatedConditions,
  AllergyType,
} from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('opd_medical_histories')
export class OpdMedicalHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.opdMedicalHistory,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  appointmentService: AppointmentService;

  @Column({
    name: 'presenting_complaints',
    type: 'enum',
    enum: PresentingComplaints,
    array: true,
    default: [],
  })
  presentingComplaints: PresentingComplaints[];

  @Column({
    name: 'presenting_complaints_other',
    type: 'varchar',
    nullable: true,
  })
  presentingComplaintsOther: string;

  @Column({
    name: 'previous_illness',
    type: 'jsonb',
  })
  previousIllness: PreviousIllness[];

  @Column({
    name: 'previous_illness_other',
    type: 'varchar',
    nullable: true,
  })
  otherPreviousIllness: string;

  @Column({
    name: 'associated_conditions',
    type: 'enum',
    enum: AssociatedConditions,
    array: true,
    default: [],
  })
  associatedConditions: AssociatedConditions[];

  @Column({
    name: 'associated_conditions_other',
    type: 'varchar',
    nullable: true,
  })
  otherAssociatedConditions: string;

  @Column({ type: 'boolean' })
  known_allergies: boolean;

  @Column({
    type: 'enum',
    enum: AllergyType,
    nullable: true,
    array: true
  })
  allergy: AllergyType[];

  @Column({ type: 'boolean' })
  previous_medication: boolean;

  @Column({ type: 'varchar', nullable: true })
  previous_medication_details: string;

  @Column({ name: 'obstetric_complication', type: 'boolean', nullable: true })
  obstetricComplication: boolean;

  @Column({
    name: 'obstetric_complication_details',
    type: 'enum',
    enum: PastObstetricComplication,
    array: true,
    nullable: true,
  })
  obstetricComplicationDetails: PastObstetricComplication[];

  @Column({
    name: 'past_obstetric_complication_other',
    type: 'varchar',
    nullable: true,
  })
  otherObstetricComplicationDetails: string;

  @Column({ name: 'previous_surgery', type: 'boolean' })
  previousSurgery: boolean;

  @Column({
    name: 'previous_surgery_details',
    type: 'varchar',
    nullable: true,
  })
  previousSurgeryDetails: string;
}
