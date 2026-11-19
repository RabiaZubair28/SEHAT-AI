// One synthetic call through the same service used by the Advisor UI; no EMR data.
const fs = require('node:fs');
const path = require('node:path');
const { generateAdvisorDraft } = require('../dist/modules/nutrition-advisor/llm/service');
const { advisorLlmConfig } = require('../dist/modules/nutrition-advisor/llm/config');
const { assess } = require('../dist/modules/nutrition-advisor/assessment/clinical-assessment');
const { DEFAULT_PREFERENCES } = require('../dist/modules/nutrition-advisor/models/types');
const { assertCanDraft, draftReviewContext } = require('../dist/modules/nutrition-advisor/services/draft-review-policy');
const { validatePlan } = require('../dist/modules/nutrition-advisor/meal-planning/meal-planner');
const responseParser = require('../dist/modules/nutrition-advisor/llm/response');
const parseDraft = responseParser.parseAdvisorDraft;
responseParser.parseAdvisorDraft = (value) => {
  try { return parseDraft(value); }
  catch (error) { console.error(JSON.stringify({ validationFailure: error.message })); throw error; }
};
const sv = (value) => ({ value, source: 'Synthetic verification', recordedAt: new Date().toISOString(), isMissing: value == null, isOutdated: false });
const ctx = { patient: { ageYears: 35, sex: 'Male' }, measurements: { weightKg: sv(70), heightCm: sv(170), bmi: sv(null),
  systolicBp: sv(120), diastolicBp: sv(80), pulse: sv(75), temperatureF: sv(98.6), muacCm: sv(null), spo2: sv(98), edema: sv('No edema') },
  labs: { haemoglobin: sv(14) }, screening: { clinicalPallor: sv(false), complications: sv([]) },
  diagnoses: [], recordedAllergies: [], pregnancyStatus: null };
const reviewCase = process.argv.includes('--review-case');
// Every diet-plan parameter set, including medications, to exercise the full payload.
const parametersCase = process.argv.includes('--parameters-case');
const preferences = reviewCase
  ? { ...DEFAULT_PREFERENCES, healthConditions: ['liver_disease'], allergies: ['egg'], budget: 'medium', activityLevel: 'light' }
  : parametersCase
    ? { ...DEFAULT_PREFERENCES, healthConditions: ['diabetes', 'hypertension'], allergies: ['peanut'], budget: 'low',
        preferredFoodIds: ['masoor_daal', 'guava'], excludedFoodIds: ['paratha', 'doodh_patti'], activityLevel: 'light', dietType: 'vegetarian_with_egg' }
    : DEFAULT_PREFERENCES;
if (reviewCase) ctx.measurements.edema = sv('Moderate');
if (parametersCase) {
  Object.assign(ctx.measurements, { weightKg: sv(84), heightCm: sv(165), systolicBp: sv(146), diastolicBp: sv(92), spo2: sv(96), edema: sv('No edema') });
  ctx.medications = { given: true, items: [
    { name: 'Metformin 500mg', dosage: '1-0-1', instruction: 'After meals', source: 'Synthetic verification' },
    { name: 'Amlodipine 5mg', dosage: '1-0-0', instruction: 'Morning', source: 'Synthetic verification' },
  ] };
}
// Synthetic verification only: expose provider error codes, never keys or raw payloads.
const providerFetch = global.fetch;
global.fetch = async (...args) => {
  console.log(JSON.stringify({ requestBytes: Buffer.byteLength(args[1]?.body || '', 'utf8') }));
  const response = await providerFetch(...args);
  if (!response.ok) {
    const body = await response.clone().json().catch(() => null);
    console.error(JSON.stringify({ httpStatus: response.status, providerErrorCode: body?.error?.code,
      providerErrorType: body?.error?.type, providerMessage: body?.error?.message?.slice(0, 1500) }));
  }
  return response;
};
(async () => {
  const config = advisorLlmConfig();
  console.log(JSON.stringify({ provider: config.provider, model: config.model, keyConfigured: !!config.apiKey, synthetic: true }));
  const assessment = assess(ctx, preferences);
  assertCanDraft(assessment);
  const result = await generateAdvisorDraft(ctx, assessment, preferences);
  const validation = validatePlan(result.plan, assessment.targets, {
    prefs: preferences, restrictions: [...assessment.derivedRestrictions, ...preferences.medicalRestrictions],
  });
  const output = path.resolve(__dirname, '../preview-results');
  fs.mkdirSync(output, { recursive: true });
  const folder = fs.mkdtempSync(path.join(output, 'advisor-'));
  fs.writeFileSync(path.join(folder, 'response.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ success: true, findings: result.findings.length, recommendations: result.recommendations.length,
    days: result.plan.days.length, elapsedMs: result.generation.elapsedMs, usage: result.generation.usage, savedTo: folder,
    clinicalReview: draftReviewContext(assessment), validationErrors: validation.warnings.filter(w => w.severity === 'error').length }));
  if (validation.warnings.some(w => w.severity === 'error')) process.exitCode = 1;
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
