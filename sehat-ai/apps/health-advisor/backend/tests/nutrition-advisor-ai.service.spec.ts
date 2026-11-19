import { NutritionAdvisorAiService } from '../src/modules/nutrition-advisor/services/ai-plan.service';
import { FOOD_BY_ID } from '../src/modules/nutrition-advisor/foods/food-library';
import { exclusionReason, validatePlan } from '../src/modules/nutrition-advisor/meal-planning/meal-planner';
import { calculateTargets } from '../src/modules/nutrition-advisor/assessment/targets';
import { AdvisorPreferences, DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';

const targets = calculateTargets({ ageYears: 35, sex: 'Male', weightKg: 80, heightCm: 150, activityLevel: 'sedentary', restrictions: [] });
const day = { b: ['whole_wheat_roti', 'plain_yogurt'], m: ['guava'], l: ['whole_wheat_roti', 'masoor_daal', 'kachumber_salad'], e: ['apple'], d: ['whole_wheat_roti', 'chana_daal', 'aloo_gobi'] };

const mockModel = (content: unknown) => jest.spyOn(global, 'fetch').mockResolvedValue({
  ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(content) }] } }] }),
} as Response);

describe('Hosted AI nutrition plan harness', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => { process.env.GEMINI_API_KEY = 'test-only'; process.env.NUTRITION_ADVISOR_AI_ENABLED = 'true'; });
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    delete process.env.NUTRITION_ADVISOR_AI_ENABLED;
  });

  it('proposes a plan through the hosted API and validates allowed foods', async () => {
    const mock = mockModel({ days: Array.from({ length: 7 }, () => day) });
    const prefs: AdvisorPreferences = { ...DEFAULT_PREFERENCES, allergies: ['egg'] };
    const rules = { prefs, restrictions: [] };
    const result = await new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, rules);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent');
    expect(result.generatedBy).toMatch(/^ai:/);
    for (const meal of result.plan.days.flatMap((d) => d.meals)) {
      for (const item of meal.items) {
        expect(exclusionReason(FOOD_BY_ID[item.foodId], rules)).toBeNull();
        expect(FOOD_BY_ID[item.foodId].slots).toContain(meal.slot);
      }
    }
    expect(validatePlan(result.plan, targets, rules).warnings.filter((w) => w.severity === 'error')).toHaveLength(0);
  });

  it('rejects hallucinated food identifiers and uses deterministic fallback', async () => {
    mockModel({ days: Array.from({ length: 7 }, () => ({ ...day, m: ['nonexistent_food'] })) });
    const result = await new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, { prefs: DEFAULT_PREFERENCES, restrictions: [] });
    expect(result.generatedBy).toBe('rules');
  });

  it('falls back without making a network request if API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const mock = jest.spyOn(global, 'fetch');
    const result = await new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, { prefs: DEFAULT_PREFERENCES, restrictions: [] });
    expect(result.generatedBy).toBe('rules');
    expect(mock).not.toHaveBeenCalled();
  });

  it('falls back when provider is unreachable', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, { prefs: DEFAULT_PREFERENCES, restrictions: [] });
    expect(result.generatedBy).toBe('rules');
    expect(result.note).toMatch(/unavailable/);
  });

  it.each(['SAFETY', 'MAX_TOKENS'])('rejects blocked or truncated responses (%s)', async (finishReason) => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({
      candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify({ days: Array(7).fill(day) }) }] } }],
    }) } as Response);
    const result = await new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, { prefs: DEFAULT_PREFERENCES, restrictions: [] });
    expect(result.generatedBy).toBe('rules');
  });

  it('does not return an empty fallback when no catalog foods are permitted', async () => {
    delete process.env.GEMINI_API_KEY;
    const prefs = { ...DEFAULT_PREFERENCES, excludedFoodIds: Object.keys(FOOD_BY_ID) };
    await expect(new NutritionAdvisorAiService().proposePlan({ ageYears: 35, sex: 'Male' }, targets, { prefs, restrictions: [] }))
      .rejects.toThrow(/clinician assessment/);
  });
});
