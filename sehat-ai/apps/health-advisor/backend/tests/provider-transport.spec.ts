import { advisorRequest } from '../src/modules/nutrition-advisor/llm/request';
import { answerBudget, providerRequest, providerAnswer } from '../src/modules/nutrition-advisor/llm/transport';
import { assess } from '../src/modules/nutrition-advisor/assessment/clinical-assessment';
import { DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';
import { baseContext } from './fixtures/clinical-context';

const ctx = baseContext();
const request = () => advisorRequest(ctx, assess(ctx, DEFAULT_PREFERENCES), DEFAULT_PREFERENCES, 'openai/gpt-oss-120b');
describe('Provider translation', () => {
  it('uses Groq authentication and closed JSON Schema without Gemini parameters', () => {
    const result = providerRequest('groq', 'openai/gpt-oss-120b', 'test-secret', request());
    expect(result.url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(result.headers.Authorization).toBe('Bearer test-secret');
    const body = result.body as any;
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.type).toBe('object');
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(body.response_format.json_schema.schema.properties.plan.additionalProperties).toBe(false);
    expect(body).not.toHaveProperty('generationConfig');
    expect(JSON.stringify(body)).not.toContain('test-secret');
  });
  it('preserves all foods and planning data while omitting display-only translations', () => {
    const original = request();
    const originalContext = JSON.parse(original.contents[0].parts[0].text);
    const body = providerRequest('groq', 'openai/gpt-oss-120b', 'test', original).body as any;
    const compact = JSON.parse(body.messages[1].content);
    for (const section of ['patient', 'vitals', 'medications', 'healthConditions', 'foodPreferences', 'planning']) {
      expect(compact[section]).toEqual(originalContext[section]);
    }
    expect(compact.catalog.columns).not.toContain('nameUr');
    expect(compact.catalog.columns).not.toContain('servingUr');
    expect(compact.catalog.columns).toEqual(expect.arrayContaining(['id', 'slots', 'sodium', 'protein', 'costTier']));
    // Foods are pre-filtered for the patient, so allergen flags are no longer sent.
    expect(compact.catalog.columns).not.toContain('allergens');
    expect(compact.catalog.foodRows).toHaveLength(originalContext.catalog.foods.length);
    for (const [index, row] of compact.catalog.foodRows.entries()) {
      const rebuilt = Object.fromEntries(compact.catalog.columns.map((key: string, i: number) => [key, row[i]]));
      const food = originalContext.catalog.foods[index];
      for (const key of compact.catalog.columns) expect(rebuilt[key]).toEqual(food[key] ?? food.nutrients?.[key] ?? null);
    }
    expect(body.messages[1].content.length).toBeLessThan(original.contents[0].parts[0].text.length);
  });
  it('preserves the raw Groq answer and usage without changing generated content', () => {
    expect(providerAnswer('groq', { model: 'test-model', usage: { total_tokens: 200 },
      choices: [{ finish_reason: 'stop', message: { content: '{"raw":true}' } }] })).toEqual({
      modelVersion: 'test-model', usage: { total_tokens: 200 }, rawText: '{"raw":true}',
    });
  });
  it.each(['length', 'content_filter', 'tool_calls'])('rejects unfinished Groq output: %s', (reason) => {
    expect(() => providerAnswer('groq', { choices: [{ finish_reason: reason, message: { content: '{}' } }] })).toThrow(/incomplete/);
  });
  it('does not mix a Gemini model with Groq or accept an unknown provider', () => {
    expect(() => providerRequest('groq', 'gemini-3.8-flash', 'test', request())).toThrow();
    expect(() => providerRequest('unknown', 'model', 'test', request())).toThrow();
  });
  it('keeps prompt plus answer allowance within the per-minute token cap', () => {
    const body = providerRequest('groq', 'openai/gpt-oss-120b', 'test', request(), 6000, 8000).body as any;
    const promptChars = body.messages.map((m: any) => m.content.length).reduce((a: number, b: number) => a + b, 0)
      + JSON.stringify(body.response_format).length;
    expect(Math.ceil(promptChars / 3.3) + body.max_completion_tokens).toBeLessThanOrEqual(8000);
    expect(body.max_completion_tokens).toBeGreaterThanOrEqual(1024);
  });
  it('uses the configured answer allowance when there is no per-minute cap', () => {
    expect(answerBudget(6000, 3000)).toBe(6000);
    expect(answerBudget(6000, 3000, 8000)).toBe(4750);
  });
});
