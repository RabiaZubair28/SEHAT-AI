import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PncService } from './pnc.service';
import { PncController } from './pnc.controller';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PncBreastfeeding } from './entities/pnc-breastfeeding.entity';
import { PncNutrition } from './entities/pnc-nutrition.entity';
import { PncFamilyPlanning } from './entities/pnc-family-planning.entity';
import { User } from 'src/users/entities/user.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Service } from 'src/services/entities/service.entity';
import { PncVitalAssesment } from './entities/pnc-vital-assesment.entity';
import { DispenserModule } from 'src/dispenser/dispenser.module';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visit,
      User,
      PncBreastfeeding,
      ImmunisationDose,
      VitalAssessment,
      Immunisation,
      Immunisation,
      ImmunisationDose,
      Prescription,
      PncFamilyPlanning,
      PncNutrition,
      Appointment,
      Service,
      AppointmentService,
      PatientQueue,
      PncVitalAssesment,
      OtherPrescription,
      Vaccine,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
    ImmunisationModule,
    DispenserModule,
  ],
  controllers: [PncController],
  providers: [PncService, ServiceUtility],
})
export class PncModule {}
