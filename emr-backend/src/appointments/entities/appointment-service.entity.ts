import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Appointment } from 'src/appointments/entities/appointment.entity';
import { Service } from 'src/services/entities/service.entity';
import { DeliveryProgressStatus, PatientStatus } from 'src/common/enums/enums';
import { FamilyPlanning } from 'src/family-planning/entities/family-planning.entity';
import { AncPregnancyInfo } from 'src/anc/entities/anc-pregnancy-info.entity';
import { AncMedicalSurgicalHistory } from 'src/anc/entities/anc-medical-surgical-history.entity';
import { Diagnosis } from 'src/diagnosis-prescriptions/entities/diagnosis.entity';
import { Prescription } from 'src/diagnosis-prescriptions/entities/prescription.entity';
import { Ultrasound } from 'src/labs/entities/ultrasound.entity';
import { Ctg } from 'src/labs/entities/ctg.entity';
import { Immunisation } from 'src/immunisation/entities/immunisation.entity';
import { PncBreastfeeding } from 'src/pnc/entities/pnc-breastfeeding.entity';
import { PncFamilyPlanning } from 'src/pnc/entities/pnc-family-planning.entity';
import { PncNutrition } from 'src/pnc/entities/pnc-nutrition.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { BaseEntityInfo } from 'src/common/common.entities';
import { AncVitalAssesment } from 'src/anc/entities/anc-vital-assesment.entity';
import { PncVitalAssesment } from 'src/pnc/entities/pnc-vital-assesment.entity';
import { PreDeliveryAssessment } from 'src/delivery/entities/pre-delivery.entity';
import { PostDeliveryAssessment } from 'src/delivery/entities/post-delivery.entity';
import { NewbornAssessment } from 'src/delivery/entities/newborn-assesment.entity';
import { DischargeDetails } from 'src/delivery/entities/discharge-details.entity';
import { ReferralDetails } from 'src/delivery/entities/referral-details.entity';
import { NutritionServiceInfo } from 'src/nutrition/entities/nutrition-service-info.entity';
import { NutritionVitalAssessment } from 'src/nutrition/entities/nutrition-vital-assessment.entity';
import { DeliveryPatient } from 'src/delivery/entities/delivery-patients.entity';
import { OpdMedicalHistory } from 'src/opd/entities/opd-medical-history.entity';
import { OpdDiagnosis } from 'src/opd/entities/opd-diagnosis.entity';
import { OpdVitalAssesment } from 'src/opd/entities/opd-vital-assessment.entity';
import { OtherPrescription } from 'src/diagnosis-prescriptions/entities/other-prescription.entity';
import { Dispenser } from 'src/dispenser/entities/dispenser.entity';
@Entity('appointment_services')
@Index('idx_appt_services_composite', ['appointment', 'status'])
export class AppointmentService extends BaseEntityInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.PENDING,
  })
  status: PatientStatus;

  @Column({
    name: 'delivery_progress_status',
    type: 'enum',
    enum: DeliveryProgressStatus,
    nullable: true,
  })
  deliveryProgressStatus?: DeliveryProgressStatus;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(
    () => Appointment,
    (appointment) => appointment.appointmentServices,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Service, (service) => service.appointmentServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToOne(() => FamilyPlanning, (family) => family.appointmentService, {
    cascade: true,
  })
  familyPlanning: FamilyPlanning;


@OneToOne(
  () => Dispenser,
  (dispenser) => dispenser.appointmentService,
  {
    cascade: true,
  },
)
dispenser: Dispenser;

  @OneToOne(
    () => AncPregnancyInfo,
    (pregnancyInfo) => pregnancyInfo.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  pregnancyInfo: AncPregnancyInfo;

  @OneToOne(
    () => AncMedicalSurgicalHistory,
    (medicalHistory) => medicalHistory.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  ancMedicalSurgicalHistory: AncMedicalSurgicalHistory;

  @OneToOne(
    () => AncVitalAssesment,
    (assessment) => assessment.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  ancVitalAssessment: AncVitalAssesment;

  @OneToOne(
    () => PncVitalAssesment,
    (assessment) => assessment.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  pncVitalAssessment: PncVitalAssesment;

  @OneToOne(() => Diagnosis, (diagnosis) => diagnosis.appointmentService, {
    cascade: true,
    eager: true,
  })
  diagnosis: Diagnosis;

  @OneToMany(
    () => Prescription,
    (prescription) => prescription.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  prescriptions: Prescription[];

  @OneToMany(
    () => OtherPrescription,
    (prescription) => prescription.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  otherPrescriptions: OtherPrescription[];

  @OneToOne(() => Ultrasound, (ultrasound) => ultrasound.appointmentService, {
    cascade: true,
    eager: true,
  })
  ultrasound?: Ultrasound | null;

  @OneToOne(() => Ctg, (ctg) => ctg.appointmentService, {
    cascade: true,
    eager: true,
  })
  ctg?: Ctg | null;

  @OneToMany(
    () => Immunisation,
    (immunisation) => immunisation.appointmentService,
  )
  immunisations: Immunisation[];

  @OneToOne(
    () => PncBreastfeeding,
    (pncBreastfeeding) => pncBreastfeeding.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  pncBreastfeeding: PncBreastfeeding;

  @OneToOne(
    () => PncFamilyPlanning,
    (pncFamilyPlanning) => pncFamilyPlanning.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  pncFamilyPlanning: PncFamilyPlanning;

  @OneToOne(
    () => PncNutrition,
    (pncNutrition) => pncNutrition.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  pncNutrition: PncNutrition;

  // delivery relations
  @OneToOne(
    () => PreDeliveryAssessment,
    (preDeliveryAssesment) => preDeliveryAssesment.appointmentService,
    {
      cascade: true,
    },
  )
  preDeliveryAssesment: PreDeliveryAssessment;

  @OneToOne(
    () => PostDeliveryAssessment,
    (postDeliveryAssesment) => postDeliveryAssesment.appointmentService,
    {
      cascade: true,
    },
  )
  postDeliveryAssesment: PostDeliveryAssessment;

  @OneToMany(
    () => NewbornAssessment,
    (newbornAssesment) => newbornAssesment.appointmentService,
    {
      cascade: true,
    },
  )
  newbornAssesment: NewbornAssessment[];

  @OneToOne(
    () => DischargeDetails,
    (deliveryDischargeDetails) => deliveryDischargeDetails.appointmentService,
    {
      cascade: true,
    },
  )
  deliveryDischargeDetails: DischargeDetails;

  @OneToMany(
    () => ReferralDetails,
    (deliveryReferralDetails) => deliveryReferralDetails.appointmentService,
    {
      cascade: true,
    },
  )
  deliveryReferralDetails: ReferralDetails[];

  @OneToMany(
    () => DeliveryPatient,
    (deliveryPatients) => deliveryPatients.appointmentService,
    {
      cascade: true,
    },
  )
  deliveryPatients: DeliveryPatient[];

  // Nutrition Module Relations
  @OneToOne(
    () => NutritionServiceInfo,
    (nutritionServiceInfo) => nutritionServiceInfo.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  nutritionServiceInfo: NutritionServiceInfo;

  @OneToOne(
    () => NutritionVitalAssessment,
    (nutritionVitalAssessment) =>
      nutritionVitalAssessment.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  nutritionVitalAssessment: NutritionVitalAssessment;

  @OneToOne(
    () => OpdMedicalHistory,
    (opdMedicalHistory) => opdMedicalHistory.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  opdMedicalHistory: OpdMedicalHistory;

  @OneToOne(
    () => OpdDiagnosis,
    (opdDiagnosis) => opdDiagnosis.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  opdDiagnosis: OpdDiagnosis;

  @OneToOne(
    () => OpdVitalAssesment,
    (opdVitals) => opdVitals.appointmentService,
    {
      cascade: true,
      eager: true,
    },
  )
  opdVitals: OpdVitalAssesment;
}
