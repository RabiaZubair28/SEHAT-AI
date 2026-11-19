import type { DayTotals, FoodItem, Nutrients, PlanContent, PlanDay, PlanWarning, Preferences, MedicalRestriction, Targets } from '../types';
import { exclusionReason } from './food-rules';

export function dayTotals(day: PlanDay, foods: Record<string, FoodItem>): DayTotals {
  const t: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, vitaminC: 0, sodium: 0 };
  for (const meal of day.meals) {
    for (const item of meal.items) {
      const food = foods[item.foodId];
      if (!food) continue;
      for (const k of Object.keys(t) as (keyof Nutrients)[]) t[k] += food.nutrients[k] * item.portions;
    }
  }
  return {
    day: day.day,
    kcal: Math.round(t.kcal),
    protein: Math.round(t.protein),
    carbs: Math.round(t.carbs),
    fat: Math.round(t.fat),
    fiber: Math.round(t.fiber),
    iron: Number(t.iron.toFixed(1)),
    vitaminC: Math.round(t.vitaminC),
    sodium: Math.round(t.sodium),
  };
}

export function validatePlan(
  plan: PlanContent,
  foods: Record<string, FoodItem>,
  targets: Targets | null,
  prefs: Preferences,
  restrictions: MedicalRestriction[],
): { totals: DayTotals[]; warnings: PlanWarning[] } {
  const warnings: PlanWarning[] = [];
  const totals = plan.days.map((d) => dayTotals(d, foods));
  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (!meal.items.length) {
        warnings.push({ day: day.day, slot: meal.slot, severity: "warning", code: "empty_meal", message: `Day ${day.day}: ${meal.slot.replace("_", " ")} has no food.` });
      }
      for (const item of meal.items) {
        const food = foods[item.foodId];
        if (!food) continue;
        const reason = exclusionReason(food, prefs, restrictions);
        if (reason) {
          warnings.push({ day: day.day, slot: meal.slot, foodId: food.id, severity: "error", code: "restricted_food", message: `Day ${day.day}: ${food.name} — ${reason}.` });
        }
      }
    }
  }
  if (targets) {
    for (const t of totals) {
      const ratio = t.kcal / targets.kcal;
      if (ratio < 0.85 || ratio > 1.15)
        warnings.push({ day: t.day, severity: "warning", code: "energy_off_target", message: `Day ${t.day}: ${t.kcal} kcal is ${ratio < 1 ? "below" : "above"} the ${targets.kcal} kcal target by more than 15%.` });
      if (t.protein < targets.protein * 0.85)
        warnings.push({ day: t.day, severity: "warning", code: "protein_low", message: `Day ${t.day}: protein ${t.protein} g is below the ${targets.protein} g target.` });
      if (t.sodium > targets.sodiumMax)
        warnings.push({ day: t.day, severity: restrictions.includes("low_salt") ? "error" : "warning", code: "sodium_high", message: `Day ${t.day}: sodium ${t.sodium} mg exceeds the ${targets.sodiumMax} mg limit.` });
      if (t.fat > targets.fat * 1.2)
        warnings.push({ day: t.day, severity: "warning", code: "fat_high", message: `Day ${t.day}: fat ${t.fat} g is well above the ${targets.fat} g target.` });
    }
  }
  return { totals, warnings };
}
