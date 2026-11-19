import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import { UserPersonalInfo } from 'src/user-personal-info/entities/user-personal-info.entity';
import { UserPermission } from '../../user-permissions/entities/user-permission.entity';
import { UserService } from 'src/user-services/entities/user-service.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { FollowUp } from 'src/follow-ups/entities/follow-up.entity';
import { Service } from 'src/services/entities/service.entity';
import { MedicalHistory } from 'src/medical-history/entities/medical-history.entity';
import { Division } from 'src/division/entities/division.entity';
import { District } from 'src/districts/entities/district.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';
import { UserStatus } from 'src/common/enums/enums';
import { AppointmentDoctor } from 'src/appointments/entities/appointment-doctor.entity';

@Entity('users')
@Index('idx_users_role_id', ['role'])
@Index('idx_users_facility_id', ['facility'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  first_name: string;

  @Column({ length: 255 })
  last_name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Facility, (facility) => facility.users, { nullable: true })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @OneToOne(() => UserPersonalInfo, (userPersonalInfo) => userPersonalInfo.user)
  personalInfo: UserPersonalInfo;

  @OneToOne(() => UserPermission, (userPermission) => userPermission.user, {
    cascade: true,
  })
  userPermissions: UserPermission;

  @OneToMany(() => UserService, (userService) => userService.user)
  userServices: UserService[];

  @OneToMany(() => FollowUp, (followUp) => followUp.doctor)
  followUps: FollowUp[];

  @OneToMany(() => PatientQueue, (queue) => queue.doctor)
  patientQueues: PatientQueue[];

  @OneToMany(() => AppointmentDoctor, (appointmentDoctor) => appointmentDoctor.doctor)
  appointmentDoctors: AppointmentDoctor[];

  @OneToMany(() => MedicalHistory, (history) => history.doctor)
  createdMedicalHistories: MedicalHistory[];

  @ManyToMany(() => Service, (service) => service.users, { cascade: true })
  @JoinTable({
    name: 'user_services',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
    synchronize: false,
  })
  services: Service[];

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'division_id' })
  division: Division;
  @Column()
  division_id: number;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'district_id' })
  district: District;
  @Column()
  district_id: number;

  @ManyToOne(() => Taluka)
  @JoinColumn({ name: 'taluka_id' })
  taluka: Taluka;
  @Column()
  taluka_id: number;

  @ManyToOne(() => UC)
  @JoinColumn({ name: 'uc_id' })
  uc: UC;
  @Column()
  uc_id: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ type: 'text', nullable: true, select: false })
  access_token: string | null;

  @Column({ type: 'boolean', default: false })
  must_change_password: boolean;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;
}