import { compactCatalog } from './compact-catalog';
import { advisorRequest } from './request';

/** Translate the shared response schema into JSON Schema for Groq's chat API. */
export function jsonSchema(node: any): any {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(jsonSchema);
  return Object.fromEntries([
    ...Object.entries(node).map(([key, value]) => [key, key === 'type' ? String(value).toLowerCase() : jsonSchema(value)]),
    ...(node.type === 'OBJECT' ? [['additionalProperties', false]] : []),
  ]);
}

// Token estimate for this JSON-heavy prompt. Groq has measured ~3.4 characters
// per token for it; 3.3 keeps prompt + answer allowance under the per-minute cap
// while leaving the answer ample room (answers use ~2,700 tokens).
const estimateTokens = (...parts: string[]) => Math.ceil(parts.reduce((n, p) => n + p.length, 0) / 3.3);

/**
 * Answer allowance that keeps prompt + answer within the provider's per-minute
 * cap, so the request is not rejected outright (HTTP 413).
 */
export function answerBudget(maxOutputTokens: number, promptTokens: number, tokensPerMinute?: number) {
  if (!tokensPerMinute) return maxOutputTokens;
  return Math.max(1024, Math.min(maxOutputTokens, tokensPerMinute - promptTokens - 250));
}

export function providerRequest(provider: string, model: string, key: string, request: ReturnType<typeof advisorRequest>, maxOutputTokens?: number, tokensPerMinute?: number): { url: string; headers: Record<string, string>; body: object } {
  if (provider === 'groq') {
    if (model.startsWith('gemini-')) throw new Error('Select a Groq model for the Groq provider');
    const system = request.systemInstruction.parts[0].text;
    const user = compactCatalog(request.contents[0].parts[0].text);
    const schema = jsonSchema(request.generationConfig.responseSchema);
    return { url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: { model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_schema', json_schema: { name: 'nutrition_advisor', strict: true, schema } },
        max_completion_tokens: answerBudget(maxOutputTokens ?? 6000, estimateTokens(system, user, JSON.stringify(schema)), tokensPerMinute),
        reasoning_effort: 'low',
      } };
  }
  if (provider !== 'gemini' || !/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error('Invalid provider/model combination');
  return { url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: { ...request,
      generationConfig: { ...request.generationConfig, maxOutputTokens: maxOutputTokens ?? request.generationConfig.maxOutputTokens } } };
}

export function providerAnswer(provider: string, data: any) {
  if (provider === 'groq') {
    const choice = data?.choices?.[0];
    if (choice?.finish_reason !== 'stop' || choice.message?.refusal || typeof choice.message?.content !== 'string') {
      throw new Error('Groq response blocked or incomplete');
    }
    return { rawText: choice.message.content, modelVersion: data.model ?? null, usage: data.usage ?? null };
  }
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new Error('Gemini response blocked or incomplete');
  return { rawText: (candidate.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join(''),
    modelVersion: data.modelVersion ?? null, usage: data.usageMetadata ?? null };
}
