import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('delivery_patients')
export class DeliveryPatient {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        () => AppointmentService,
        (appointmentService) => appointmentService.deliveryPatients,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'appointment_service_id' })
    appointmentService: AppointmentService

    // Mother (Patient)
    @ManyToOne(() => Patient, (patient) => patient.deliveries, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'mother_id' })
    mother: Patient;

    // Child (Patient)
    @OneToOne(() => Patient, (patient) => patient.deliveryAsChild, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'child_id' })
    child: Patient;

    @ManyToOne(() => Facility, (facility) => facility.deliveries, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
