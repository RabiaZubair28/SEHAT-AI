import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Albumin,
  BloodGroup,
  Complication,
  CtgReporting,
  DeliveryOutcome,
  FetalAttitude,
  FetalMovement,
  FetalPresentation,
  LabTest,
  LabTestUrgency,
  ModeOfDelivery,
  OtherPrescriptionCategory,
  PlaceOfDelivery,
  PlacentaPosition,
  PregnancyType,
  PreviousIllness,
  PastObstetricComplication,
  ReasonForEdit,
  Trimester,
  UltrasoundReportings,
  WarningSign,
  AllergyType,
  FamilyPlanningMethod,
} from 'src/common/enums/enums';

export class PreviousPregnancyVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ enum: PlaceOfDelivery, nullable: true })
  place_of_delivery: PlaceOfDelivery | null;

  @ApiPropertyOptional({ enum: DeliveryOutcome, nullable: true })
  outcome: DeliveryOutcome | null;

  @ApiPropertyOptional({ enum: ModeOfDelivery, nullable: true })
  mode_of_delivery: ModeOfDelivery | null;

  @ApiPropertyOptional({ enum: Complication, isArray: true, nullable: true })
  complication: Complication[] | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  otherComplication: string | null;
}

export class PregnancyInfoVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  gravidity: number;

  @ApiProperty({ type: Number })
  parity: number;

  @ApiProperty({ type: String, format: 'date' })
  lmp: string;

  @ApiProperty({ type: Number })
  abortion: number;

  @ApiProperty({ type: Number })
  gestational_age: number;

  @ApiPropertyOptional({ enum: ReasonForEdit, nullable: true })
  reason_for_edit: ReasonForEdit | null;

  @ApiProperty({ type: String, format: 'date' })
  expected_date_of_delivery: string;

  @ApiProperty({ enum: Trimester })
  trimester: Trimester;

  @ApiPropertyOptional({
    type: [PreviousPregnancyVisitData],
    nullable: true,
  })
  previous_pregnancies: PreviousPregnancyVisitData[] | null;
}

export class MedicalSurgicalHistoryVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({
    enum: PreviousIllness,
    isArray: true,
    nullable: true,
  })
  previousIllness: PreviousIllness[] | null;

  @ApiPropertyOptional({
    enum: PastObstetricComplication,
    isArray: true,
    nullable: true,
  })
  past_obstetric_complication: PastObstetricComplication[] | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  previous_surgery: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  previous_surgery_details: string | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  known_allergies: boolean | null;

  @ApiPropertyOptional({ enum: AllergyType, isArray: true, nullable: true })
  allergy_details: AllergyType[] | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  previous_medication: boolean | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  previous_medication_details: string | null;

  @ApiProperty({ type: Boolean })
  used_family_planning: boolean;

  @ApiPropertyOptional({
    enum: FamilyPlanningMethod,
    isArray: true,
    nullable: true,
  })
  family_planning_methods: FamilyPlanningMethod[] | null;

  @ApiProperty({ type: Boolean })
  prior_blood_transfusion: boolean;
}

export class AncVitalAssessmentVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  weight: number;

  @ApiProperty({ type: Number })
  height: number;

  @ApiProperty({ type: Number })
  temperature: number;

  @ApiProperty({ type: Number })
  pulse: number;

  @ApiProperty({ type: Number })
  body_mass_index: number;

  @ApiProperty({ type: Number })
  change_in_weight: number;

  @ApiProperty({ type: Number })
  systolic_bp: number;

  @ApiProperty({ type: Number })
  diastolic_bp: number;

  @ApiProperty({ type: Number })
  respiratory_rate: number;

  @ApiProperty({ type: Number })
  spo2: number;

  @ApiPropertyOptional({ enum: BloodGroup, nullable: true })
  blood_group: BloodGroup | null;

  @ApiProperty({ type: Number })
  haemoglobin: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  fundal_height: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  blood_sugar_random: number | null;

  @ApiPropertyOptional({ enum: Albumin, nullable: true })
  albumin_urine_dipstick: Albumin | null;

  @ApiProperty({ type: Number })
  muac: number;

  @ApiPropertyOptional({ enum: WarningSign, isArray: true, nullable: true })
  warning_signs: WarningSign[] | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  otherWarningSign: string | null;
}

export class LabTestItemVisitData {
  @ApiProperty({ enum: LabTest })
  name: LabTest;

