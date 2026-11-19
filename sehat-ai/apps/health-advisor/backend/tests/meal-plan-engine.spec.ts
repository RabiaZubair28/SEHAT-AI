import { FOOD_BY_ID } from '../src/modules/nutrition-advisor/foods/food-library';
import { exclusionReason, generateRuleBasedPlan, normalizePlan, validatePlan } from '../src/modules/nutrition-advisor/meal-planning/meal-planner';
import { AdvisorPreferences, DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';
import { baseContext } from './fixtures/clinical-context';
import { assess } from '../src/modules/nutrition-advisor/assessment/clinical-assessment';

describe('Nutrition Advisor meal planning', () => {
  it('generates a 7-day plan that respects allergies, diet and recorded diagnoses', () => {
    const prefs: AdvisorPreferences = { ...DEFAULT_PREFERENCES, allergies: ['egg', 'gluten'], dietType: 'vegetarian' };
    const a = assess(baseContext({ diagnoses: [{ label: 'Hypertension', source: 'OPD', recordedAt: null }] }), prefs);
    const rules = { prefs, restrictions: [...a.derivedRestrictions] };
    const plan = generateRuleBasedPlan(rules, a.targets!);
    expect(plan.days).toHaveLength(7);
    const foods = plan.days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => FOOD_BY_ID[i.foodId])));
    expect(foods.length).toBeGreaterThan(50);
    for (const f of foods) expect(exclusionReason(f, rules)).toBeNull();
    const { warnings } = validatePlan(plan, a.targets, rules);
    expect(warnings.filter((w) => w.code === 'restricted_food')).toHaveLength(0);
  });

  it('normalizes untrusted plans: unknown foods dropped, portions clamped', () => {
    const plan = normalizePlan({
      days: [{ day: 1, meals: [{ slot: 'lunch', time: 'noon', items: [{ foodId: 'pizza', portions: 2 }, { foodId: 'masoor_daal', portions: 9 }] }] }],
    });
    expect(plan.days).toHaveLength(7);
    const lunch = plan.days[0].meals.find((m) => m.slot === 'lunch')!;
    expect(lunch.items).toEqual([{ foodId: 'masoor_daal', portions: 4 }]);
    expect(lunch.time).toBe('13:00');
  });
});
