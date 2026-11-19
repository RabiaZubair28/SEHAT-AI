import { buildPreviewRequest, PREVIEW_MODEL } from '../src/preview/request';
import { callPreview } from '../src/preview/client';
import { FOOD_LIBRARY } from '../src/modules/nutrition-advisor/foods/food-library';

const response = (status: number, body: unknown) => ({ status, ok: status < 400,
  text: async () => JSON.stringify(body) }) as Response;

describe('Raw LLM preview transport', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });
  it('sends the full catalog, synthetic context and calculated targets without a secret', () => {
    const request = buildPreviewRequest();
    expect(request.model).toBe(PREVIEW_MODEL);
    expect(request.context.catalog.foods.map((f) => f.id)).toEqual(FOOD_LIBRARY.map((f) => f.id));
    expect(request.context.catalog.foods[0]).toHaveProperty('allergens');
    expect(request.context.catalog.foods[0]).toHaveProperty('nutrients.protein');
    expect(request.context.patient.synthetic).toBe(true);
    expect(request.context.patient.calculatedTargets.kcal).toBeGreaterThan(0);
    expect(request.body).not.toHaveProperty('tools');
    expect(() => buildPreviewRequest('../invalid')).toThrow();
  });
  it('preserves hallucinated IDs without repair and captures provider metadata', async () => {
    const text = JSON.stringify({ mealPlan: { foodId: 'invented_food' } });
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response(200, {
      candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'private reasoning' }, { text }] } }],
      usageMetadata: { totalTokenCount: 123 }, modelVersion: 'model-version',
    }));
    const result = await callPreview(buildPreviewRequest(), 'test-secret');
    expect(result.rawText).toBe(text);
    expect(result.parsed).toEqual(JSON.parse(text));
    expect(result.usage.totalTokenCount).toBe(123);
    expect(result.complete).toBe(true); // Transport/JSON completeness only, not clinical acceptance.
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.headers).toHaveProperty('x-goog-api-key', 'test-secret');
    expect(JSON.stringify(result)).not.toContain('test-secret');
  });
  it.each(['MAX_TOKENS', 'SAFETY'])('keeps incomplete responses visible (%s)', async (finishReason) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(200, { candidates: [{ finishReason,
      content: { parts: [{ text: '{unfinished' }] } }] }));
    const result = await callPreview(buildPreviewRequest(), 'test');
    expect(result.complete).toBe(false);
    expect(result.rawText).toBe('{unfinished');
    expect(result.parseError).toBeTruthy();
  });
  it('records quota errors without retry or fallback', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response(429, { error: { message: 'quota exceeded' } }));
    const result = await callPreview(buildPreviewRequest(), 'test');
    expect(result.httpStatus).toBe(429);
    expect(result.rawResponse).toContain('quota exceeded');
    expect(result.complete).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('requires a key before making any request', async () => {
    const fetch = jest.spyOn(global, 'fetch');
    await expect(callPreview(buildPreviewRequest(), '')).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('aborts a stalled request without retrying', async () => {
    jest.useFakeTimers();
    const fetch = jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const pending = expect(callPreview(buildPreviewRequest(), 'test', 1000)).rejects.toHaveProperty('name', 'AbortError');
    await jest.advanceTimersByTimeAsync(1000);
    await pending;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
