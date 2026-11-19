import { Finding } from '../../models/types';
import { Assessment, ClinicalContext } from './context';

export function activityGuidanceFor(ctx: ClinicalContext, findings: Finding[]): Assessment['activityGuidance'] {
  const needsClearance = findings.some(
    (f) =>
      (f.id === 'obs:bp' && f.status !== 'normal') ||
      (f.id === 'obs:pulse' && f.status !== 'normal') ||
      (f.id === 'obs:temp' && f.status === 'high') ||
      f.id === 'safety:hb_severe',
  );
  if (needsClearance) {
    return {
      allowed: false,
      text: 'Ask the doctor before starting new exercise. Continue normal daily activities.',
      textUr: 'نئی ورزش شروع کرنے سے پہلے ڈاکٹر سے مشورہ کریں۔ روزمرہ کے معمول کے کام جاری رکھیں۔',
      caution: 'Abnormal vital signs or low haemoglobin recorded — clinician clearance needed before exercise advice.',
    };
  }
  const obese = (ctx.measurements.bmi.value ?? 0) >= 30;
  return obese
    ? {
        allowed: true,
        text: 'Start with 10–15 minutes of walking daily and slowly build up to 30 minutes, 5 days a week.',
        textUr: 'روزانہ 10 سے 15 منٹ پیدل چلنے سے شروع کریں اور آہستہ آہستہ ہفتے میں 5 دن 30 منٹ تک لے جائیں۔',
      }
    : {
        allowed: true,
        text: 'Walk briskly for 30 minutes, 5 days a week, or as tolerated.',
        textUr: 'ہفتے میں 5 دن، روزانہ 30 منٹ تیز قدمی کریں یا جتنا آسانی سے ہو سکے۔',
      };
}
