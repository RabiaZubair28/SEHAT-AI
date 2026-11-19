export type MealSlot = "breakfast" | "mid_morning" | "lunch" | "evening_snack" | "dinner";
export type Allergen = "egg" | "dairy" | "gluten" | "fish" | "peanut" | "tree_nut";
export type MedicalRestriction = "low_salt" | "diabetic" | "low_fat";
export type HealthCondition = "diabetes" | "hypertension" | "heart_disease" | "chronic_kidney_disease" | "liver_disease" | "dyslipidemia";
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  vitaminC: number;
  sodium: number;
}

export interface FoodItem {
  id: string;
  name: string;
  nameUr: string;
  emoji: string;
  imageUrl?: string;
  group: string;
  serving: string;
  servingUr: string;
  nutrients: Nutrients;
  allergens: Allergen[];
  containsMeat?: boolean;
  containsFish?: boolean;
  containsEgg?: boolean;
  costTier: 1 | 2 | 3;
  slots: MealSlot[];
  tags: string[];
  scalable: boolean;
}

export interface MealSlotInfo {
  slot: MealSlot;
  label: string;
  labelUr: string;
  time: string;
}

export interface FoodLibrary {
  version: string;
  source: string;
  mealSlots: MealSlotInfo[];
  foods: FoodItem[];
}
