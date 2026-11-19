import { forwardRef, Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';
import { Service } from 'src/services/entities/service.entity';
import { AppointmentService } from './entities/appointment-service.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      PatientQueue,
      User,
      VitalAssessment,
      Service,
      AppointmentService,
      Visit,
      Prescription,
      PatientQueue,
      Vaccine,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ServiceUtility],
})
export class AppointmentsModule {}
