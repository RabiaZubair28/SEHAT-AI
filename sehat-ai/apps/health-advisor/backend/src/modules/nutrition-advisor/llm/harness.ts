import { FOOD_BY_ID } from '../foods/food-library';
import { allowedFoods, dayTotals, exclusionReason, FoodRules, fitToTargets, generateRuleBasedPlan, suggestSubstitutes, validatePlan } from '../meal-planning/meal-planner';
import { MIN_PORTION, MAX_PORTION } from '../meal-planning/rules/food-rules';
import { FoodItem, MealPlanContent, MealSlot, NutrientTargets, PlanDay, PlanWarning } from '../models/types';

export interface HarnessFix {
  day: number;
  slot?: MealSlot;
  action: 'replaced' | 'removed' | 'reduced' | 'increased' | 'rescaled' | 'filled';
  detail: string;
}

export interface HarnessReport {
  /** Faults in the model's answer repaired before the plan checks (unknown foods, bad portions…). */
  formatRepairs: string[];
  before: { errors: number; warnings: number };
  after: { errors: number; warnings: number };
  fixes: HarnessFix[];
  remaining: PlanWarning[];
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const name = (id: string) => FOOD_BY_ID[id]?.name ?? id;
const count = (warnings: PlanWarning[]) => ({
  errors: warnings.filter((w) => w.severity === 'error').length,
  warnings: warnings.filter((w) => w.severity === 'warning').length,
});
const ENERGY_TOLERANCE = 0.15;
const MAX_STEPS = 40;

/** Give an empty meal the safe, approved pattern meal for that day and slot. */
function fillEmptyMeals(day: PlanDay, pattern: PlanDay | undefined, rules: FoodRules, fixes: HarnessFix[]) {
  for (const meal of day.meals) {
    if (meal.items.length) continue;
    const fallback = pattern?.meals.find((m) => m.slot === meal.slot)?.items
      ?? allowedFoods(rules).filter((f) => f.slots.includes(meal.slot)).slice(0, 1).map((f) => ({ foodId: f.id, portions: 1 }));
    if (!fallback?.length) continue;
    meal.items = fallback.map((i) => ({ ...i }));
    fixes.push({ day: day.day, slot: meal.slot, action: 'filled', detail: `empty meal filled with ${meal.items.map((i) => name(i.foodId)).join(', ')}` });
  }
}

/** Swap foods the patient must not have; remove only when no safe swap exists. */
function fixRestrictedFoods(day: PlanDay, rules: FoodRules, fixes: HarnessFix[]) {
  for (const meal of day.meals) {
    const kept: typeof meal.items = [];
    for (const item of meal.items) {
      const reason = exclusionReason(FOOD_BY_ID[item.foodId], rules);
      if (!reason) { kept.push(item); continue; }
      const swap = suggestSubstitutes(item.foodId, meal.slot, rules)
        .find((f) => !kept.some((k) => k.foodId === f.id) && !meal.items.some((i) => i.foodId === f.id));
      if (swap) {
        kept.push({ foodId: swap.id, portions: item.portions });
        fixes.push({ day: day.day, slot: meal.slot, action: 'replaced', detail: `${name(item.foodId)} → ${swap.name} (${reason.toLowerCase()})` });
      } else {
        fixes.push({ day: day.day, slot: meal.slot, action: 'removed', detail: `${name(item.foodId)} (${reason.toLowerCase()}; no safe substitute)` });
      }
    }
    meal.items = kept;
  }
}

/** Bring a day back within ±15% of the energy target by scaling staple portions. */
function fixEnergy(day: PlanDay, targets: NutrientTargets, fixes: HarnessFix[]) {
  const before = dayTotals(day).kcal;
  if (Math.abs(before / targets.kcal - 1) <= ENERGY_TOLERANCE) return;
  fitToTargets({ days: [day] }, targets);
  const after = dayTotals(day).kcal;
  if (after !== before) fixes.push({ day: day.day, action: 'rescaled', detail: `portions adjusted, ${before} → ${after} kcal (target ${targets.kcal})` });
}

/** Lower sodium: swap the saltiest item for a lower-salt alternative, else trim its portion. */
function fixSodium(day: PlanDay, targets: NutrientTargets, rules: FoodRules, fixes: HarnessFix[]) {
  for (let step = 0; step < MAX_STEPS && dayTotals(day).sodium > targets.sodiumMax; step++) {
    const contributors = day.meals
      .flatMap((meal) => meal.items.map((item) => ({ meal, item, sodium: FOOD_BY_ID[item.foodId].nutrients.sodium * item.portions })))
      .sort((a, b) => b.sodium - a.sodium);
    let changed = false;
    for (const { meal, item } of contributors) {
      const food = FOOD_BY_ID[item.foodId];
      const swap = suggestSubstitutes(item.foodId, meal.slot, rules, 12)
        .filter((f) => f.group === food.group && f.nutrients.sodium < food.nutrients.sodium * 0.7 && !meal.items.some((i) => i.foodId === f.id))
        .sort((a, b) => a.nutrients.sodium - b.nutrients.sodium)[0];
      if (swap) {
        fixes.push({ day: day.day, slot: meal.slot, action: 'replaced', detail: `${food.name} → ${swap.name} (lower sodium)` });
        item.foodId = swap.id;
        changed = true;
        break;
      }
      if (item.portions > MIN_PORTION) {
        item.portions -= 0.5;
        fixes.push({ day: day.day, slot: meal.slot, action: 'reduced', detail: `${food.name} to ${item.portions} serving (sodium)` });
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
}

// Aim for the middle of the validator's ranges (±15% energy, protein ≥85%,
// fat ≤120%) so the doctor's small edits do not immediately trip a warning.
const ENERGY_LOW = 0.9;
const ENERGY_HIGH = 1.1;
const SNACKS_FIRST: MealSlot[] = ['evening_snack', 'mid_morning', 'breakfast', 'lunch', 'dinner'];

/**
 * Bring a day within its energy, protein and fat targets without breaking the
 * sodium limit or any food rule: trim rich items when over, otherwise add half
 * servings to existing foods, then add a suitable food (snacks first).
 */
function balanceDay(day: PlanDay, targets: NutrientTargets, rules: FoodRules, fixes: HarnessFix[]) {
  const allowed = allowedFoods(rules);
  for (let step = 0; step < 200; step++) {
    const t = dayTotals(day);
    const items = day.meals.flatMap((meal) => meal.items.map((item) => ({ meal, item, food: FOOD_BY_ID[item.foodId] })));
    const fits = (n: { kcal: number; sodium: number; fat: number }, share: number) =>
      t.sodium + n.sodium * share <= targets.sodiumMax &&
      t.fat + n.fat * share <= targets.fat * 1.2 &&
      t.kcal + n.kcal * share <= targets.kcal * ENERGY_HIGH;

    const fatHigh = t.fat > targets.fat * 1.2;
    if (t.kcal > targets.kcal * ENERGY_HIGH || fatHigh) {
      const key = fatHigh ? 'fat' : 'kcal';
      const richest = items
        .filter(({ item }) => item.portions > MIN_PORTION)
        .sort((a, b) => b.food.nutrients[key] * b.item.portions - a.food.nutrients[key] * a.item.portions)[0];
      if (!richest) break;
      richest.item.portions -= 0.5;
      fixes.push({ day: day.day, slot: richest.meal.slot, action: 'reduced', detail: `${richest.food.name} to ${richest.item.portions} serving (${fatHigh ? 'fat' : 'energy'})` });
      continue;
    }

    const proteinLow = t.protein < targets.protein * 0.9;
    const energyLow = t.kcal < targets.kcal * ENERGY_LOW;
    if (!proteinLow && !energyLow) break;
    // Protein: most protein per kcal. Energy: most kcal per unit of sodium.
    const score = (n: FoodItem['nutrients']) => (proteinLow ? n.protein / Math.max(n.kcal, 1) : n.kcal / (n.sodium + 20));
    // For protein, only protein-dense foods help (≥5 g per 100 kcal: daal, chana,
    // yogurt, egg, chicken, fish); rice or oats would just refill the energy room.
    const useful = (f: FoodItem) => !proteinLow || (f.nutrients.protein >= 5 && f.nutrients.protein / Math.max(f.nutrients.kcal, 1) >= 0.05);

    const grow = items
      .filter(({ item, food }) => item.portions < (food.scalable ? 3 : 2) && useful(food) && fits(food.nutrients, 0.5))
      .sort((a, b) => score(b.food.nutrients) - score(a.food.nutrients))[0];
    if (grow) {
      grow.item.portions += 0.5;
      fixes.push({ day: day.day, slot: grow.meal.slot, action: 'increased', detail: `${grow.food.name} to ${grow.item.portions} servings (${proteinLow ? 'protein' : 'energy'})` });
      continue;
    }

    let added = false;
    for (const slot of SNACKS_FIRST) {
      const meal = day.meals.find((m) => m.slot === slot);
      if (!meal || meal.items.length >= 4) continue;
      const food = allowed
        .filter((f) => f.slots.includes(slot) && !meal.items.some((i) => i.foodId === f.id) && useful(f) && fits(f.nutrients, 1))
        .sort((a, b) => score(b.nutrients) - score(a.nutrients))[0];
      if (!food) continue;
      meal.items.push({ foodId: food.id, portions: 1 });
      fixes.push({ day: day.day, slot, action: 'filled', detail: `${food.name} added (${proteinLow ? 'protein' : 'energy'})` });
      added = true;
      break;
    }
    if (added) continue;
    // Stuck: a limit (sodium, fat or energy) leaves no room for what is still
    // missing. Trim the item that spends most of that limit per unit of the
    // missing nutrient, then try again.
    const need = (f: FoodItem) => Math.max(proteinLow ? f.nutrients.protein : f.nutrients.kcal, 0.1);
    const blockers: { limit: 'sodium' | 'fat' | 'kcal'; tight: boolean }[] = [
      { limit: 'sodium', tight: t.sodium > targets.sodiumMax * 0.85 },
      { limit: 'fat', tight: t.fat > targets.fat * 1.2 * 0.85 },
      { limit: 'kcal', tight: proteinLow && t.kcal > targets.kcal * ENERGY_LOW },
    ];
    let trimmed = false;
    for (const { limit } of blockers.filter((b) => b.tight)) {
      const worst = items
        // Never trim the foods supplying missing protein (trimming them makes the
        // balancer undo its own additions; measured worse on synthetic plans).
        .filter(({ item, food }) => item.portions > MIN_PORTION && food.nutrients[limit] > 0 &&
          !(proteinLow && food.nutrients.protein >= 5 && limit !== 'kcal'))
        .sort((a, b) => b.food.nutrients[limit] / need(b.food) - a.food.nutrients[limit] / need(a.food))[0];
      if (!worst) continue;
      worst.item.portions -= 0.5;
      fixes.push({ day: day.day, slot: worst.meal.slot, action: 'reduced', detail: `${worst.food.name} to ${worst.item.portions} serving (room under the ${limit === 'kcal' ? 'energy' : limit} limit)` });
      trimmed = true;
      break;
    }
    if (trimmed) continue;
    break;
  }
}

/**
 * Deterministic safety harness for an LLM diet plan. Each day is checked with
 * the same validator the Advisor screen uses. Failing days are repaired, then
 * every day is balanced to its targets. Anything it cannot fix stays in `remaining`.
 */
export function runPlanHarness(plan: MealPlanContent, targets: NutrientTargets | null, rules: FoodRules, formatRepairs: string[] = []) {
  const repaired = clone(plan);
  const fixes: HarnessFix[] = [];
  const initial = validatePlan(repaired, targets, rules).warnings;
  const failingDays = new Set(initial.filter((w) => w.severity !== 'info' && w.day).map((w) => w.day!));

  if (allowedFoods(rules).length) {
    const patterns = targets ? generateRuleBasedPlan(rules, targets) : null;
    for (const day of repaired.days) {
      if (failingDays.has(day.day)) {
        fillEmptyMeals(day, patterns?.days[day.day - 1], rules, fixes);
        fixRestrictedFoods(day, rules, fixes);
        if (targets) {
          fixEnergy(day, targets, fixes);
          fixSodium(day, targets, rules, fixes);
        }
      }
      // Final pass on every day, so no plan reaches staff with target warnings.
      if (targets) balanceDay(day, targets, rules, fixes);
    }
  }

  const remaining = validatePlan(repaired, targets, rules).warnings.filter((w) => w.severity !== 'info');
  const report: HarnessReport = { formatRepairs, before: count(initial), after: count(remaining), fixes, remaining };
  return { plan: repaired, report };
}

/** One-line summary for the worker, shown with the generated draft. */
export function harnessNote(report: HarnessReport): string | null {
  const parts: string[] = [];
  if (report.formatRepairs.length) parts.push(`Model answer repaired: ${report.formatRepairs.join('; ')}.`);
  if (report.fixes.length) {
    const days = [...new Set(report.fixes.map((f) => f.day))].sort((a, b) => a - b);
    parts.push(`Safety check adjusted ${days.length} day(s) (${days.map((d) => `day ${d}`).join(', ')}): ${report.fixes.length} change(s) to meet allergy, restriction, calorie and sodium limits.`);
  }
  if (report.after.errors) parts.push(`${report.after.errors} issue(s) still need manual correction before review.`);
  return parts.length ? parts.join(' ') : null;
}
