import { MealSlot, Nutrients } from './food';

export interface PlanItem {
  foodId: string;
  portions: number; // multiples of the food's serving, step 0.5
}

export interface PlanMeal {
  slot: MealSlot;
  time: string;
  items: PlanItem[];
}

export interface PlanDay {
  day: number;
  meals: PlanMeal[];
}

export interface MealPlanContent {
  days: PlanDay[];
}

export interface NutrientTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  vitaminC: number;
  sodiumMax: number;
  waterLitres: number;
  goal: 'weight_loss' | 'weight_gain' | 'maintenance';
  methods: { nutrient: string; method: string }[];
  /** Drafted for a case needing individual doctor review; the doctor confirms or adjusts. */
  provisional?: boolean;
  reviewReasons?: string[];
}
