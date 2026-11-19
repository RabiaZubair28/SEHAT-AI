import { HealthCondition } from '../../models/types';

// Conditions whose dietary management needs a specialist protocol (NA-07).
export const HEALTH_CONDITION_LABELS: Record<HealthCondition, string> = {
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  heart_disease: 'Heart disease',
  chronic_kidney_disease: 'Chronic kidney disease',
  liver_disease: 'Liver disease',
  dyslipidemia: 'Dyslipidemia / high cholesterol',
};
export const LOW_HB = { Male: 13, Female: 12, Other: 12 }; // WHO, g/dL, non-pregnant adults
