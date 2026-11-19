import { AdvisorPreferences, DataQualityIssue, Finding } from '../../models/types';
import { ClinicalContext, Assessment } from './context';
import { bmiCategory } from '../targets';

export function anthropometricFindings(ctx: ClinicalContext, effective: Assessment['effective'], dataQuality: DataQualityIssue[], prefs?: AdvisorPreferences): Finding[] {
  const findings: Finding[] = [];
  const m = ctx.measurements;
  const flagged = new Set(dataQuality.map((i) => i.field));
  if (effective.bmi != null) {
    const cat = bmiCategory(effective.bmi);
    findings.push({
      id: 'obs:bmi', kind: 'observation', label: 'BMI', value: `${effective.bmi} (${cat})`,
      status: cat === 'Normal' ? 'normal' : cat === 'Underweight' ? 'low' : 'high',
      interpretation:
        cat === 'Normal' ? 'Within the healthy range.'
          : cat === 'Underweight' ? 'Below the healthy range. Recommend energy- and protein-dense meals.'
            : 'Above the healthy range. Recommend balanced calorie intake and gradual weight loss.',
      source: effective.corrected ? 'Corrected in Nutrition Advisor' : m.weightKg.source,
      recordedAt: m.weightKg.recordedAt,
    });
  }

  const sys = m.systolicBp.value;
  const dia = m.diastolicBp.value;
  if (sys != null && dia != null) {
    const inconsistent = flagged.has('bp');
    const high = !inconsistent && (sys >= 140 || dia >= 90);
    const low = !inconsistent && (sys < 90 || dia < 60);
    const hasHtn = ctx.diagnoses.some((d) => d.label === 'Hypertension') || (prefs?.healthConditions ?? []).includes('hypertension');
    findings.push({
      id: 'obs:bp', kind: high && !hasHtn ? 'suspected' : 'observation', label: 'Blood Pressure',
      value: `${sys} / ${dia} mmHg`,
      status: inconsistent ? 'abnormal' : high ? 'high' : low ? 'low' : 'normal',
      interpretation: inconsistent ? 'Inconsistent reading — please re-measure before relying on it.'
        : high ? (hasHtn ? 'Raised, with hypertension reported or recorded. Follow low-salt advice.' : 'Single raised reading — prompts clinician review; not a diagnosis of hypertension.')
          : low ? 'Low reading — prompts clinician review.' : 'Within normal range.',
      source: m.systolicBp.source, recordedAt: m.systolicBp.recordedAt,
    });
  }

  return findings;
}
