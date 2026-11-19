import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  AllergyType,
  FamilyPlanningMethod,
  PastObstetricComplication,
  PreviousIllness,
} from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('anc_medical_surgical_histories')
export class AncMedicalSurgicalHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.ancMedicalSurgicalHistory,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({
    name: 'previous_illness',
    type: 'enum',
    enum: PreviousIllness,
    array: true,
    default: [],
  })
  previousIllness: PreviousIllness[];

  @Column({
    type: 'enum',
    enum: PastObstetricComplication,
    enumName: 'anc_past_obstetric_complication_enum',
    array: true,
    default: [],
  })
  past_obstetric_complication: PastObstetricComplication[];

  @Column({ type: 'boolean', nullable: true })
  previous_surgery: boolean;

  @Column({ nullable: true })
  previous_surgery_details: string;

  @Column({ type: 'boolean', nullable: true })
  known_allergies: boolean;

  @Column({
    type: 'enum',
    enum: AllergyType,
    array: true,
    nullable: true,
  })
  allergy_details: AllergyType[];

  @Column({ type: 'boolean', nullable: true })
  previous_medication: boolean;

  @Column({ nullable: true })
  previous_medication_details: string;

  @Column({ type: 'boolean' })
  used_family_planning: boolean;

  @Column({ type: 'json', nullable: true })
  family_planning_methods: FamilyPlanningMethod[];

  @Column({ type: 'boolean', default: false })
  prior_blood_transfusion: boolean;
}
