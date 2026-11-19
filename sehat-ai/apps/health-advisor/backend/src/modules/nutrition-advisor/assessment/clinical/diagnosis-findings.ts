import { AdvisorPreferences, DataQualityIssue, Finding } from '../../models/types';
import { ClinicalContext } from './context';
import { HEALTH_CONDITION_LABELS, LOW_HB } from './constants';

export function diagnosisFindings(ctx: ClinicalContext, dataQuality: DataQualityIssue[], prefs?: AdvisorPreferences): Finding[] {
  const findings: Finding[] = [];
  const flagged = new Set(dataQuality.map((issue) => issue.field));
  for (const d of ctx.diagnoses) {
    findings.push({
      id: `dx:${d.label}`, kind: 'recorded_diagnosis', label: d.label, status: 'info',
      value: 'Recorded diagnosis', interpretation: 'Recorded by a clinician in the EMR.',
      source: d.source, recordedAt: d.recordedAt,
    });
  }
  for (const condition of prefs?.healthConditions ?? []) {
    findings.push({
      id: `patient-condition:${condition}`,
      kind: 'patient_reported_condition',
      label: HEALTH_CONDITION_LABELS[condition],
      value: 'Patient-reported',
      status: 'info',
      interpretation: 'Selected in Patient Details; this is not verified as an EMR diagnosis.',
      source: 'Nutrition Advisor › Patient Details',
    });
  }

  const hb = ctx.labs.haemoglobin;
  if (hb.value == null) {
    findings.push({
      id: 'lab:hb', kind: 'unavailable', label: 'Haemoglobin', status: 'missing',
      interpretation: 'No verified haemoglobin result on record. Consider requesting a test if clinically indicated.',
    });
  } else if (!flagged.has('haemoglobin')) {
    const cutoff = LOW_HB[ctx.patient.sex];
    const low = hb.value < cutoff;
    findings.push({
      id: 'lab:hb', kind: 'lab_result', label: 'Haemoglobin', value: `${hb.value} g/dL${low ? ' (Low)' : ''}`,
      status: hb.isOutdated ? 'outdated' : low ? 'low' : 'normal',
      interpretation: low
        ? `Below ${cutoff} g/dL (WHO). Needs clinician review of the cause — this Advisor does not diagnose anaemia. Diet can emphasise iron-rich foods.`
        : 'Within the normal range.',
      source: hb.source, recordedAt: hb.recordedAt,
    });
    if (hb.value < 8) {
      findings.push({
        id: 'safety:hb_severe', kind: 'safety_warning', label: 'Very low haemoglobin', status: 'abnormal',
        interpretation: 'Haemoglobin below 8 g/dL. Clinician review is required before this plan is approved.',
        source: hb.source, recordedAt: hb.recordedAt,
      });
    }
  }

  if (ctx.screening.clinicalPallor.value) {
    findings.push({
      id: 'obs:pallor', kind: 'suspected', label: 'Clinical pallor (screening)', status: 'abnormal',
      interpretation: 'Screening sign only — not a diagnosis. A haemoglobin test is needed to confirm.',
      source: ctx.screening.clinicalPallor.source, recordedAt: ctx.screening.clinicalPallor.recordedAt,
    });
  }

  return findings;
}
