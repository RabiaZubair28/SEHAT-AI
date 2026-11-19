import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Patient } from 'src/patients/entities/patient.entity';
import { ImmunisationDose } from './immunisation-dosage.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { NewbornAssessment } from 'src/delivery/entities/newborn-assesment.entity';

@Entity('immunisations')
export class Immunisation {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_immunisations_appointment_service_id')
  @ManyToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.immunisations,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService?: AppointmentService;

  @Index('idx_immunisations_patient_id')
  @ManyToOne(() => Patient, (patient) => patient.immunisations)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @OneToMany(() => ImmunisationDose, (dose) => dose.immunisation, {
    cascade: true,
    eager: true,
  })
  doses: ImmunisationDose[];

  @OneToOne(
    () => NewbornAssessment,
    (newbornAssessment) => newbornAssessment.immunisation,
    {
      nullable: true,
    },
  )
  newbornAssessment?: NewbornAssessment;
}
