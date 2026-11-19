import type { FoodItem, MealSlot, MedicalRestriction, Preferences } from '../types';
import { exclusionReason } from './food-rules';

export function suggestSubstitutes(
  foodId: string,
  slot: MealSlot,
  foodList: FoodItem[],
  prefs: Preferences,
  restrictions: MedicalRestriction[],
  limit = 4,
): FoodItem[] {
  const food = foodList.find((f) => f.id === foodId);
  if (!food) return [];
  const candidates = foodList.filter(
    (f) => f.id !== foodId && f.slots.includes(slot) && !exclusionReason(f, prefs, restrictions),
  );
  const same = candidates.filter((f) => f.group === food.group || (food.group === "protein" && f.group === "legume"));
  return [...same, ...candidates.filter((f) => !same.includes(f))]
    .sort((a, b) => Math.abs(a.nutrients.kcal - food.nutrients.kcal) - Math.abs(b.nutrients.kcal - food.nutrients.kcal))
    .slice(0, limit);
}
