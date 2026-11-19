import { MedicalRestriction } from './food';
import { Preferences } from './preferences';
import { PlanStatus } from './status';

export interface SourcedValue<T = number> {
  value: T | null;
  unit?: string;
  source: string;
  recordedAt: string | null;
  isOutdated: boolean;
  isMissing: boolean;
}

export interface Finding {
  id: string;
  kind: "recorded_diagnosis" | "patient_reported_condition" | "lab_result" | "observation" | "suspected" | "unavailable" | "safety_warning";
  label: string;
  value?: string;
  status: string;
  interpretation: string;
  source?: string;
  recordedAt?: string | null;
}

export interface Recommendation {
  id: string;
  priority: number;
  title: string;
  titleUr: string;
  detail: string;
  detailUr: string;
  icon: string;
  tone: "red" | "green" | "blue" | "purple" | "orange";
  evidence: string[];
  basis: string;
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  vitaminC: number;
  sodiumMax: number;
  waterLitres: number;
  goal: "weight_loss" | "weight_gain" | "maintenance";
  methods: { nutrient: string; method: string }[];
  /** Drafted for a case needing individual doctor review. */
  provisional?: boolean;
  reviewReasons?: string[];
}

export interface DataQualityIssue {
  field: string;
  label: string;
  value: string;
  severity: "blocking" | "warning";
  message: string;
}

export interface Overview {
  patient: { name: string; mrNo: string; ageYears: number; sex: string; phoneMasked: string | null; phone: string | null };
  measurements: Record<string, SourcedValue<any>>;
  haemoglobin: SourcedValue;
  recordedAllergies: string[];
  dataQuality: DataQualityIssue[];
  eligibility: { status: "eligible" | "held" | "needs_data"; reasons: string[] };
  effective: { weightKg: number | null; heightCm: number | null; bmi: number | null; corrected: boolean };
  derivedRestrictions: MedicalRestriction[];
  targets: Targets | null;
  findings: Finding[];
  recommendations: Recommendation[];
  activityGuidance: { text: string; textUr: string; allowed: boolean; caution?: string };
  preferences: Preferences;
  foodData: { version: string; source: string };
  whatsAppConfigured: boolean;
  latestPlan: { id: number; version: number; status: PlanStatus; updatedAt: string } | null;
}
