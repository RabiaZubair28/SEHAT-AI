import { forwardRef, Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientAdditionalInfo } from 'src/patient-additional-info/entities/patient-additional-info.entity';
import { PatientSocialDeterminants } from 'src/patient-social-determinants/entities/patient-social-determinant.entity';
import { User } from 'src/users/entities/user.entity';
import { MedicalHistory } from 'src/medical-history/entities/medical-history.entity';
import { VisitService } from 'src/visit/entities/visit.service';
import { ServiceUtility } from 'src/common/utils/service-utils.common';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { FamilyPlanningService } from 'src/family-planning/family-planning.service';
import { PatientQueue } from 'src/patient-queue/entities/patient-queue.entity';
import { AppointmentService } from 'src/appointments/entities/appointment-service.entity';
import { Service } from 'src/services/entities/service.entity';
import { FamilyPlanning } from 'src/family-planning/entities/family-planning.entity';
import { Visit } from 'src/visit/entities/visit.entity';
import { AncService } from 'src/anc/anc.service';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { ImmunisationDose } from 'src/immunisation/entities/immunisation-dosage.entity';
import { Ctg } from 'src/labs/entities/ctg.entity';
import { Ultrasound } from 'src/labs/entities/ultrasound.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { AncMedicalSurgicalHistory } from 'src/anc/entities/anc-medical-surgical-history.entity';
import { AncPregnancyInfo } from 'src/anc/entities/anc-pregnancy-info.entity';
import { PreviousPregnancy } from 'src/anc/entities/previous-pregnancy.entity';
import { VitalAssessment } from 'src/vital-assesment/entities/vital-assesment.entity';
import { PncService } from 'src/pnc/pnc.service';
import { PncBreastfeeding } from 'src/pnc/entities/pnc-breastfeeding.entity';
import { PncFamilyPlanning } from 'src/pnc/entities/pnc-family-planning.entity';
import { PncNutrition } from 'src/pnc/entities/pnc-nutrition.entity';
import { DeliveryService } from 'src/delivery/delivery.service';
import { DispenserService } from 'src/dispenser/dispenser.service';
import { Dispenser } from 'src/dispenser/entities/dispenser.entity';
import { AncVitalAssesment } from 'src/anc/entities/anc-vital-assesment.entity';
import { PncVitalAssesment } from 'src/pnc/entities/pnc-vital-assesment.entity';
import { Medicine } from 'src/medicine/entities/medicine.entity';
import { NutritionService } from 'src/nutrition/nutrition.service';
import { OpdService } from 'src/opd/opd.service';
import { OpdVitalAssesment } from 'src/opd/entities/opd-vital-assessment.entity';
import { OpdDiagnosis } from 'src/opd/entities/opd-diagnosis.entity';
import { OpdMedicalHistory } from 'src/opd/entities/opd-medical-history.entity';
import { MedicineVariant } from 'src/medicine/entities/medicine-variant.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { UserService } from 'src/user-services/entities/user-service.entity';
import { PreDeliveryAssessment } from 'src/delivery/entities/pre-delivery.entity';
import { PostDeliveryAssessment } from 'src/delivery/entities/post-delivery.entity';
import { NewbornAssessment } from 'src/delivery/entities/newborn-assesment.entity';
import { DischargeDetails } from 'src/delivery/entities/discharge-details.entity';
import { ReferralDetails } from 'src/delivery/entities/referral-details.entity';
import { DeliveryPatient } from 'src/delivery/entities/delivery-patients.entity';
import { Vaccine } from 'src/immunisation/entities/vaccine.entity';
import { ImmunisationCard } from 'src/immunisation/entities/immunisation-card.entity';
import { PatientImmunisation } from 'src/immunisation/entities/patient-immunisation.entity';
import { PatientPdfController } from './patient-pdf.controller';
import { PatientPdfService } from './patient-pdf.service';
import { EmergencyPatient } from 'src/emergency/entities/emergency-patient.entity';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { TokenCounterService } from 'src/token-counter/token-counter.service';
import { TokenCounter } from 'src/token-counter/entities/token-counter.entity';
import { ImmunisationModule } from 'src/immunisation/immunisation.module';
import { PatientDailyRollup } from './entities/patient-daily-rollup.entity';
import { PatientRollupService } from './patient-rollup.service';
import { PatientsQueryService } from './patients-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      PatientAdditionalInfo,
      PatientSocialDeterminants,
      User,
      MedicalHistory,
      Appointment,
      AppointmentService,
      PatientQueue,
      Service,
      FamilyPlanning,
      Visit,
      Immunisation,
      ImmunisationDose,
      Ctg,
      Ultrasound,
      Prescription,
      Diagnosis,
      AncMedicalSurgicalHistory,
      AncPregnancyInfo,
      PreviousPregnancy,
      VitalAssessment,
      PncBreastfeeding,
      PncFamilyPlanning,
      PncNutrition,
      Medicine,
      Dispenser,
      AncVitalAssesment,
      PncVitalAssesment,
      OpdVitalAssesment,
      OpdDiagnosis,
      OpdMedicalHistory,
      UserService,
      MedicineVariant,
      OtherPrescription,
      PreDeliveryAssessment,
      PostDeliveryAssessment,
      NewbornAssessment,
      DischargeDetails,
      ReferralDetails,
      DeliveryPatient,
      Vaccine,
      Immunisation,
      ImmunisationCard,
      PatientImmunisation,
      EmergencyPatient,
      Attendance,
      TokenCounter,
      PatientDailyRollup,
    ]),
    AuthModule,
    forwardRef(() => ImmunisationModule),
  ],
  controllers: [PatientsController, PatientPdfController],
  providers: [
    PatientsService,
    VisitService,
    ServiceUtility,
    FamilyPlanningService,
    AncService,
    PncService,
    DeliveryService,
    DispenserService,
    NutritionService,
    OpdService,
    TokenCounterService,
    PatientPdfService,
    PatientRollupService,
    PatientsQueryService,
  ],
  exports: [
    PatientsService,
    VisitService,
    PatientPdfService,
    PatientRollupService,
  ],
})
export class PatientsModule { }
