import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyService } from './emergency.service';
import { EmergencyController } from './emergency.controller';
import { EmergencyPatient } from './entities/emergency-patient.entity';
import { EmergencyVital } from './entities/emergency-vital.entity';
import { EmergencyOutcome } from './entities/emergency-outcome.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { District } from 'src/districts/entities/district.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { AppointmentService } from '../appointments/entities/appointment-service.entity';
import { Service } from 'src/services/entities/service.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { DispenserModule } from 'src/dispenser/dispenser.module';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { PatientsModule } from 'src/patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmergencyPatient,
      EmergencyVital,
      EmergencyOutcome,
      Facility,
      District,
      Prescription,
      MedicineVariant,
      User,
      AppointmentService,
      Service,
      Appointment,
      Vaccine,
      PatientQueue,
      Patient,
      Attendance,
    ]),
    AuthModule,
    forwardRef(() => PatientsModule),
    forwardRef(() => DispenserModule),
    forwardRef(() => ImmunisationModule),
  ],
  controllers: [EmergencyController],
  providers: [EmergencyService, ServiceUtility],
  exports: [EmergencyService],
})
export class EmergencyModule {}
