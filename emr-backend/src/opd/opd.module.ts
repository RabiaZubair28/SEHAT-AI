import { Module } from '@nestjs/common';
import { OpdService } from './opd.service';
import { OpdController } from './opd.controller';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Service } from 'src/services/entities/service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { OpdMedicalHistory } from './entities/opd-medical-history.entity';
import { OpdVitalAssesment } from './entities/opd-vital-assessment.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { OpdDiagnosis } from './entities/opd-diagnosis.entity';
import { User } from 'src/users/entities/user.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentService,
      Service,
      Appointment,
      Prescription,
      Medicine,
      OpdMedicalHistory,
      OpdVitalAssesment,
      Diagnosis,
      OpdDiagnosis,
      User,
      OtherPrescription,
      Vaccine,
      PatientQueue,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
  ],
  controllers: [OpdController],
  providers: [OpdService, ServiceUtility],
  exports: [ServiceUtility],
})
export class OpdModule {}
