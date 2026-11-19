import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispenserService } from './dispenser.service';
import { DispenserController } from './dispenser.controller';
import { Visit } from 'src/visit/entities/visit.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Dispenser } from './entities/dispenser.entity';
import { DispenseItem } from './entities/dispense-item.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Service } from 'src/services/entities/service.entity';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { MedicineBatch } from 'src/medicine/entities/medicine-batch.entity';
import { DoctorMedicineStock } from 'src/medicine/entities/doctor-medicine-stock.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Medicine,
      Appointment,
      Dispenser,
      DispenseItem,
      DoctorMedicineStock,
      MedicineBatch,
      Prescription,
      Service,
      Visit,
      PatientQueue,
      AppointmentService,
      Vaccine,
      Patient,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
  ],
  controllers: [DispenserController],
  providers: [DispenserService, ServiceUtility],
  exports: [DispenserService],
})
export class DispenserModule {}
