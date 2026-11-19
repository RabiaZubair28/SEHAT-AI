import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NutritionServiceInfo } from './entities/nutrition-service-info.entity';
import { NutritionVitalAssessment } from './entities/nutrition-vital-assessment.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentService,
      NutritionServiceInfo,
      NutritionVitalAssessment,
      Service,
      User,
      Medicine,
      Prescription,
      Vaccine,
      PatientQueue,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
  ],
  controllers: [NutritionController],
  providers: [NutritionService, ServiceUtility],
  exports: [NutritionService],
})
export class NutritionModule {}
