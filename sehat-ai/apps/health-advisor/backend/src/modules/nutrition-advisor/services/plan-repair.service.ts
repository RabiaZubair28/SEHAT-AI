import { FOOD_BY_ID } from '../foods/food-library';
import { allowedFoods, enforceRules, FoodRules, fitToTargets, generateRuleBasedPlan, normalizePlan } from '../meal-planning/meal-planner';
import { MealPlanContent, MEAL_SLOTS, NutrientTargets, PLAN_DAYS } from '../models/types';
import { SLOT_KEYS } from './plan-schema';

// Everyday staples may repeat; other foods are limited for variety.
const STAPLES = new Set(['whole_wheat_roti', 'white_rice', 'brown_rice', 'kachumber_salad', 'plain_yogurt', 'lemon_water']);
const MAX_WEEKLY_REPEATS = 3;

/** Keep one food per group in a meal (two for fruit/vegetables) so meals stay balanced. */
const balanceMeal = (ids: string[]) => {
  const seen: Record<string, number> = {};
  return ids.filter((id) => {
    const group = FOOD_BY_ID[id].group;
    const limit = group === 'vegetable' || group === 'fruit' ? 2 : 1;
    seen[group] = (seen[group] ?? 0) + 1;
    return seen[group] <= limit;
  });
};

export class PlanRepairService {
  repair(raw: any, rules: FoodRules, targets: NutrientTargets): MealPlanContent | null {
    const allowed = new Set(allowedFoods(rules).map((f) => f.id));
    const days: any[] = Array.isArray(raw?.days) ? raw.days.slice(0, PLAN_DAYS) : [];
    const proposal: MealPlanContent = {
      days: days.map((d: any, idx: number) => ({
        day: idx + 1,
        meals: Object.entries(SLOT_KEYS).map(([key, slot]) => ({
          slot,
          time: '',
          items: balanceMeal(
            [...new Set<string>((Array.isArray(d?.[key]) ? d[key] : []).map(String))].filter(
              (id) => allowed.has(id) && FOOD_BY_ID[id]?.slots.includes(slot),
            ),
          ).map((foodId) => ({ foodId, portions: 1 })),
        })),
      })),
    };
    const normalized = normalizePlan(proposal);
    const totalSlots = PLAN_DAYS * MEAL_SLOTS.length;
    const filled = normalized.days.flatMap((d) => d.meals).filter((m) => m.items.length > 0).length;
    if (filled < totalSlots * 0.7) return null;

    const backup = generateRuleBasedPlan(rules, targets);
    const weeklyCount: Record<string, number> = {};
    for (const day of normalized.days) {
      for (const meal of day.meals) {
        const pattern = backup.days[day.day - 1].meals.find((m) => m.slot === meal.slot)!;
        let items = enforceRules(meal.items, meal.slot, rules);

        // Variety: a non-staple food appears at most 3 times a week; swap extras
        // for the same food group from the approved pattern.
        items = items.flatMap((item) => {
          const food = FOOD_BY_ID[item.foodId];
          if (STAPLES.has(food.id) || (weeklyCount[food.id] ?? 0) < MAX_WEEKLY_REPEATS) return [item];
          const swap = pattern.items.find((p) => FOOD_BY_ID[p.foodId].group === food.group && !items.some((i) => i.foodId === p.foodId));
          return swap ? [{ ...swap }] : [];
        });

        // Structure: add any food group the approved pattern has but the meal lacks
        // (e.g. a protein at breakfast, a vegetable at dinner).
        const groups = new Set(items.map((i) => FOOD_BY_ID[i.foodId].group));
        const proteinLike = (g: string) => g === 'protein' || g === 'legume';
        for (const p of pattern.items) {
          const g = FOOD_BY_ID[p.foodId].group;
          const covered = groups.has(g) || (proteinLike(g) && [...groups].some(proteinLike));
          const overused = !STAPLES.has(p.foodId) && (weeklyCount[p.foodId] ?? 0) >= MAX_WEEKLY_REPEATS;
          if (!covered && !overused && !items.some((i) => i.foodId === p.foodId)) {
            items.push({ ...p });
            groups.add(g);
          }
        }

        meal.items = items.length ? items : pattern.items.map((i) => ({ ...i }));
        for (const i of meal.items) weeklyCount[i.foodId] = (weeklyCount[i.foodId] ?? 0) + 1;
      }
    }
    return fitToTargets(normalized, targets);
  }
}
