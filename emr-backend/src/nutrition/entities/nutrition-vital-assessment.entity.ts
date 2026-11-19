import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { EdemaLevel, NutritionComplication } from 'src/common/enums/enums';

@Entity('nutrition_vital_assessments')
export class NutritionVitalAssessment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.nutritionVitalAssessment,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  @Column({ type: 'double precision', default: 0 }) // in kg (0-200)
  weight: number;

  @Column({ type: 'double precision', default: 0 }) // in inches
  height: number;

  @Column({ type: 'double precision', nullable: true }) // 50-300 mmHg
  systolic_bp: number;

  @Column({ type: 'double precision', nullable: true }) // 20-200 mmHg
  diastolic_bp: number;

  @Column({ type: 'double precision', default: 0 }) // 95-108
  temperature: number;

  @Column({ type: 'double precision', default: 0 }) // 20-220 bpm
  pulse: number;

  @Column({ type: 'double precision', nullable: true }) // MUAC - numerical range
  muac: number;

  @Column({
    type: 'enum',
    enum: EdemaLevel,
  })
  edema: EdemaLevel;

  @Column({ type: 'boolean', default: false })
  is_experiencing_complications: boolean;

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
  })
  complications: NutritionComplication[];
}
