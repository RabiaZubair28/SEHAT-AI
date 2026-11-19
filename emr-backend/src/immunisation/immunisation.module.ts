import { forwardRef, Module } from '@nestjs/common';
import { ImmunisationService } from './immunisation.service';
import { ImmunisationController } from './immunisation.controller';
import { User } from 'src/users/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Vaccine } from './entities/vaccine.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Service } from 'src/services/entities/service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Immunisation } from './entities/immunisation.entity';
import { ImmunisationDose } from './entities/immunisation-dosage.entity';
import { ImmunisationCard } from './entities/immunisation-card.entity';
import { PatientImmunisation } from './entities/patient-immunisation.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { Division } from 'src/division/entities/division.entity';
import { District } from 'src/districts/entities/district.entity';
import { Taluka } from 'src/taluka/entities/taluka.entity';
import { UC } from 'src/uc/entities/uc.entity';
import { Facility } from 'src/facilities/entities/facility.entity';
import { PatientsModule } from 'src/patients/patients.module';
import { ImmunisationDailyRollup } from './entities/immunisation-daily-rollup.entity';
import { ImmunisationRollupService } from './immunisation-rollup.service';
import { PatientImmunisationDailyRollup } from './entities/patient-immunisation-daily-rollup.entity';
import { PatientImmunisationRollupService } from './patient-immunisation-rollup.service';
import { PatientVaccineStatusSnapshot } from './entities/patient-vaccine-status-snapshot.entity';
import { PatientVaccineStatusSnapshotBackfillService } from './patient-vaccine-status-snapshot-backfill.service';
import { ImmunisationRollupCheckpoint } from './entities/immunisation-rollup-checkpoint.entity';
import { ImmunisationRollupSeenPatient } from './entities/immunisation-rollup-seen-patient.entity';
import { ImmunisationRollupSeenVaccine } from './entities/immunisation-rollup-seen-vaccine.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vaccine,
      AppointmentService,
      Service,
      Appointment,
      Prescription,
      Immunisation,
      ImmunisationDose,
      ImmunisationCard,
      PatientImmunisation,
      Patient,
      PatientQueue,
      EmergencyPatient,
      Attendance,
      Division,
      District,
      Taluka,
      UC,
      Facility,
      ImmunisationDailyRollup,
      ImmunisationRollupCheckpoint,
      ImmunisationRollupSeenPatient,
      ImmunisationRollupSeenVaccine,
      PatientImmunisationDailyRollup,
      PatientVaccineStatusSnapshot,
    ]),
    AuthModule,
    forwardRef(() => PatientsModule),
  ],
  controllers: [ImmunisationController],
  providers: [
    ImmunisationService,
    ImmunisationRollupService,
    PatientImmunisationRollupService,
    PatientVaccineStatusSnapshotBackfillService,
    ExceptionUtility,
    ServiceUtility,
  ],
  exports: [ImmunisationService],
})
export class ImmunisationModule {}
