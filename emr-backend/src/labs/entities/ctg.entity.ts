import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { CtgReporting } from 'src/common/enums/enums';

@Entity('ctgs')
export class Ctg {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.ctg,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ name: 'requires_ctg', type: 'boolean', default: false })
  requiresCtg: boolean;

  @Column({ name: 'ctg_machine_available', type: 'boolean', default: true })
  ctgMachineAvailable: boolean;

  @Column({
    name: 'ctg_reporting',
    type: 'enum',
    enum: CtgReporting,
    nullable: true,
  })
  ctgReporting: CtgReporting;

  @Column({ name: 'ctg_observations', type: 'text', nullable: true })
  ctgObservations: string;

  @Column({ name: 'ctg_remarks', type: 'text', nullable: true })
  ctgRemarks: string;
}
