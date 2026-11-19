import { ServiceUnavailableException } from '@nestjs/common';
import { Assessment, ClinicalContext } from '../assessment/clinical/context';
import { AdvisorPreferences } from '../models/types';
import { advisorLlmConfig } from './config';
import { advisorRequest } from './request';
import { providerRequest, providerAnswer } from './transport';
import { parseAdvisorDraftWithRepairs } from './response';
import { harnessNote, runPlanHarness } from './harness';
import { cleanHandoutAdvice } from './handout-advice';

/** Seconds the provider asks us to wait after a rate limit, as readable text. */
function retryAfter(response: Response) {
  const seconds = Math.ceil(Number(response.headers?.get?.('retry-after')));
  return Number.isFinite(seconds) && seconds > 0 ? `about ${seconds} seconds` : 'a minute';
}

export async function generateAdvisorDraft(ctx: ClinicalContext, assessment: Assessment, preferences: AdvisorPreferences) {
  const config = advisorLlmConfig();
  if (!config.apiKey.trim()) throw new ServiceUnavailableException(`Set ${config.provider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'} in sehat-ai/apps/health-advisor/backend/.env, then try again.`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const started = Date.now();
  let stage: 'request' | 'response' | 'completion' | 'json' | 'validation' = 'request';
  try {
    const request = providerRequest(config.provider, config.model, config.apiKey,
      advisorRequest(ctx, assessment, preferences, config.model), config.maxOutputTokens, config.tokensPerMinute);
    const response = await fetch(request.url, { method: 'POST', headers: request.headers,
      body: JSON.stringify(request.body), signal: controller.signal });
    // Groq rejects answers that break its strict format check, but returns the
    // model's full output; the harness repairs small faults locally instead.
    let rescued: unknown = undefined;
    if (!response.ok) {
      let invalidModelFormat = false;
      if (config.provider === 'groq' && response.status === 400) {
        const providerError = await response.json().catch(() => null);
        invalidModelFormat = providerError?.error?.code === 'json_validate_failed';
        if (invalidModelFormat && typeof providerError?.error?.failed_generation === 'string') {
          try { rescued = JSON.parse(providerError.error.failed_generation); } catch { /* truncated: not repairable */ }
        }
      }
      if (rescued === undefined) {
        const reason = response.status === 401 ? 'The API key is invalid or expired.' :
          response.status === 403 ? 'The API project denied access. Check free-tier availability and key restrictions.' :
          response.status === 413 ? 'The request exceeds this provider’s token limit.' :
          response.status === 429 ? `The provider's free-tier rate limit was reached. Wait ${retryAfter(response)} and try again.` :
          response.status === 400 ? (invalidModelFormat
            ? 'The model response did not match the required plan format. Please try again.'
            : 'The API rejected the request. Check the configured model and key.') :
          response.status === 404 ? 'The configured model is unavailable for this API project.' : 'The model provider is unavailable.';
        throw new ServiceUnavailableException(`Health Advisor LLM returned HTTP ${response.status}. ${reason} No replacement advice was generated.`);
      }
    }
    let rawText: string;
    let modelVersion: string | null = null;
    let usage: any = null;
    if (rescued !== undefined) {
      stage = 'validation';
      rawText = JSON.stringify(rescued);
    } else {
      stage = 'response';
      const data = await response.json();
      stage = 'completion';
      ({ rawText, modelVersion, usage } = providerAnswer(config.provider, data));
    }
    stage = 'json';
    const parsed = rescued ?? JSON.parse(rawText);
    stage = 'validation';
    const parsedDraft = parseAdvisorDraftWithRepairs(parsed);
    const repairs = parsedDraft.repairs;
    // Patient advice is health advice only; preferences are already in the plan.
    const cleaned = cleanHandoutAdvice(parsedDraft.draft, preferences);
    const draft = cleaned.draft;
    repairs.push(...cleaned.repairs);
    if (rescued !== undefined) repairs.unshift('provider format check failed; answer repaired locally');
    // Check every day against the patient's limits and repair what fails.
    const { plan, report } = runPlanHarness(draft.plan, assessment.targets, {
      prefs: preferences, restrictions: [...new Set([...assessment.derivedRestrictions, ...preferences.medicalRestrictions])],
    }, repairs);
    return { ...draft, plan, generatedBy: `ai:${config.model}`, note: harnessNote(report),
      generation: { provider: config.provider, model: config.model, modelVersion, elapsedMs: Date.now() - started,
        usage, rawText, harness: report } };
  } catch (error) {
    if (error instanceof ServiceUnavailableException) throw error;
    // Do not expose provider payloads, patient content or credentials in errors.
    const messages = {
      request: 'The model provider could not be reached. Check the backend network connection and provider configuration.',
      response: 'The model provider returned an unreadable API response.',
      completion: 'The model provider returned a blocked, empty or incomplete response.',
      json: 'The model returned invalid JSON instead of a complete plan.',
      validation: 'The generated plan failed validation: required content, food IDs, portions or the seven-day meal structure were invalid.',
    };
    // Validation reasons are our own short messages (no patient content), so show them.
    const detail = stage === 'validation' && error instanceof Error && error.message ? ` (${error.message})` : '';
    const message = controller.signal.aborted ? 'The LLM request timed out.' : messages[stage] + detail;
    throw new ServiceUnavailableException(`${message} Try again. No replacement advice was generated.`);
  } finally { clearTimeout(timer); }
}
