import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { PreDeliveryAssessment } from './entities/pre-delivery.entity';
import { PostDeliveryAssessment } from './entities/post-delivery.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ExceptionUtility } from 'src/common/utils/helper.util';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { DispenserService } from 'src/dispenser/dispenser.service';
import { Dispenser } from 'src/dispenser/entities/dispenser.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { UserService } from 'src/user-services/entities/user-service.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { NewbornAssessment } from './entities/newborn-assesment.entity';
import { DischargeDetails } from './entities/discharge-details.entity';
import { ReferralDetails } from './entities/referral-details.entity';
import { DeliveryPatient } from './entities/delivery-patients.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { TokenCounterModule } from 'src/token-counter/token-counter.module';
import { PatientsModule } from 'src/patients/patients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PreDeliveryAssessment,
      PostDeliveryAssessment,
      Appointment,
      Visit,
      AppointmentService,
      Prescription,
      PatientQueue,
      User,
      Service,
      Dispenser,
      Immunisation,
      ImmunisationDose,
      Medicine,
      MedicineVariant,
      Service,
      Patient,
      UserService,
      NewbornAssessment,
      DischargeDetails,
      ReferralDetails,
      DeliveryPatient,
      Vaccine,
      EmergencyPatient,
      Attendance,
    ]),
    AuthModule,
    PatientsModule,
    ImmunisationModule,
    TokenCounterModule,
  ],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    ExceptionUtility,
    ServiceUtility,
    DispenserService,
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
