import { FOOD_BY_ID } from '../../foods/food-library';
import { MAX_PORTION, MIN_PORTION } from '../rules/food-rules';
import { MEAL_SLOTS, MealPlanContent, PLAN_DAYS, PlanItem } from '../../models/types';

/**
 * Sanitize any plan (AI proposal or user edit) into a well-formed 7-day plan:
 * unknown foods removed, portions clamped to 0.5–4 in 0.5 steps, slots fixed.
 */
export function normalizePlan(plan: MealPlanContent): MealPlanContent {
  const byDay = new Map((plan?.days ?? []).map((d) => [Number(d.day), d]));
  return {
    days: Array.from({ length: PLAN_DAYS }, (_, idx) => {
      const source = byDay.get(idx + 1);
      return {
        day: idx + 1,
        meals: MEAL_SLOTS.map(({ slot, time }) => {
          const meal = source?.meals?.find((m) => m.slot === slot);
          const items = (meal?.items ?? [])
            .filter((i) => FOOD_BY_ID[i?.foodId])
            .map((i) => ({
              foodId: i.foodId,
              portions: Math.min(MAX_PORTION, Math.max(MIN_PORTION, Math.round(Number(i.portions || 1) * 2) / 2)),
            }));
          const merged: PlanItem[] = [];
          for (const item of items) {
            const existing = merged.find((m) => m.foodId === item.foodId);
            if (existing) existing.portions = Math.min(MAX_PORTION, existing.portions + item.portions);
            else merged.push(item);
          }
          return { slot, time: meal?.time && /^\d{2}:\d{2}$/.test(meal.time) ? meal.time : time, items: merged.slice(0, 6) };
        }),
      };
    }),
  };
}
