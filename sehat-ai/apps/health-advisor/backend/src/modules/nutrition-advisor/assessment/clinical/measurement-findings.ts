import { DataQualityIssue, Finding } from '../../models/types';
import { ClinicalContext, Assessment } from './context';

export function measurementFindings(ctx: ClinicalContext, effective: Assessment['effective'], dataQuality: DataQualityIssue[]): Finding[] {
  const findings: Finding[] = [];
  const m = ctx.measurements;
  const flagged = new Set(dataQuality.map((i) => i.field));
  const temp = m.temperatureF.value;
  if (temp != null) {
    const fever = !flagged.has('temperature') && temp >= 100.4;
    findings.push({
      id: 'obs:temp', kind: 'observation', label: 'Temperature', value: `${temp} °F`,
      status: flagged.has('temperature') ? 'abnormal' : fever ? 'high' : 'normal',
      interpretation: flagged.has('temperature') ? 'Implausible reading — please re-check.'
        : fever ? 'Fever — prompts clinician review. Encourage fluids.' : 'Within normal range.',
      source: m.temperatureF.source, recordedAt: m.temperatureF.recordedAt,
    });
  }

  const pulse = m.pulse.value;
  if (pulse != null) {
    const abnormal = pulse < 50 || pulse > 100;
    findings.push({
      id: 'obs:pulse', kind: 'observation', label: 'Pulse', value: `${pulse} bpm`,
      status: abnormal ? 'abnormal' : 'normal',
      interpretation: flagged.has('pulse') ? 'Implausible reading — please re-count before relying on it.'
        : abnormal ? 'Outside 50–100 bpm — prompts clinician review.' : 'Within normal range.',
      source: m.pulse.source, recordedAt: m.pulse.recordedAt,
    });
  }

  if (m.weightKg.isOutdated && !effective.corrected) {
    findings.push({
      id: 'gap:weight_old', kind: 'unavailable', label: 'Weight is outdated', status: 'outdated',
      interpretation: 'Last weight is more than 30 days old. Re-measure for accurate targets.',
      source: m.weightKg.source, recordedAt: m.weightKg.recordedAt,
    });
  }

  for (const issue of dataQuality) {
    findings.push({
      id: `quality:${issue.field}`, kind: 'safety_warning', label: `${issue.label} needs checking`,
      value: issue.value, status: 'abnormal', interpretation: issue.message,
    });
  }

  if (ctx.recordedAllergies.length) {
    findings.push({
      id: 'obs:allergies', kind: 'observation', label: 'Recorded allergies', value: ctx.recordedAllergies.join(', '),
      status: 'info', interpretation: 'Confirm whether any are food allergies in Patient Preferences.',
    });
  }

  return findings;
}
