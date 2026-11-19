import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import {
  PatientComingFrom,
  ReasonForAdmission,
} from 'src/common/enums/enums';

@Entity('nutrition_service_info')
export class NutritionServiceInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(
    () => AppointmentService,
    (appointmentService) => appointmentService.nutritionServiceInfo,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'appointment_service_id' })
  appointmentService: AppointmentService;

  // Patient Admission Details (Sec 9a)
  @Column({
    type: 'enum',
    enum: PatientComingFrom,
  })
  patient_coming_from: PatientComingFrom;

  @Column({
    type: 'enum',
    enum: ReasonForAdmission,
  })
  reason_for_admission: ReasonForAdmission;

  // Counselling (Sec 9d)
  @Column({ type: 'boolean', default: false })
  counselled_on_nutrition_and_diet: boolean;
}

