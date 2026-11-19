import { Module } from '@nestjs/common';
import { FamilyPlanningService } from './family-planning.service';
import { FamilyPlanningController } from './family-planning.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyPlanning } from './entities/family-planning.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Service } from 'src/services/entities/service.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { DispenserModule } from 'src/dispenser/dispenser.module';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FamilyPlanning,
      User,
      Appointment,
      AppointmentService,
      PatientQueue,
      Service,
      Prescription,
      Vaccine,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
    DispenserModule,
  ],
  controllers: [FamilyPlanningController],
  providers: [FamilyPlanningService, ExceptionUtility, ServiceUtility],
})
export class FamilyPlanningModule {}
