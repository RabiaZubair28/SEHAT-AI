import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { LabTest, LabTestUrgency } from 'src/common/enums/enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('diagnosis')
export class Diagnosis {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.diagnosis,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ name: 'screened_rubella', type: 'boolean', default: false })
  screenedRubella: boolean;

  @Column({ name: 'rubella_positive', type: 'boolean', nullable: true })
  rubellaPositive: boolean;

  @Column({ name: 'screened_hep_b', type: 'boolean', default: false })
  screenedHepB: boolean;

  @Column({ name: 'hep_b_positive', type: 'boolean', nullable: true })
  hepBPositive: boolean;

  @Column({ name: 'screened_hep_c', type: 'boolean', default: false })
  screenedHepC: boolean;

  @Column({ name: 'hep_c_positive', type: 'boolean', nullable: true })
  hepCPositive: boolean;

  @Column({ name: 'screened_thalassemia', type: 'boolean', default: false })
  screenedThalassemia: boolean;

  @Column({ name: 'thalassemia_positive', type: 'boolean', nullable: true })
  thalassemiaPositive: boolean;

  @Column({ name: 'screened_hiv', type: 'boolean', default: false })
  screenedHiv: boolean;

  @Column({ name: 'hiv_positive', type: 'boolean', nullable: true })
  hivPositive: boolean;

  @Column({ name: 'prescribed_lab_test', type: 'boolean', default: false })
  prescribedLabTest: boolean;

  @Column({
    name: 'lab_tests',
    type: 'jsonb',
    nullable: true,
  })
  labTestsPrescribed: LabTestItem[] | undefined;

  @Column({
    name: 'patient_has_labtests',
    type: 'boolean',
    nullable: true
  })
  patientHasLabtests: boolean;

  @Column({
    name: 'result_value',
    type: 'varchar',
    nullable: true
  })
  resultValue: string;

  @Column({
    name: 'result_lab_date',
    type: 'date',
    nullable: true,
  })
  resultLabDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
export class LabTestItem {
  name: LabTest;
  urgency: LabTestUrgency;
  other?: string;
}
