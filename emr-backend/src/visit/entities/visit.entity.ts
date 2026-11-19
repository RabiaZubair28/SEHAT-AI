import { Appointment } from 'src/appointments/entities/appointment.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VisitStatus } from 'src/common/enums/enums';
import { Facility } from 'src/facilities/entities/facility.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { Patient } from 'src/patients/entities/patient.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';

@Entity('visits')
export class Visit extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patient_id: number;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate: Date;

  @ManyToOne(() => Facility, (facility) => facility.appointments, {
    eager: true,
  })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @OneToMany(() => Appointment, (appointment) => appointment.visit)
  appointments: Appointment[];

  @Column({
    type: 'enum',
    enum: VisitStatus,
    default: VisitStatus.PENDING,
  })
  status: VisitStatus;

  @OneToOne(() => VitalAssessment, (assessment) => assessment.visit, {
    cascade: true,
    eager: true,
  })
  vitalAssessment: VitalAssessment;
}
