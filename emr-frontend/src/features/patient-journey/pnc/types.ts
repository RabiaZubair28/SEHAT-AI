import { BloodGroup } from "../data/constants";

export type PncWarningSign =
  | "Heavy vaginal bleeding"
  | "Respiratory difficulty"
  | "Convulsions/loss of consciousness"
  | "Severe headache with blurred vision"
  | "Severe abdominal pain"
  | "Foul smelling vaginal discharge"
  | "Urinary problem"
  | "Fever"
  | "PPD"
  | "Vaginal tears"
  | "Pain in calf"
  | "Hallucinations/Indication of self harm tendencies"
  | "None"
  | "Other";

export type BreastfeedingIssue =
  | "Sore or cracked nipples"
  | "Not enough breastmilk"
  | "Too much breastmilk"
  | "Baby is not latching on properly"
  | "Breast tenderness"
  | "Infections"
  | "Other";

export type OtherPrescriptionCategory = "Medicine" | "Supplement";

export interface PncVitalAssessmentVisitData {
  id: number;
  weight: number;
  height: number;
  systolic_bp: number;
  diastolic_bp: number;
  temperature: number;
  pulse: number;
  spo2: number;
  blood_group: BloodGroup | null;
  haemoglobin: number;
  blood_sugar_random: number;
  muac: number;
  warning_signs: PncWarningSign[] | null;
  otherWarningSign: string | null;
}

export interface PncNutritionVisitData {
  id: number;
  counselledOnNutrition: boolean;
}

export interface PncBreastfeedingVisitData {
  id: number;
  early_breastfeeding: boolean;
  exclusive_breastfeeding: boolean;
  breastfeeding_issues: BreastfeedingIssue[] | null;
}

export interface PncFamilyPlanningVisitData {
  id: number;
  counseledOnFamilyPlanning: boolean;
  dispenserFpMethods: boolean;
}

export interface MedicineVisitData {
  id: number;
  name: string;
  category: string;
}

export interface MedicineVariantVisitData {
  id: number;
  strength: string;
  unit: string;
  medicine: MedicineVisitData;
}

export interface PrescriptionVisitData {
  id: number;
  medicineDosage: string | null;
  medicineDuration: number | null;
  medicineInstruction: string | null;
  quantity: number | null;
  medicineVariant: MedicineVariantVisitData;
}

export interface OtherPrescriptionVisitData {
  id: number;
  name: string;
  medicineDosage: string | null;
  category: OtherPrescriptionCategory | null;
}

export interface PncVisitResponseDto {
  pncVitalAssessment: PncVitalAssessmentVisitData | null;
  pncNutrition: PncNutritionVisitData | null;
  pncBreastfeeding: PncBreastfeedingVisitData | null;
  pncFamilyPlanning: PncFamilyPlanningVisitData | null;
  prescriptions: PrescriptionVisitData[] | null;
  otherPrescriptions: OtherPrescriptionVisitData[] | null;
}

export interface GetPncVisitResponse {
  success: boolean;
  status: number;
  data: {
    anc: null;
    pnc: PncVisitResponseDto | null;
    opd: null;
    delivery: null;
    dispenser: null;
    nutrition: null;
    familyPlanning: null;
    immunization: null;
  };
  message: string;
}
