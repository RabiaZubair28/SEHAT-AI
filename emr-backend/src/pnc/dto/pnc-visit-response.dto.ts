import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BloodGroup,
  BreastfeedingIssue,
  OtherPrescriptionCategory,
  PncWarningSign,
} from 'src/common/enums/enums';

export class PncVitalAssessmentVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  weight: number;

  @ApiProperty({ type: Number })
  height: number;

  @ApiProperty({ type: Number })
  systolic_bp: number;

  @ApiProperty({ type: Number })
  diastolic_bp: number;

  @ApiProperty({ type: Number })
  temperature: number;

  @ApiProperty({ type: Number })
  pulse: number;

  @ApiProperty({ type: Number })
  spo2: number;

  @ApiProperty({ enum: BloodGroup, nullable: true })
  blood_group: BloodGroup | null;

  @ApiProperty({ type: Number })
  haemoglobin: number;

  @ApiProperty({ type: Number })
  blood_sugar_random: number;

  @ApiProperty({ type: Number })
  muac: number;

  @ApiProperty({ enum: PncWarningSign, isArray: true })
  warning_signs: PncWarningSign[];

  @ApiPropertyOptional({ type: String })
  otherWarningSign?: string;
}

export class PncNutritionVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  counselledOnNutrition: boolean;
}

export class PncBreastfeedingVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  early_breastfeeding: boolean;

  @ApiProperty({ type: Boolean })
  exclusive_breastfeeding: boolean;

  @ApiProperty({ enum: BreastfeedingIssue, isArray: true, nullable: true })
  breastfeeding_issues: BreastfeedingIssue[] | null;
}

export class PncFamilyPlanningVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Boolean })
  counseledOnFamilyPlanning: boolean;

  @ApiProperty({ type: Boolean })
  dispenserFpMethods: boolean;
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

  @ApiPropertyOptional({ type: String })
  medicineDosage: string | null;

  @ApiPropertyOptional({ type: Number })
  medicineDuration: number | null;

  @ApiPropertyOptional({ type: String })
  medicineInstruction: string | null;

  @ApiProperty({ type: Number })
  quantity: number | null;

  @ApiProperty({ type: () => MedicineVariantVisitData })
  medicineVariant: MedicineVariantVisitData;
}

export class OtherPrescriptionVisitData {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiPropertyOptional({ type: String })
  medicineDosage: string | null;

  @ApiProperty({ enum: OtherPrescriptionCategory, nullable: true })
  category: OtherPrescriptionCategory | null;
}

export class PncVisitResponseDto {
  @ApiProperty({ type: () => PncVitalAssessmentVisitData, nullable: true })
  pncVitalAssessment: PncVitalAssessmentVisitData | null;

  @ApiProperty({ type: () => PncNutritionVisitData, nullable: true })
  pncNutrition: PncNutritionVisitData | null;

  @ApiProperty({ type: () => PncBreastfeedingVisitData, nullable: true })
  pncBreastfeeding: PncBreastfeedingVisitData | null;

  @ApiProperty({ type: () => PncFamilyPlanningVisitData, nullable: true })
  pncFamilyPlanning: PncFamilyPlanningVisitData | null;

  @ApiProperty({ type: () => [PrescriptionVisitData], nullable: true })
  prescriptions: PrescriptionVisitData[] | null;

  @ApiProperty({ type: () => [OtherPrescriptionVisitData], nullable: true })
  otherPrescriptions: OtherPrescriptionVisitData[] | null;
}
