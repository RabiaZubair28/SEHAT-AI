import { AppointmentService } from "src/appointments/entities/appointment-service.entity";
import { Complication, DiseaseCondition, PatientFinalDiagnosis } from "src/common/enums/enums";
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("opd_diagnosis")
export class OpdDiagnosis {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(
        () => AppointmentService,
        (appointmentService) => appointmentService.opdDiagnosis,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'appointment_service_id' })
    appointmentService: AppointmentService;

    @Column({
        type: 'enum',
        enum: PatientFinalDiagnosis,
    })
    patientFinalDiagnosis: PatientFinalDiagnosis;

    @Column({ name: 'final_diagnosis', type: 'jsonb', nullable: true })
    finalDiagnosis: DiseaseCondition[];

    @Column({
        type: 'varchar',
        nullable: true,
    })
    otherFinalDiagnosis: string;
}