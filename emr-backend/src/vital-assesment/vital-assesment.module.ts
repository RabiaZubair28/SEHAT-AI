import { Module } from '@nestjs/common';
import { VitalAssesmentService } from './vital-assesment.service';
import { VitalAssesmentController } from './vital-assesment.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalAssessment } from './entities/vital-assesment.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Service } from 'src/services/entities/service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { User } from 'src/users/entities/user.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { ImmunisationCard } from 'src/immunisation/entities/immunisation-card.entity';
import { PatientImmunisation } from 'src/immunisation/entities/patient-immunisation.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VitalAssessment,
      AppointmentService,
      Service,
      Appointment,
      User,
      Prescription,
      Vaccine,
      PatientQueue,
      Immunisation,
      ImmunisationDose,
      ImmunisationCard,
      PatientImmunisation,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
    ImmunisationModule,
  ],
  controllers: [VitalAssesmentController],
  providers: [VitalAssesmentService, ServiceUtility],
})
export class VitalAssesmentModule {}
