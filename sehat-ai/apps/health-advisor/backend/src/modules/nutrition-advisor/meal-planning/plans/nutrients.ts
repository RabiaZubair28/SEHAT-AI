import { FOOD_BY_ID } from '../../foods/food-library';
import { DayTotals, Nutrients, PlanDay, PlanItem } from '../../models/types';

const sumNutrients = (items: PlanItem[]): Nutrients => {
  const t: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, vitaminC: 0, sodium: 0 };
  for (const item of items) {
    const food = FOOD_BY_ID[item.foodId];
    if (!food) continue;
    for (const key of Object.keys(t) as (keyof Nutrients)[]) t[key] += food.nutrients[key] * item.portions;
  }
  return t;
};

const roundNutrients = (t: Nutrients): Nutrients => ({
  kcal: Math.round(t.kcal),
  protein: Math.round(t.protein),
  carbs: Math.round(t.carbs),
  fat: Math.round(t.fat),
  fiber: Math.round(t.fiber),
  iron: Number(t.iron.toFixed(1)),
  vitaminC: Math.round(t.vitaminC),
  sodium: Math.round(t.sodium),
});

export const dayTotals = (day: PlanDay): DayTotals => ({
  day: day.day,
  ...roundNutrients(sumNutrients(day.meals.flatMap((m) => m.items))),
});
