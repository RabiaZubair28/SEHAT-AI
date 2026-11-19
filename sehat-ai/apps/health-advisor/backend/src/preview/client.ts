import { buildPreviewRequest } from './request';

/** One unmodified provider response. No clinical validation, repair, retry or fallback. */
export async function callPreview(request: ReturnType<typeof buildPreviewRequest>, apiKey: string, timeoutMs = 120000) {
  if (!apiKey.trim()) throw new Error('Set GEMINI_API_KEY in the Health Advisor backend .env or environment.');
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 180000) throw new Error('Timeout must be 1000–180000 ms.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(request.body), signal: controller.signal,
    });
    const rawResponse = await response.text();
    let provider: any = null;
    try { provider = JSON.parse(rawResponse); } catch { /* Keep non-JSON provider errors verbatim. */ }
    const candidate = provider?.candidates?.[0];
    const rawText = (candidate?.content?.parts ?? [])
      .filter((part: any) => !part.thought && typeof part.text === 'string').map((part: any) => part.text).join('');
    let parsed: unknown = null;
    let parseError: string | null = null;
    try { parsed = JSON.parse(rawText); } catch { parseError = 'Model text is empty or is not valid JSON; inspect rawText.'; }
    return { httpStatus: response.status, elapsedMs: Date.now() - started,
      modelVersion: provider?.modelVersion ?? null, finishReason: candidate?.finishReason ?? null,
      usage: provider?.usageMetadata ?? null, promptFeedback: provider?.promptFeedback ?? null,
      complete: response.ok && candidate?.finishReason === 'STOP' && !parseError,
      rawResponse, rawText, parsed, parseError };
  } finally { clearTimeout(timer); }
}
