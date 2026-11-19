import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BloodGroup } from 'src/common/enums/enums';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';

@Entity('opd_vital_assessments')
export class OpdVitalAssesment {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(
        () => AppointmentService,
        (appointmentService) => appointmentService.ancVitalAssessment,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'appointment_service_id' })
    appointmentService: AppointmentService;

    @Column({ type: 'double precision', default: 0 }) // in kg
    weight: number;

    @Column({ type: 'double precision', default: 0 }) // in inches
    height: number;

    @Column({ type: 'double precision', default: 0 })
    body_mass_index: number;

    @Column({ type: 'double precision', default: 0 }) // in kgs
    change_in_weight: number;

    @Column({ type: 'double precision', default: 0 })
    pulse: number;

    @Column({ type: 'double precision', nullable: true })
    systolic_bp: number;

    @Column({ type: 'double precision', nullable: true })
    diastolic_bp: number;

    @Column({ type: 'double precision', default: 0 })
    temperature: number;

    @Column({ type: 'double precision', default: 0 })
    respiratory_rate: number;

    @Column({
        type: 'enum',
        enum: BloodGroup,
        nullable: true,
    })
    blood_group?: BloodGroup;
}
