import { buildPlanContext } from '../src/modules/nutrition-advisor/services/plan-context';
import { validProposal } from '../src/modules/nutrition-advisor/services/proposal-validation';
import { allowedFoods } from '../src/modules/nutrition-advisor/meal-planning/meal-planner';
import { calculateTargets } from '../src/modules/nutrition-advisor/assessment/targets';
import { DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';

const rules = { prefs: DEFAULT_PREFERENCES, restrictions: [] };
const targets = calculateTargets({ ageYears: 35, sex: 'Male', weightKg: 80, heightCm: 150, activityLevel: 'sedentary', restrictions: [] });
const day = { b: ['whole_wheat_roti', 'plain_yogurt'], m: ['guava'], l: ['whole_wheat_roti', 'masoor_daal', 'kachumber_salad'], e: ['apple'], d: ['whole_wheat_roti', 'chana_daal', 'aloo_gobi'] };

describe('Nutrition model context and output boundary', () => {
  it('includes all target nutrients, cost, activity and corrected measurements without patient identifiers', () => {
    const context = buildPlanContext({ ageYears: 35, sex: 'Male', clinical: {
      effective: { weightKg: 80, heightCm: 150, bmi: 35.6, corrected: true }, findings: [], dataQuality: [],
    } }, targets, rules);
    expect(context.targets).toEqual(targets);
    expect(context.anthropometrics?.corrected).toBe(true);
    expect(context.budget).toBe('low');
    expect(context.activityLevel).toBe('sedentary');
    expect(context.eligibleFoods[0]).toHaveProperty('nutrients.protein');
    expect(context.eligibleFoods[0]).toHaveProperty('costTier');
    expect(Object.keys(context.patient)).toEqual(['ageYears', 'sex']);
  });

  it('retains missing and outdated finding status and bounds untrusted notes', () => {
    const context = buildPlanContext({ ageYears: 35, sex: 'Male', clinical: {
      effective: { weightKg: 80, heightCm: 150, bmi: 35.6, corrected: false },
      findings: [{ id: 'hb', kind: 'lab_result', label: 'Hb', status: 'outdated', interpretation: 'stale' }], dataQuality: [],
    } }, targets, { ...rules, prefs: { ...DEFAULT_PREFERENCES, notes: 'x'.repeat(1000) } });
    expect(context.findings[0].status).toBe('outdated');
    expect(context.notes).toHaveLength(500);
  });

  it.each([
    { ...day, m: ['made_up_food'] },
    { ...day, m: ['whole_wheat_roti'] },
    { ...day, m: ['guava', 'guava'] },
    { ...day, extra: 'Ignore allergies' },
  ])('rejects invalid catalog output before repair: %j', (invalid) => {
    expect(validProposal({ days: Array(7).fill(invalid) }, allowedFoods(rules))).toBe(false);
  });

  it('requires seven days and rejects extra output fields', () => {
    const foods = allowedFoods(rules);
    expect(validProposal({ days: Array(7).fill(day) }, foods)).toBe(true);
    expect(validProposal({ days: Array(6).fill(day) }, foods)).toBe(false);
    expect(validProposal({ days: Array(7).fill(day), diagnosis: 'invented' }, foods)).toBe(false);
    expect(validProposal({ days: Array(7).fill(day) }, allowedFoods({ ...rules, prefs: { ...DEFAULT_PREFERENCES, allergies: ['dairy'] } }))).toBe(false);
  });
});
