import { FOOD_BY_ID, FOOD_LIBRARY } from '../../foods/food-library';
import { FoodItem, MealSlot, PlanItem } from '../../models/types';
import { FoodRules, allowedFoods, exclusionReason } from './food-rules';

const BUDGET_TIER = { low: 1, medium: 2, high: 3 } as const;

/** Suggest safe swaps: same food group, allowed for this patient, fits the slot. */
export function suggestSubstitutes(foodId: string, slot: MealSlot, rules: FoodRules, limit = 4): FoodItem[] {
  const food = FOOD_BY_ID[foodId];
  if (!food) return [];
  const budget = BUDGET_TIER[rules.prefs.budget];
  const candidates = allowedFoods(rules).filter((f) => f.id !== foodId && f.slots.includes(slot));
  const sameGroup = candidates.filter((f) => f.group === food.group || (food.group === 'protein' && f.group === 'legume'));
  return [...sameGroup, ...candidates.filter((f) => !sameGroup.includes(f))]
    .sort((a, b) => Number(a.costTier > budget) - Number(b.costTier > budget) || Math.abs(a.nutrients.kcal - food.nutrients.kcal) - Math.abs(b.nutrients.kcal - food.nutrients.kcal))
    .slice(0, limit);
}

export function enforceRules(items: PlanItem[], slot: MealSlot, rules: FoodRules): PlanItem[] {
  const result: PlanItem[] = [];
  for (const item of items) {
    const food = FOOD_BY_ID[item.foodId];
    if (!food) continue;
    if (!exclusionReason(food, rules)) result.push(item);
    else {
      const substitute = suggestSubstitutes(item.foodId, slot, rules).find((f) => !result.some((x) => x.foodId === f.id));
      if (substitute) result.push({ foodId: substitute.id, portions: 1 });
    }
  }
  return result;
}
