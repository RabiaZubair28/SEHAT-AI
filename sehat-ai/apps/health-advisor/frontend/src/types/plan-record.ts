import { PlanStatus } from './status';
import { Preferences } from './preferences';
import { DataQualityIssue, Finding, Recommendation, Targets } from './overview';
import { Handout, PlanContent } from './plan';
import { MedicalRestriction } from './food';

export interface PlanRecord {
  id: number;
  appointmentServiceId: number;
  version: number;
  status: PlanStatus;
  preferences: Preferences;
  content: PlanContent;
  handout: Handout;
  context: {
    generation?: { model: string; modelVersion: string | null; elapsedMs: number; usage: Record<string, number> | null; rawText: string };
    effective?: { weightKg: number | null; heightCm: number | null; bmi: number | null; corrected: boolean };
    capturedAt: string;
    targets: Targets | null;
    clinicalReview?: { required: boolean; individualized: boolean; reasons: string[] };
    findings: Finding[];
    recommendations: Recommendation[];
    dataQuality: DataQualityIssue[];
    restrictions: MedicalRestriction[];
    activityAllowed: boolean;
    activityCaution: string | null;
  };
  generatedBy: string;
  foodDataVersion: string;
  contentHash: string;
  reviewComment: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
}
