import { DataQualityIssue, Eligibility, Finding, MedicalRestriction, NutrientTargets, Recommendation, SourcedValue } from '../../models/types';

export interface RecordedDiagnosis {
  label: string;
  source: string;
  recordedAt: string | null;
}

export interface MedicationItem {
  name: string;
  dosage: string | null;
  instruction: string | null;
  source: string;
}

export interface MedicationContext {
  /** Whether the encounter says medicines/supplements are given; null when not recorded. */
  given: boolean | null;
  items: MedicationItem[];
}

export interface ClinicalContext {
  patient: {
    ageYears: number;
    sex: 'Male' | 'Female' | 'Other';
  };
  measurements: {
    weightKg: SourcedValue;
    heightCm: SourcedValue;
    bmi: SourcedValue;
    systolicBp: SourcedValue;
    diastolicBp: SourcedValue;
    pulse: SourcedValue;
    temperatureF: SourcedValue;
    muacCm: SourcedValue;
    spo2: SourcedValue;
    edema: SourcedValue<string>;
  };
  labs: {
    haemoglobin: SourcedValue;
  };
  screening: {
    clinicalPallor: SourcedValue<boolean>;
    complications: SourcedValue<string[]>;
  };
  diagnoses: RecordedDiagnosis[];
  recordedAllergies: string[];
  pregnancyStatus: { status: 'pregnant' | 'lactating'; source: string; recordedAt: string | null } | null;
  medications?: MedicationContext;
}

export interface Assessment {
  dataQuality: DataQualityIssue[];
  eligibility: Eligibility;
  effective: { weightKg: number | null; heightCm: number | null; bmi: number | null; corrected: boolean };
  derivedRestrictions: MedicalRestriction[];
  targets: NutrientTargets | null;
  findings: Finding[];
  recommendations: Recommendation[];
  activityGuidance: { text: string; textUr: string; allowed: boolean; caution?: string };
}
