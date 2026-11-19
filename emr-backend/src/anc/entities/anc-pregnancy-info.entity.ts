import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReasonForEdit, Trimester } from 'src/common/enums/enums';
import { PreviousPregnancy } from './previous-pregnancy.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('anc_pregnancy_infos')
export class AncPregnancyInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.pregnancyInfo,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ type: 'int', default: 0 })
  gravidity: number;

  @Column({ type: 'int', default: 0 })
  parity: number;

  @Column({ type: 'date' })
  lmp: Date;

  @Column({ type: 'int', default: 0 })
  abortion: number;

  @Column({ type: 'int' })
  gestational_age: number;

  @Column({
    type: 'enum',
    enum: ReasonForEdit,
    nullable: true,
  })
  reason_for_edit: ReasonForEdit;

  @Column({ type: 'date' })
  expected_date_of_delivery: Date;

  @Column({
    type: 'enum',
    enum: Trimester,
  })
  trimester: Trimester;

  /**
   * Replaced wholesale on update (incoming rows carry no ids), so detached rows are
   * deleted instead of being left behind with a null FK.
   * Only acts when the property is set; leaving it undefined changes nothing.
   */
  @OneToMany(() => PreviousPregnancy, (prev) => prev.pregnancy_info, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  previous_pregnancies: PreviousPregnancy[];
}
