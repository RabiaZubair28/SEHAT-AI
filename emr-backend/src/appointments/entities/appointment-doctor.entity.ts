import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from 'src/users/entities/user.entity';
import { BaseEntityInfo } from 'src/common/common.entities';

@Entity('appointment_doctors')
@Unique(['appointment', 'doctor'])
export class AppointmentDoctor extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Appointment, (appointment) => appointment.appointmentDoctors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User, (user) => user.appointmentDoctors, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;
}
