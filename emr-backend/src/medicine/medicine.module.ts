import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { MedicineBatch } from './entities/medicine-batch.entity';
import { MedicineController } from './medicine.controller';
import { MedicineService } from './medicine.service';
import { Medicine } from './entities/medicine.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Service } from 'src/services/entities/service.entity';
import { MedicineVariant } from './entities/medicine-variant.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { MedicineCount } from 'src/medicine-batch/entities/medicine-count.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicineBatch,
      User,
      Medicine,
      Prescription,
      Visit,
      AppointmentService,
      Appointment,
      Service,
      MedicineVariant,
      Vaccine,
      PatientQueue,
      Patient,
      EmergencyPatient,
      Attendance,
      MedicineCount,
    ]),
    AuthModule,
  ],
  controllers: [MedicineController],
  providers: [MedicineService, ServiceUtility],
})
export class MedicineModule {}
