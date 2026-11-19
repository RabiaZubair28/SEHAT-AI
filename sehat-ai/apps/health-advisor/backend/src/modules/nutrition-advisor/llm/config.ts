import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

export interface AdvisorLlmConfig {
  provider: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  /** Provider per-minute token cap; prompt + answer allowance must fit inside it. */
  tokensPerMinute?: number;
}

/** Feature-owned configuration; never modify the host process environment. */
export function advisorLlmConfig(): AdvisorLlmConfig {
  const candidates = [resolve(__dirname, '../../../../.env'),
    resolve(process.cwd(), 'sehat-ai/apps/health-advisor/backend/.env'),
    resolve(process.cwd(), '../sehat-ai/apps/health-advisor/backend/.env')];
  const file = candidates.find(existsSync);
  const env = { ...process.env, ...(file ? parseEnv(readFileSync(file, 'utf8')) : {}) };
  const timeout = Number(env.HEALTH_ADVISOR_TIMEOUT_MS || 120000);
  const provider = env.HEALTH_ADVISOR_PROVIDER || 'gemini';
  if (!['gemini', 'groq'].includes(provider)) throw new Error('HEALTH_ADVISOR_PROVIDER must be gemini or groq');
  const defaultOutputTokens = provider === 'groq' ? 6000 : 16384;
  const outputTokens = Number(env.HEALTH_ADVISOR_MAX_OUTPUT_TOKENS || defaultOutputTokens);
  // Groq's free tier counts prompt + max answer length against 8,000 tokens per minute.
  const tokensPerMinute = Number(env.HEALTH_ADVISOR_TOKENS_PER_MINUTE || (provider === 'groq' ? 8000 : 0));
  return { provider, apiKey: (provider === 'groq' ? env.GROQ_API_KEY : env.GEMINI_API_KEY) || '',
    model: env.HEALTH_ADVISOR_MODEL || (provider === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-3.8-flash'),
    timeoutMs: Number.isFinite(timeout) ? Math.max(1000, Math.min(180000, timeout)) : 120000,
    maxOutputTokens: Number.isFinite(outputTokens) ? Math.max(1024, Math.min(16384, Math.floor(outputTokens))) : defaultOutputTokens,
    tokensPerMinute: Number.isFinite(tokensPerMinute) && tokensPerMinute > 0 ? Math.floor(tokensPerMinute) : undefined };
}
