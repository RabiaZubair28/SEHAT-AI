import { Allergen, HealthCondition, MedicalRestriction } from './food';

export interface Preferences {
  allergies: Allergen[];
  otherAllergies?: string;
  dietType: "any" | "vegetarian" | "vegetarian_with_egg";
  medicalRestrictions: MedicalRestriction[];
  healthConditions?: HealthCondition[];
  excludedFoodIds: string[];
  preferredFoodIds: string[];
  budget: "low" | "medium" | "high";
  activityLevel: "sedentary" | "light" | "moderate";
  notes?: string;
  measurementCorrections?: { weightKg?: number; heightCm?: number; reason?: string };
}
