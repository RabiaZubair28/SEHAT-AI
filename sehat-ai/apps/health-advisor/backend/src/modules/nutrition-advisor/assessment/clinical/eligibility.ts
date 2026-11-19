import { AdvisorPreferences, DataQualityIssue, Eligibility } from '../../models/types';
import { ClinicalContext } from './context';
import { HEALTH_CONDITION_LABELS } from './constants';

export function checkEligibility(ctx: ClinicalContext, dataQuality: DataQualityIssue[], prefs?: AdvisorPreferences): Eligibility {
  const reasons: string[] = [];
  const { ageYears } = ctx.patient;

  if (ageYears < 18) {
    reasons.push(
      `Patient is ${ageYears} years old. Children and adolescents need growth-based (WHO z-score / CMAM) protocols — refer for professional nutrition assessment.`,
    );
  }
  if (ctx.pregnancyStatus?.status === 'pregnant') {
    reasons.push('Pregnancy recorded in ANC. Pregnancy requires the maternal nutrition protocol — refer to the ANC provider.');
  }
  if (ctx.pregnancyStatus?.status === 'lactating') {
    reasons.push('Recent delivery / PNC recorded. Lactation requires the maternal nutrition protocol — refer to the PNC provider.');
  }
  const complications = ctx.screening.complications.value ?? [];
  if (complications.length) {
    reasons.push(`Medical complications recorded (${complications.join(', ')}). Requires clinical management before diet planning.`);
  }
  const edema = ctx.measurements.edema.value;
  if (edema && edema !== 'No edema') {
    reasons.push(`Oedema recorded (${edema}). The doctor must review the assessment and individualize this draft before patient use.`);
  }
  for (const d of ctx.diagnoses) {
    if (d.label === 'Chronic kidney disease' || d.label === 'Liver disease') {
      reasons.push(`${d.label} recorded. Needs an individualized diet plan from a clinician or dietitian.`);
    }
  }
  for (const condition of prefs?.healthConditions ?? []) {
    if (condition === 'chronic_kidney_disease' || condition === 'liver_disease') {
      reasons.push(
        `${HEALTH_CONDITION_LABELS[condition]} selected in patient details. Needs an individualized diet plan from a clinician or dietitian.`,
      );
    }
  }
  if (reasons.length) return { status: 'held', reasons };

  const blocking = dataQuality.filter((i) => i.severity === 'blocking');
  if (blocking.length) {
    return { status: 'needs_data', reasons: blocking.map((i) => `${i.label}: ${i.message}`) };
  }
  return { status: 'eligible', reasons: [] };
}
