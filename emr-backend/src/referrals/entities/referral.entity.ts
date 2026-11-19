import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { District } from '../../districts/entities/district.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import {
  ChildComplications,
  ChildOrder,
  LevelOfCare,
  MotherComplication,
  ReferralPerson,
  ReferralType,
  TypeOfService,
} from 'src/common/enums/enums';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referred_from_id' })
  fromDoctor: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_to_id' })
  toDoctor: User;

  @Column({ type: 'text', nullable: true })
  refer_out_reason?: string;

  @Column({
    type: 'enum',
    enum: TypeOfService,
    nullable: true,
  })
  type_of_service?: TypeOfService;

  @Column({
    name: 'whoRequiresReferral',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  whoRequiresReferral?: ReferralPerson;

  @Column({
    type: 'enum',
    enum: ChildOrder,
    array: true,
    nullable: true,
  })
  whichChildRequiredReferral?: ChildOrder[];

  @Column('enum', {
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

  @Column({
    type: 'enum',
    enum: LevelOfCare,
    nullable: true,
  })
  level_of_care?: LevelOfCare;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @ManyToOne(() => Facility, { nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({
    type: 'enum',
    enum: ReferralType,
    default: ReferralType.INTERNAL,
  })
  type: ReferralType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
