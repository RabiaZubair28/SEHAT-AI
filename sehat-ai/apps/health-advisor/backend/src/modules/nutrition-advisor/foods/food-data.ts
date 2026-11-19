import { MealSlot, Nutrients } from '../models/types';

export const ALL: MealSlot[] = ['breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner'];
export const MAIN: MealSlot[] = ['lunch', 'dinner'];
export const SNACK: MealSlot[] = ['mid_morning', 'evening_snack'];

export const n = (kcal: number, protein: number, carbs: number, fat: number, fiber: number, iron: number, vitaminC: number, sodium: number): Nutrients => ({ kcal, protein, carbs, fat, fiber, iron, vitaminC, sodium });
