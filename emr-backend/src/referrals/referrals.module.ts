import { forwardRef, Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { TokenCounterService } from 'src/token-counter/token-counter.service';
import { TokenCounter } from 'src/token-counter/entities/token-counter.entity';
import { Service } from 'src/services/entities/service.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import { Patient } from 'src/patients/entities/patient.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AppointmentDoctor } from 'src/appointments/entities/appointment-doctor.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { UnassignedPatient } from './entities/unassigned-patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Referral,
      Appointment,
      Role,
      User,
      Facility,
      PatientQueue,
      TokenCounter,
      Service,
      Patient,
      AppointmentService,
      AppointmentDoctor,
      Visit,
      Prescription,
      Vaccine,
      Attendance,
      EmergencyPatient,
      UnassignedPatient,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    TokenCounterService,
    SocketGateway,
    ServiceUtility,
  ],
})
export class ReferralsModule {}
