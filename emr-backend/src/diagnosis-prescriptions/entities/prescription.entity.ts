import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { Visit } from 'src/visit/entities/visit.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';

@Entity('prescriptions')
export class Prescription extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.prescriptions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @ManyToOne(() => MedicineVariant, { eager: true })
  @JoinColumn({ name: 'medicine_variant_id' })
  medicineVariant: MedicineVariant;

  @Column({
    name: 'medicine_dosage',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  medicineDosage: string;

  @Column({ name: 'medicine_duration', type: 'int', nullable: true })
  medicineDuration: number;

  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity: number;

  @Column({
    name: 'medicine_instruction',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  medicineInstruction: string;

  @Column({
    name: 'medicine_dispensed',
    type: 'boolean',
    default: false,
  })
  medicineDispensed: boolean;

  @ManyToOne(() => Visit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @ManyToOne(() => EmergencyPatient, (emergency) => emergency.prescriptions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emergency_patient_id' })
  emergencyPatient?: EmergencyPatient;
}
