import * as config from '../src/modules/nutrition-advisor/llm/config';
import { generateAdvisorDraft } from '../src/modules/nutrition-advisor/llm/service';
import { advisorRequest } from '../src/modules/nutrition-advisor/llm/request';
import { assess } from '../src/modules/nutrition-advisor/assessment/clinical-assessment';
import { DEFAULT_PREFERENCES, MEAL_SLOTS } from '../src/modules/nutrition-advisor/models/types';
import { baseContext, sv } from './fixtures/clinical-context';
import { FOOD_LIBRARY } from '../src/modules/nutrition-advisor/foods/food-library';

const context = baseContext();
const prefs = { ...DEFAULT_PREFERENCES, budget: 'medium' as const, notes: 'My entered preferences' };
const assessment = assess(context, prefs);
const draft = () => ({
  findings: [{ id: 'model-finding', kind: 'lab_result', label: 'Model finding', value: '9.5', status: 'low', interpretation: 'Model interpretation', source: 'Provided Hb result' }],
  recommendations: [{ id: 'model-advice', priority: 1, title: 'Model suggestion', titleUr: 'ہدایت', detail: 'Model detail', detailUr: 'تفصیل', icon: '', tone: 'blue', evidence: ['model-finding'], basis: 'Provided Hb' }],
  plan: { days: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, meals: MEAL_SLOTS.map(({ slot, time }) => ({ slot, time,
    items: [{ foodId: FOOD_LIBRARY.find((f) => f.slots.includes(slot))!.id, portions: 1 }] })) })) },
  handout: { activityGuidance: 'Model activity', activityGuidanceUr: 'سرگرمی', counselingNotes: 'Model counseling', patientNotes: 'Model notes', patientNotesUr: 'ہدایات' },
});
const provider = (value: unknown, backend = 'gemini') => ({ ok: true, status: 200, json: async () => backend === 'groq' ? { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }], usage: { totalTokenCount: 99 } } : ({ candidates: [{ finishReason: 'STOP',
  content: { parts: [{ text: JSON.stringify(value) }] } }], usageMetadata: { totalTokenCount: 99 } }) }) as Response;

