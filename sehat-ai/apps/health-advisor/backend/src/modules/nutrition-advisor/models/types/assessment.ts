import { MealSlot, Nutrients } from './food';

export type FindingKind =
  | 'recorded_diagnosis'
  | 'patient_reported_condition'
  | 'lab_result'
  | 'observation'
  | 'suspected'
  | 'unavailable'
  | 'safety_warning';

export type FindingStatus = 'low' | 'high' | 'normal' | 'abnormal' | 'info' | 'missing' | 'outdated';

export interface SourcedValue<T = number> {
  value: T | null;
  unit?: string;
  source: string; // e.g. "Nutrition › Vitals & Assessment"
  recordedAt: string | null; // ISO date
  isOutdated: boolean;
  isMissing: boolean;
}

export interface Finding {
  id: string;
  kind: FindingKind;
  label: string;
  value?: string;
  status: FindingStatus;
  interpretation: string;
  source?: string;
  recordedAt?: string | null;
}

export interface DataQualityIssue {
  field: string;
  label: string;
  value: string;
  severity: 'blocking' | 'warning';
  message: string;
}

export interface Recommendation {
  id: string;
  priority: number; // 1 = highest
  title: string;
  titleUr: string;
  detail: string;
  detailUr: string;
  icon: string;
  tone: 'red' | 'green' | 'blue' | 'purple' | 'orange';
  evidence: string[]; // Finding ids that justify this advice
  basis: string; // approved guideline reference
}

export interface Eligibility {
  status: 'eligible' | 'held' | 'needs_data';
  reasons: string[];
}

export interface PlanWarning {
  day?: number;
  slot?: MealSlot;
  foodId?: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface DayTotals extends Nutrients {
  day: number;
}
