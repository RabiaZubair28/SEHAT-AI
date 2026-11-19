import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { DeliveryProgressStatus, DischargeChecklist } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('discharge_details')
export class DischargeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.deliveryDischargeDetails,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService

  @Column({
    type: 'enum',
    enum: DischargeChecklist,
    array: true,
    nullable: true,
  })
  dischargeChecklist: DischargeChecklist[];

  @Column({ nullable: true })
  familyPlanningCommodity: string;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @Column({ type: 'enum', enum: DeliveryProgressStatus, default: DeliveryProgressStatus.DISCHARGED })
  status: DeliveryProgressStatus;
}
