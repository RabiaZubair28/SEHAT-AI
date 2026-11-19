import { calculateBmi } from '../targets';
import { DataQualityIssue, SourcedValue } from '../../models/types';
import { ClinicalContext } from './context';

const fmt = (v: SourcedValue, digits = 0) => v.value == null ? '—' : `${Number(v.value).toFixed(digits)}${v.unit ? ` ${v.unit}` : ''}`;

export function checkDataQuality(ctx: ClinicalContext): DataQualityIssue[] {
  const m = ctx.measurements;
  const issues: DataQualityIssue[] = [];
  const add = (field: string, label: string, value: string, severity: DataQualityIssue['severity'], message: string) =>
    issues.push({ field, label, value, severity, message });

  const w = m.weightKg.value;
  const h = m.heightCm.value;
  if (w == null || w <= 0) add('weight', 'Weight', '—', 'blocking', 'Weight is not recorded. Enter a measured weight.');
  else if (w < 25 || w > 250) add('weight', 'Weight', fmt(m.weightKg, 1), 'blocking', 'Weight is outside the possible adult range (25–250 kg). Please re-measure.');

  if (h == null || h <= 0) add('height', 'Height', '—', 'blocking', 'Height is not recorded. Enter a measured height.');
  else if (h < 120 || h > 230) add('height', 'Height', fmt(m.heightCm), 'blocking', 'Height is outside the possible adult range (120–230 cm). Please re-measure.');

  if (w && h && w >= 25 && h >= 120) {
    const bmi = calculateBmi(w, h);
    if (bmi < 12 || bmi > 70) add('bmi', 'BMI', bmi.toFixed(1), 'blocking', 'Calculated BMI is not physiologically plausible; check weight and height.');
    if (m.bmi.value && Math.abs(m.bmi.value - bmi) > 1) {
      add('bmi', 'BMI', fmt(m.bmi, 1), 'warning', `Recorded BMI does not match weight and height (calculated ${bmi.toFixed(1)}). The calculated value is used.`);
    }
  }

  const sys = m.systolicBp.value;
  const dia = m.diastolicBp.value;
  if (sys != null && dia != null && sys <= dia) {
    add('bp', 'Blood Pressure', `${sys} / ${dia} mmHg`, 'warning', 'Systolic is not higher than diastolic — values may be swapped. Please re-check.');
  } else if (sys != null && (sys < 70 || sys > 250)) {
    add('bp', 'Blood Pressure', `${sys} / ${dia ?? '—'} mmHg`, 'warning', 'Systolic pressure is outside the plausible range. Please re-check.');
  }

  const pulse = m.pulse.value;
  if (pulse != null && (pulse < 30 || pulse > 200)) {
    add('pulse', 'Pulse', fmt(m.pulse), 'warning', 'Pulse is outside the plausible range (30–200 bpm). Please re-count.');
  }

  const temp = m.temperatureF.value;
  if (temp != null && (temp < 93 || temp > 108)) {
    add('temperature', 'Temperature', fmt(m.temperatureF, 1), 'warning', 'Temperature is outside the plausible range. Please re-check.');
  }

  const muac = m.muacCm.value;
  if (muac != null && (muac < 15 || muac > 60)) {
    add('muac', 'MUAC', fmt(m.muacCm, 1), 'warning',
      muac > 100 ? 'MUAC looks like it was entered in mm instead of cm. Please confirm the unit.' : 'MUAC is outside the plausible adult range (15–60 cm).');
  }

  const hb = ctx.labs.haemoglobin.value;
  if (hb != null && (hb < 3 || hb > 25)) {
    add('haemoglobin', 'Haemoglobin', fmt(ctx.labs.haemoglobin, 1), 'warning', 'Haemoglobin is outside the plausible range; it is not used for advice.');
  }

  return issues;
}
