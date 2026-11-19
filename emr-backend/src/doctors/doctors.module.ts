import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { Visit } from 'src/visit/entities/visit.entity';
import { DoctorVisitDailyRollup } from './entities/doctor-visit-daily-rollup.entity';
import { DoctorVisitRollupService } from './doctor-visit-rollup.service';
import { DoctorVisitRollupCheckpoint } from './entities/doctor-visit-rollup-checkpoint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Appointment,
      AppointmentService,
      Patient,
      PatientQueue,
      Prescription,
      Service,
      Vaccine,
      Attendance,
      EmergencyPatient,
      Visit,
      DoctorVisitDailyRollup,
      DoctorVisitRollupCheckpoint,
    ]),
    AuthModule,
  ],
  controllers: [DoctorsController],
  providers: [
    DoctorsService,
    DoctorVisitRollupService,
    ServiceUtility,
    SocketGateway,
  ],
  exports: [DoctorsService],
})
export class DoctorsModule {}
