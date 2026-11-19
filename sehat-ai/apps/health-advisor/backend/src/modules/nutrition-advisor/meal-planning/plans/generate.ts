import { FOOD_BY_ID } from '../../foods/food-library';
import { MEAL_SLOTS, MealPlanContent, MealSlot, NutrientTargets, PLAN_DAYS, PlanItem } from '../../models/types';
import { FoodRules, exclusionReason, MIN_PORTION } from '../rules/food-rules';
import { enforceRules } from '../rules/substitutes';
import { dayTotals } from './nutrients';
import { TEMPLATES } from './templates';

const pickTemplate = (slot: MealSlot, day: number, rules: FoodRules, preferred: Set<string>): string[] => {
  const options = TEMPLATES[slot];
  const scored = options.map((tpl, i) => {
    const blocked = tpl.filter((id) => exclusionReason(FOOD_BY_ID[id], rules)).length;
    const liked = tpl.filter((id) => preferred.has(id)).length;
    return { tpl, i, score: blocked * 10 - liked * 3 };
  });
  // Rotate by day for variety, preferring templates with nothing to substitute.
  const rotated = [...scored.slice(day % options.length), ...scored.slice(0, day % options.length)];
  const best = Math.min(...rotated.map((s) => s.score));
  return rotated.find((s) => s.score === best)!.tpl;
};
/** Scale grain/main portions in 0.5 steps so each day lands near the energy target. */
export function fitToTargets(plan: MealPlanContent, targets: NutrientTargets): MealPlanContent {
  for (const day of plan.days) {
    const scalable = day.meals.flatMap((m) =>
      m.items.filter((i) => FOOD_BY_ID[i.foodId]?.scalable).map((item) => ({ item, slot: m.slot })),
    );
    for (let guard = 0; guard < 40; guard++) {
      const kcal = dayTotals(day).kcal;
      const gap = targets.kcal - kcal;
      if (Math.abs(gap) <= targets.kcal * 0.05) break;
      const grow = gap > 0;
      // Lunch and dinner absorb most adjustments; breakfast next.
      const order = [...scalable].sort((a, b) => {
        const rank = (s: MealSlot) => (s === 'lunch' || s === 'dinner' ? 0 : s === 'breakfast' ? 1 : 2);
        return rank(a.slot) - rank(b.slot) || (grow ? a.item.portions - b.item.portions : b.item.portions - a.item.portions);
      });
      const target = order.find(({ item }) => (grow ? item.portions < 3 : item.portions > MIN_PORTION));
      if (!target) break;
      const step = FOOD_BY_ID[target.item.foodId].nutrients.kcal * 0.5;
      if (!grow && Math.abs(gap) < step / 2) break;
      target.item.portions += grow ? 0.5 : -0.5;
    }
  }
  return plan;
}
export function generateRuleBasedPlan(rules: FoodRules, targets: NutrientTargets): MealPlanContent {
  const preferred = new Set(rules.prefs.preferredFoodIds);
  const days = Array.from({ length: PLAN_DAYS }, (_, d) => ({
    day: d + 1,
    meals: MEAL_SLOTS.map(({ slot, time }) => ({
      slot,
      time,
      items: enforceRules(
        pickTemplate(slot, d, rules, preferred).map((foodId) => ({ foodId, portions: 1 })),
        slot,
        rules,
      ),
    })),
  }));
  return fitToTargets({ days }, targets);
}
