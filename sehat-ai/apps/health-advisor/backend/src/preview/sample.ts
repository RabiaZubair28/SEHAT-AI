import { calculateBmi, calculateTargets } from '../modules/nutrition-advisor/assessment/targets';
import { DEFAULT_PREFERENCES } from '../modules/nutrition-advisor/models/types';

/** Entirely fictional: never loads EMR records or credentials from the host app. */
export function syntheticPatient() {
  const input = { ageYears: 42, sex: 'Female' as const, weightKg: 76, heightCm: 158,
    activityLevel: 'light' as const, restrictions: ['low_salt' as const] };
  return {
    synthetic: true,
    demographics: { ageYears: input.ageYears, sex: input.sex },
    measurements: { weightKg: input.weightKg, heightCm: input.heightCm,
      bmi: calculateBmi(input.weightKg, input.heightCm) },
    evidence: [
      { id: 'diagnosis-1', kind: 'recorded_diagnosis', label: 'Hypertension', source: 'Synthetic case' },
      { id: 'bp-1', kind: 'observation', label: 'Blood pressure', value: '138/86', unit: 'mmHg', status: 'current', source: 'Synthetic case' },
      { id: 'hb-1', kind: 'unavailable', label: 'Haemoglobin', value: null, status: 'missing', source: 'Synthetic case' },
    ],
    pregnancyStatus: 'not_pregnant_or_lactating',
    preferences: { ...DEFAULT_PREFERENCES, activityLevel: input.activityLevel,
      allergies: ['peanut'], medicalRestrictions: input.restrictions, healthConditions: ['hypertension'],
      preferredFoodIds: ['masoor_daal', 'whole_wheat_roti'], excludedFoodIds: [],
      notes: 'Prefer familiar home-cooked Pakistani meals.' },
    calculatedTargets: calculateTargets(input),
  };
}
