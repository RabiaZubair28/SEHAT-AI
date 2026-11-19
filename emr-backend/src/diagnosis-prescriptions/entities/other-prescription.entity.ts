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
import { OtherPrescriptionCategory } from 'src/common/enums/enums';

@Entity('other_prescriptions')
export class OtherPrescription extends BaseEntityInfo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        name: 'name',
        type: 'varchar',
        length: 255,
    })
    name: string;

    @ManyToOne(
        () => AppointmentService,
        (appointmentService) => appointmentService.prescriptions,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'appointment_service_id' })
    appointmentService: AppointmentService;

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

    @Column({ type: 'enum', enum: OtherPrescriptionCategory, nullable: true })
    category: OtherPrescriptionCategory;

    @ManyToOne(() => Visit, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'visit_id' })
    visit: Visit;
}
