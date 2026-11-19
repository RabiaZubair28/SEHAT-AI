import { AdvisorPreferences, MedicalRestriction } from '../../models/types';
import { ClinicalContext } from './context';

export function deriveRestrictions(ctx: ClinicalContext, prefs?: AdvisorPreferences): MedicalRestriction[] {
  const labels = ctx.diagnoses.map((d) => d.label);
  const conditions = new Set(prefs?.healthConditions ?? []);
  const out = new Set<MedicalRestriction>();
  if (labels.includes('Hypertension') || conditions.has('hypertension') || conditions.has('heart_disease')) out.add('low_salt');
  if (labels.includes('Diabetes') || conditions.has('diabetes')) out.add('diabetic');
  if (labels.includes('Dyslipidemia') || conditions.has('dyslipidemia')) out.add('low_fat');
  return [...out];
}