describe.each(['gemini', 'groq'])('Entered patient values to %s advisor content', (backend) => {
  beforeEach(() => { jest.spyOn(config, 'advisorLlmConfig').mockReturnValue({ provider: backend, apiKey: 'test-key', model: backend === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-3.8-flash', timeoutMs: 1000, maxOutputTokens: 6000 }); });
  afterEach(() => jest.restoreAllMocks());
  it('sends current values, corrected measurements and the full catalog, not rule-generated advice', () => {
    const body = advisorRequest(context, assessment, prefs, 'gemini-3.8-flash');
    const sent = JSON.parse(body.contents[0].parts[0].text);
    expect(sent.foodPreferences.notes).toBe(prefs.notes);
    expect(sent.foodPreferences.budget).toBe('medium');
    expect(sent.healthConditions.haemoglobin.value).toBe(9.5);
    expect(sent.planning.calculatedTargets).toEqual(assessment.targets);
    expect(sent.catalog.foods).toHaveLength(FOOD_LIBRARY.length);
    expect(sent).not.toHaveProperty('findings');
    expect(sent).not.toHaveProperty('recommendations');
    expect(sent).not.toHaveProperty('patient.name');
  });
  it('sends every diet-plan parameter entered for the patient, including medications', () => {
    const ctx = baseContext({
      measurements: { ...context.measurements, systolicBp: sv(150, 'mmHg'), diastolicBp: sv(95, 'mmHg'), spo2: sv(93, '%'), edema: sv<string>('Mild') },
      screening: { ...context.screening, complications: sv<string[]>(['Fever']) },
      diagnoses: [{ label: 'Hypertension', source: 'OPD', recordedAt: null }],
      medications: { given: true, items: [{ name: 'Amlodipine 5mg', dosage: '1-0-0', instruction: 'Morning', source: 'Nutrition › Supplements' }] },
    });
    const entered = { ...DEFAULT_PREFERENCES, budget: 'low' as const, allergies: ['peanut' as const], healthConditions: ['diabetes' as const],
      preferredFoodIds: ['masoor_daal'], excludedFoodIds: ['paratha'], activityLevel: 'light' as const, dietType: 'vegetarian_with_egg' as const };
    const sent = JSON.parse(advisorRequest(ctx, assess(ctx, entered), entered, 'openai/gpt-oss-120b').contents[0].parts[0].text);
    expect(sent.patient.heightCm).toBe(ctx.measurements.heightCm.value);
    expect(sent.vitals).toMatchObject({ systolicBp: { value: 150 }, diastolicBp: { value: 95 }, oxygenSaturation: { value: 93, unit: '%' },
      edema: 'Mild', complicated: true, complications: ['Fever'] });
    expect(sent.medications).toEqual({ given: true, items: [{ name: 'Amlodipine 5mg', dosage: '1-0-0', instruction: 'Morning' }] });
    expect(sent.healthConditions).toMatchObject({ recordedDiagnoses: ['Hypertension'], patientReported: ['diabetes'] });
    expect(sent.foodPreferences).toMatchObject({ budget: 'low', allergies: ['peanut'], activityLevel: 'light', diet: 'vegetarian_with_egg',
      preferredFoods: [{ id: 'masoor_daal', name: 'Masoor Daal' }], foodsToAvoid: [{ id: 'paratha', name: 'Paratha' }] });
  });
  it('marks medication use as unknown when the encounter has no record', () => {
    const sent = JSON.parse(advisorRequest(context, assessment, prefs, 'gemini-3.8-flash').contents[0].parts[0].text);
    expect(sent.medications).toEqual({ given: null, items: [] });
  });
  it('returns model findings, recommendations and handout verbatim, with the plan passed through the safety harness', async () => {
    const expected = draft();
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(provider(expected, backend));
    const result = await generateAdvisorDraft(context, assessment, prefs);
    expect(result.findings).toEqual(expected.findings);
    expect(result.recommendations).toEqual(expected.recommendations);
    expect(result.handout).toEqual(expected.handout);
    expect(result.plan.days).toHaveLength(7);
    expect(result.generation.harness.after.errors).toBe(0);
    // The draft's one-item meals are far below the energy target, so the harness rescales them.
    expect(result.generation.harness.fixes.some((f: any) => f.action === 'rescaled' || f.action === 'increased')).toBe(true);
    expect(result.note).toMatch(/Safety check adjusted/);
    expect(result.generation.rawText).toBe(JSON.stringify(expected));
    expect(result.generation.usage.totalTokenCount).toBe(99);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([403, 429, 500])('shows provider failure %s rather than generating a rule plan', async (status) => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status } as Response);
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(`HTTP ${status}`);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('removes an unknown food, refills the meal and reports the repair', async () => {
    const invalid = draft(); invalid.plan.days[0].meals[0].items[0].foodId = 'invented-food';
    jest.spyOn(global, 'fetch').mockResolvedValue(provider(invalid, backend));
    const result = await generateAdvisorDraft(context, assessment, prefs);
    const ids = result.plan.days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)));
    expect(ids).not.toContain('invented-food');
    expect(result.plan.days[0].meals[0].items.length).toBeGreaterThan(0);
    expect(result.generation.harness.formatRepairs).toContain('1 unknown food(s) removed');
    expect(result.note).toMatch(/Model answer repaired/);
  });
  it('rejects a plan where most meals have no valid food', async () => {
    const invalid = draft();
    invalid.plan.days.forEach((d) => d.meals.forEach((m) => { m.items[0].foodId = 'invented-food'; }));
    jest.spyOn(global, 'fetch').mockResolvedValue(provider(invalid, backend));
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(/plan failed validation/);
  });
  it('distinguishes network failures without exposing the underlying error', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('secret-provider-details'));
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(/provider could not be reached/);
  });
  it('distinguishes incomplete provider output from invalid JSON', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => backend === 'groq'
      ? { choices: [{ finish_reason: 'length', message: { content: '{}' } }] }
      : { candidates: [{ finishReason: 'MAX_TOKENS' }] } } as Response);
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(/blocked, empty or incomplete/);
  });
  it('reports malformed model JSON separately', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => backend === 'groq'
      ? { choices: [{ finish_reason: 'stop', message: { content: '{' } }] }
      : { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{' }] } }] } } as Response);
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(/invalid JSON/);
  });
  it('reports the configuration location without making a call when key is missing', async () => {
    jest.spyOn(config, 'advisorLlmConfig').mockReturnValue({ provider: 'gemini', apiKey: '', model: 'gemini-3.8-flash', timeoutMs: 1000, maxOutputTokens: 6000 });
    const fetch = jest.spyOn(global, 'fetch');
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow(/sehat-ai\/apps\/health-advisor\/backend\/\.env/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('repairs a complete answer that Groq rejected for a small format fault', async () => {
    jest.spyOn(config, 'advisorLlmConfig').mockReturnValue({ provider: 'groq', apiKey: 'test-key', model: 'openai/gpt-oss-120b', timeoutMs: 1000, maxOutputTokens: 6000 });
    const answer: any = draft(); answer.recommendations[0].priority = '1';
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 400,
      json: async () => ({ error: { code: 'json_validate_failed', failed_generation: JSON.stringify(answer) } }),
    } as Response);
    const result = await generateAdvisorDraft(context, assessment, prefs);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.recommendations[0].priority).toBe(1);
    expect(result.generation.harness.formatRepairs[0]).toMatch(/repaired locally/);
  });
  it('reassembles an answer the model split into a list of pieces', async () => {
    jest.spyOn(config, 'advisorLlmConfig').mockReturnValue({ provider: 'groq', apiKey: 'test-key', model: 'openai/gpt-oss-120b', timeoutMs: 1000, maxOutputTokens: 6000 });
    const { handout, ...rest } = draft();
    // Shape seen live: [ {findings, recommendations, plan}, "text", "text", {handout fields} ]
    const split = [rest, 'stray text', 'stray text', handout];
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 400,
      json: async () => ({ error: { code: 'json_validate_failed', failed_generation: JSON.stringify(split) } }),
    } as Response);
    const result = await generateAdvisorDraft(context, assessment, prefs);
    expect(result.plan.days).toHaveLength(7);
    expect(result.handout).toEqual(handout);
    expect(result.recommendations).toEqual(rest.recommendations);
    expect(result.generation.harness.formatRepairs).toContain('answer was split into pieces; reassembled');
  });
  it('keeps advice that is missing secondary fields, filling safe defaults', async () => {
    const answer: any = draft();
    delete answer.recommendations[0].titleUr; delete answer.recommendations[0].tone; delete answer.recommendations[0].id;
    delete answer.findings[0].kind;
    jest.spyOn(global, 'fetch').mockResolvedValue(provider(answer, backend));
    const result = await generateAdvisorDraft(context, assessment, prefs);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toMatchObject({ title: 'Model suggestion', titleUr: '', tone: 'blue', id: 'advice-1' });
    expect(result.findings[0].kind).toBe('observation');
    expect(result.generation.harness.formatRepairs.join(' ')).toMatch(/filled with defaults/);
  });
  it('explains provider-side model format errors without exposing generated content', async () => {
    jest.spyOn(config, 'advisorLlmConfig').mockReturnValue({ provider: 'groq', apiKey: 'test-key', model: 'openai/gpt-oss-120b', timeoutMs: 1000, maxOutputTokens: 6000 });
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 400,
      json: async () => ({ error: { code: 'json_validate_failed', failed_generation: 'private generated content' } }),
    } as Response);
    await expect(generateAdvisorDraft(context, assessment, prefs)).rejects.toThrow('did not match the required plan format');
  });
});
