import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { DispenseItem } from './dispense-item.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';

@Entity('dispensers')
export class Dispenser extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.dispenser,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id', referencedColumnName: 'id' })
  appointmentService: AppointmentService;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  dispensedBy: User;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'otc_med_required', type: 'boolean', default: false })
  otcMedRequired: boolean;

  @OneToMany(() => DispenseItem, (item) => item.dispense, { cascade: true })
  items: DispenseItem[];

  @ManyToOne(() => EmergencyPatient, { nullable: true })
  @JoinColumn({ name: 'emergency_patient_id' })
  emergencyPatient?: EmergencyPatient;
}
