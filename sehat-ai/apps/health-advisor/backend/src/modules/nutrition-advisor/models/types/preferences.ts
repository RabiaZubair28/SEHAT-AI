import { Allergen } from './food';

export type DietType = 'any' | 'vegetarian' | 'vegetarian_with_egg';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate';
export type Budget = 'low' | 'medium' | 'high';
export type MedicalRestriction = 'low_salt' | 'diabetic' | 'low_fat';
export type HealthCondition =
  | 'diabetes'
  | 'hypertension'
  | 'heart_disease'
  | 'chronic_kidney_disease'
  | 'liver_disease'
  | 'dyslipidemia';

export interface AdvisorPreferences {
  allergies: Allergen[];
  otherAllergies?: string;
  dietType: DietType;
  medicalRestrictions: MedicalRestriction[];
  healthConditions?: HealthCondition[];
  excludedFoodIds: string[]; // dislikes or not available locally
  preferredFoodIds: string[];
  budget: Budget;
  activityLevel: ActivityLevel;
  notes?: string; // free-text preferences, passed to the AI as data only
  measurementCorrections?: {
    weightKg?: number;
    heightCm?: number;
    reason?: string;
  };
}

export const DEFAULT_PREFERENCES: AdvisorPreferences = {
  allergies: [],
  dietType: 'any',
  medicalRestrictions: [],
  healthConditions: [],
  excludedFoodIds: [],
  preferredFoodIds: [],
  budget: 'low',
  activityLevel: 'sedentary',
};
