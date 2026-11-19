import { ActivityLevel, MedicalRestriction } from '../../models/types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
};

export interface TargetInput {
  ageYears: number;
  sex: 'Male' | 'Female' | 'Other';
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  restrictions: MedicalRestriction[];
}

export const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export const calculateBmi = (weightKg: number, heightCm: number) =>
  Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

export const bmiCategory = (bmi: number) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};
