import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import {
  ReferralPerson,
  MotherComplication,
  ChildComplications,
  LevelOfCare,
  DeliveryProgressStatus,
  TypeOfService,
  ReferralType,
} from '../../common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { District } from 'src/districts/entities/district.entity';
import { Facility } from 'src/facilities/entities/facility.entity';

@Entity('referral_details')
export class ReferralDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.deliveryReferralDetails,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({
    type: 'enum',
    enum: ReferralPerson,
    array: true,
    nullable: true,
  })
  whoRequiresReferral: ReferralPerson[];

  @Column({
    type: 'enum',
    enum: MotherComplication,
    array: true,
    nullable: true,
  })
  motherComplications: MotherComplication[];

  @Column({
    type: 'enum',
    enum: ChildComplications,
    array: true,
    nullable: true,
  })
  childComplications: ChildComplications[];

  @Column({ nullable: true })
  otherComplication: string;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @Column({
    type: 'enum',
    enum: LevelOfCare,
    nullable: true,
  })
  levelOfCare: LevelOfCare;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({
    type: 'enum',
    enum: TypeOfService,
    nullable: true
  })
  typeOfService: TypeOfService;

  @Column({
    type: 'enum',
    enum: ReferralType,
    nullable: true
  })
  typeOfReferral: ReferralType;

  @Column({
    type: 'enum',
    enum: DeliveryProgressStatus,
    default: DeliveryProgressStatus.REFER_TO_CEMONC,
  })
  status: DeliveryProgressStatus;
}

