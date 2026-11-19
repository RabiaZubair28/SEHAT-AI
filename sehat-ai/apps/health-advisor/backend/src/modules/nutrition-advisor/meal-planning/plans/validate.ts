import { FOOD_BY_ID } from '../../foods/food-library';
import { FoodRules, exclusionReason } from '../rules/food-rules';
import { dayTotals } from './nutrients';
import { MealPlanContent, NutrientTargets, PlanWarning } from '../../models/types';

/** Totals and target/restriction warnings for every day (NA-16, NA-17). */
export function validatePlan(plan: MealPlanContent, targets: NutrientTargets | null, rules: FoodRules) {
  const warnings: PlanWarning[] = [];
  const totals = plan.days.map(dayTotals);

  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (!meal.items.length) {
        warnings.push({ day: day.day, slot: meal.slot, severity: 'warning', code: 'empty_meal', message: `Day ${day.day}: ${meal.slot.replace('_', ' ')} has no food.` });
      }
      for (const item of meal.items) {
        const food = FOOD_BY_ID[item.foodId];
        const reason = exclusionReason(food, rules);
        if (reason) {
          warnings.push({ day: day.day, slot: meal.slot, foodId: food.id, severity: 'error', code: 'restricted_food', message: `Day ${day.day}: ${food.name} — ${reason}.` });
        }
        if (food.tags.includes('tea') && meal.items.some((i) => FOOD_BY_ID[i.foodId]?.tags.includes('iron_rich'))) {
          warnings.push({ day: day.day, slot: meal.slot, foodId: food.id, severity: 'info', code: 'tea_with_iron', message: `Day ${day.day}: tea with an iron-rich meal reduces iron absorption.` });
        }
      }
    }
  }

  if (targets) {
    for (const t of totals) {
      const ratio = t.kcal / targets.kcal;
      if (ratio < 0.85 || ratio > 1.15) {
        warnings.push({ day: t.day, severity: 'warning', code: 'energy_off_target', message: `Day ${t.day}: ${t.kcal} kcal is ${ratio < 1 ? 'below' : 'above'} the ${targets.kcal} kcal target by more than 15%.` });
      }
      if (t.protein < targets.protein * 0.85) {
        warnings.push({ day: t.day, severity: 'warning', code: 'protein_low', message: `Day ${t.day}: protein ${t.protein} g is below the ${targets.protein} g target.` });
      }
      if (t.sodium > targets.sodiumMax) {
        warnings.push({ day: t.day, severity: rules.restrictions.includes('low_salt') ? 'error' : 'warning', code: 'sodium_high', message: `Day ${t.day}: sodium ${t.sodium} mg exceeds the ${targets.sodiumMax} mg limit.` });
      }
      if (t.fat > targets.fat * 1.2) {
        warnings.push({ day: t.day, severity: 'warning', code: 'fat_high', message: `Day ${t.day}: fat ${t.fat} g is well above the ${targets.fat} g target.` });
      }
    }
  }

  return { totals, warnings };
}
