import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
  Unique,
} from 'typeorm';
import {
  ClientCategory,
  ClientType,
  FpCommodities,
  DurationType,
  ServiceCategory,
  InsertionPeriod,
  RemovalReason,
} from 'src/common/enums/enums';
import { BaseEntityInfo } from 'src/common/common.entities';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('family_plannings')
@Unique(['appointmentService'])
export class FamilyPlanning extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.familyPlanning,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id', referencedColumnName: 'id' })
  appointmentService: AppointmentService;

  @Column({
    type: 'enum',
    enum: ClientType,
  })
  client_type: ClientType;

  @Column({ type: 'int', nullable: true, default: 0 })
  years_of_marriage: number;

  @Column({
    type: 'enum',
    enum: DurationType,
  })
  total_pregnancy_since_last_period: DurationType;

  @Column({ type: 'boolean', default: false })
  new_user: boolean;

  @Column({ type: 'boolean', nullable: true })
  previous_method_in_use: boolean;

  @Column({
    type: 'enum',
    enum: FpCommodities,
    array: true,
    nullable: true,
  })
  previous_fp_methods_used?: FpCommodities[];

  @Column({
    type: 'enum',
    enum: ServiceCategory,
  })
  service_category: ServiceCategory;

  @Column({
    type: 'enum',
    enum: ClientCategory,
    nullable: true,
  })
  client_category: ClientCategory;

  @Column({
    type: 'enum',
    enum: InsertionPeriod,
    nullable: true,
  })
  insertion_period: InsertionPeriod;

  @Column({
    type: 'enum',
    enum: RemovalReason,
    nullable: true,
  })
  removal_reason: RemovalReason;

  @Column({ type: 'boolean', default: false })
  client_counseling_done: boolean;
}
