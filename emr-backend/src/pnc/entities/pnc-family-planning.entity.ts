import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('pnc_family_plannings')
export class PncFamilyPlanning {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.pncFamilyPlanning,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({
    name: 'counseled_on_family_planning',
    type: 'boolean',
    default: false
  })
  counseledOnFamilyPlanning: boolean;

  @Column({
    name: 'dispenser_fp_methods',
    type: 'boolean',
    default: false
  })
  dispenserFpMethods: boolean;
}
