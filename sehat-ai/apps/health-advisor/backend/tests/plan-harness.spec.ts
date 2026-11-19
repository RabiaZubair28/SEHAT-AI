import { runPlanHarness, harnessNote } from '../src/modules/nutrition-advisor/llm/harness';
import { calculateTargets } from '../src/modules/nutrition-advisor/assessment/targets';
import { dayTotals, validatePlan } from '../src/modules/nutrition-advisor/meal-planning/meal-planner';
import { DEFAULT_PREFERENCES, MEAL_SLOTS, MealPlanContent } from '../src/modules/nutrition-advisor/models/types';

const targets = calculateTargets({ ageYears: 35, sex: 'Male', weightKg: 84, heightCm: 165, activityLevel: 'light', restrictions: ['low_salt'] });
const prefs = { ...DEFAULT_PREFERENCES, allergies: ['peanut' as const], excludedFoodIds: ['paratha'] };
const rules = { prefs, restrictions: ['low_salt' as const] };

// A sensible day the harness should leave alone, plus one that breaks limits.
const goodMeals = {
  breakfast: [{ foodId: 'whole_wheat_roti', portions: 2 }, { foodId: 'boiled_egg', portions: 1 }, { foodId: 'guava', portions: 1 }],
  mid_morning: [{ foodId: 'apple', portions: 1 }],
  lunch: [{ foodId: 'brown_rice', portions: 1.5 }, { foodId: 'masoor_daal', portions: 1 }, { foodId: 'kachumber_salad', portions: 1 }],
  evening_snack: [{ foodId: 'plain_yogurt', portions: 1 }, { foodId: 'banana', portions: 1 }],
  dinner: [{ foodId: 'whole_wheat_roti', portions: 2 }, { foodId: 'grilled_chicken', portions: 1 }, { foodId: 'lauki', portions: 1 }],
} as const;
const badMeals = {
  ...goodMeals,
  breakfast: [{ foodId: 'paratha', portions: 1 }, { foodId: 'omelette', portions: 1 }],
  mid_morning: [{ foodId: 'peanuts', portions: 1 }],
  lunch: [{ foodId: 'chicken_pulao', portions: 2 }, { foodId: 'chicken_curry', portions: 1.5 }],
  dinner: [{ foodId: 'beef_curry_lean', portions: 1.5 }, { foodId: 'lentil_soup', portions: 1 }],
} as const;
const build = (badDays: number[]): MealPlanContent => ({
  days: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, meals: MEAL_SLOTS.map(({ slot, time }) => ({
    slot, time, items: (badDays.includes(i + 1) ? badMeals : goodMeals)[slot].map((x) => ({ ...x })) })) })),
});

describe('LLM plan safety harness', () => {
  it('leaves a plan alone when every day passes', () => {
    const plan = build([]);
    expect(validatePlan(plan, targets, rules).warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
    const { plan: out, report } = runPlanHarness(plan, targets, rules);
    expect(out).toEqual(plan);
    expect(report.fixes).toHaveLength(0);
    expect(harnessNote(report)).toBeNull();
  });

  it('removes allergens and avoided foods, and brings sodium under the low-salt limit', () => {
    const plan = build([3, 5]);
    const before = validatePlan(plan, targets, rules).warnings;
    expect(before.some((w) => w.code === 'restricted_food')).toBe(true);
    expect(before.some((w) => w.code === 'sodium_high')).toBe(true);

    const { plan: out, report } = runPlanHarness(plan, targets, rules);
    const ids = out.days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)));
    expect(ids).not.toContain('peanuts');
    expect(ids).not.toContain('paratha');
    for (const day of out.days) expect(dayTotals(day).sodium).toBeLessThanOrEqual(targets.sodiumMax);
    expect(report.after.errors).toBe(0);
    expect(report.before.errors).toBeGreaterThan(0);
    // Only the failing days are touched; every meal still has food.
    expect(new Set(report.fixes.map((f) => f.day))).toEqual(new Set([3, 5]));
    expect(out.days[0]).toEqual(plan.days[0]);
    expect(out.days.every((d) => d.meals.every((m) => m.items.length > 0))).toBe(true);
    expect(harnessNote(report)).toMatch(/day 3, day 5/);
  });

  it('keeps energy within 15% of target after sodium fixes', () => {
    const { plan: out } = runPlanHarness(build([1, 2, 3, 4, 5, 6, 7]), targets, rules);
    for (const day of out.days) {
      const kcal = dayTotals(day).kcal;
      expect(kcal).toBeGreaterThanOrEqual(targets.kcal * 0.85);
      expect(kcal).toBeLessThanOrEqual(targets.kcal * 1.15);
    }
  });

  it('does not mutate the model plan it was given', () => {
    const plan = build([2]);
    const copy = JSON.parse(JSON.stringify(plan));
    runPlanHarness(plan, targets, rules);
    expect(plan).toEqual(copy);
  });
  it('balances days far below the energy and protein targets so no issues reach staff', () => {
    // Like the live report: several days ~1,500 kcal against a 1,950 kcal target.
    const light: MealPlanContent = {
      days: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, meals: MEAL_SLOTS.map(({ slot, time }) => ({ slot, time,
        items: (slot === 'lunch' || slot === 'dinner') ? [{ foodId: 'brown_rice', portions: 1 }, { foodId: 'lauki', portions: 1 }]
          : slot === 'breakfast' ? [{ foodId: 'oats_porridge', portions: 1 }] : [{ foodId: 'apple', portions: 1 }] })) })),
    };
    expect(validatePlan(light, targets, rules).warnings.some((w) => w.code === 'energy_off_target')).toBe(true);
    const { plan: out, report } = runPlanHarness(light, targets, rules);
    expect(report.after).toEqual({ errors: 0, warnings: 0 });
    for (const day of out.days) {
      const t = dayTotals(day);
      expect(t.kcal).toBeGreaterThanOrEqual(targets.kcal * 0.85);
      expect(t.protein).toBeGreaterThanOrEqual(targets.protein * 0.85);
      expect(t.sodium).toBeLessThanOrEqual(targets.sodiumMax);
    }
    const ids = out.days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)));
    expect(ids).not.toContain('peanuts');
    expect(ids).not.toContain('paratha');
  });
});
