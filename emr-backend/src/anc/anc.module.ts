import { Module } from '@nestjs/common';
import { AncService } from './anc.service';
import { AncController } from './anc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from 'src/visit/entities/visit.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { Ctg } from 'src/labs/entities/ctg.entity';
import { Ultrasound } from 'src/labs/entities/ultrasound.entity';
import { AncPregnancyInfo } from './entities/anc-pregnancy-info.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { AncMedicalSurgicalHistory } from './entities/anc-medical-surgical-history.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { PreviousPregnancy } from './entities/previous-pregnancy.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { Service } from 'src/services/entities/service.entity';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { AncVitalAssesment } from './entities/anc-vital-assesment.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { ImmunisationCard } from 'src/immunisation/entities/immunisation-card.entity';
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
      Appointment,
      Immunisation,
      Ctg,
      Ultrasound,
      AncMedicalSurgicalHistory,
      AncPregnancyInfo,
      Prescription,
      Diagnosis,
      PreviousPregnancy,
      VitalAssessment,
      ImmunisationDose,
      ImmunisationCard,
      Service,
      AppointmentService,
      PatientQueue,
      AncVitalAssesment,
      OtherPrescription,
      Vaccine,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
    ImmunisationModule,
  ],
  controllers: [AncController],
  providers: [AncService, ExceptionUtility, ServiceUtility],
})
export class AncModule {}