  @ApiProperty({ enum: LabTestUrgency })
  urgency: LabTestUrgency;

  @ApiPropertyOptional({ type: String, nullable: true })
  other?: string;
}

export class DiagnosisVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  screenedRubella: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  rubellaPositive: boolean | null;

  @ApiProperty({ type: Boolean })
  screenedHepB: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  hepBPositive: boolean | null;

  @ApiProperty({ type: Boolean })
  screenedHepC: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  hepCPositive: boolean | null;

  @ApiProperty({ type: Boolean })
  screenedThalassemia: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  thalassemiaPositive: boolean | null;

  @ApiProperty({ type: Boolean })
  screenedHiv: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  hivPositive: boolean | null;

  @ApiProperty({ type: Boolean })
  prescribedLabTest: boolean;

  @ApiPropertyOptional({
    type: [LabTestItemVisitData],
    nullable: true,
  })
  labTestsPrescribed: LabTestItemVisitData[] | null;
}

export class UltrasoundVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  requiresUltrasound: boolean;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  ultrasoundMachineAvailable: boolean | null;

  @ApiPropertyOptional({ enum: PregnancyType, nullable: true })
  typeOfPregnancy: PregnancyType | null;

  @ApiPropertyOptional({ enum: FetalMovement, nullable: true })
  fetalMovement: FetalMovement | null;

  @ApiPropertyOptional({ enum: FetalPresentation, nullable: true })
  fetalPresentation: FetalPresentation | null;

  @ApiPropertyOptional({ enum: FetalAttitude, nullable: true })
  attitude: FetalAttitude | null;

  @ApiPropertyOptional({ enum: PlacentaPosition, nullable: true })
  placenta: PlacentaPosition | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  amnioticFluidIndex: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  fetalHeartRate: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  fundalHeight: number | null;

  @ApiPropertyOptional({
    enum: UltrasoundReportings,
    isArray: true,
    nullable: true,
  })
  ultrasoundReporting: UltrasoundReportings[] | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  otherUltrasoundReporting: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ultrasoundObservations: string | null;
}

export class CtgVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  requiresCtg: boolean;

  @ApiProperty({ type: Boolean })
  ctgMachineAvailable: boolean;

  @ApiPropertyOptional({ enum: CtgReporting, nullable: true })
  ctgReporting: CtgReporting | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ctgObservations: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ctgRemarks: string | null;
}

export class MedicineVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String })
  category: string;
}

export class MedicineVariantVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  strength: string;

  @ApiProperty({ type: String })
  unit: string;

  @ApiProperty({ type: () => MedicineVisitData })
  medicine: MedicineVisitData;
}

export class PrescriptionVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  medicineDosage: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  medicineDuration: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  medicineInstruction: string | null;

  @ApiProperty({ type: () => MedicineVariantVisitData })
  medicineVariant: MedicineVariantVisitData;
}

export class OtherPrescriptionVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  medicineDosage: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  medicineDuration: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  medicineInstruction: string | null;

  @ApiPropertyOptional({
    enum: OtherPrescriptionCategory,
    nullable: true,
  })
  category: OtherPrescriptionCategory | null;
}

export class AncVisitResponseDto {
  @ApiProperty({ type: () => PregnancyInfoVisitData, nullable: true })
  pregnancyInfo: PregnancyInfoVisitData | null;

  @ApiProperty({
    type: () => MedicalSurgicalHistoryVisitData,
    nullable: true,
  })
  ancMedicalSurgicalHistory: MedicalSurgicalHistoryVisitData | null;

  @ApiProperty({
    type: () => AncVitalAssessmentVisitData,
    nullable: true,
  })
  ancVitalAssessment: AncVitalAssessmentVisitData | null;

  @ApiProperty({ type: () => DiagnosisVisitData, nullable: true })
  diagnosis: DiagnosisVisitData | null;

  @ApiProperty({ type: () => UltrasoundVisitData, nullable: true })
  ultrasound: UltrasoundVisitData | null;

  @ApiProperty({ type: () => CtgVisitData, nullable: true })
  ctg: CtgVisitData | null;

  @ApiProperty({ type: () => [PrescriptionVisitData], nullable: true })
  prescriptions: PrescriptionVisitData[] | null;

  @ApiProperty({
    type: () => [OtherPrescriptionVisitData],
    nullable: true,
  })
  otherPrescriptions: OtherPrescriptionVisitData[] | null;
}
