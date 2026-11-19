import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('pnc_postpartum_nutritions')
export class PncNutrition {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.pncNutrition,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({
    name: 'counselled_on_nutrition',
    type: 'boolean',
    default: false
  })
  counselledOnNutrition: boolean;
}
