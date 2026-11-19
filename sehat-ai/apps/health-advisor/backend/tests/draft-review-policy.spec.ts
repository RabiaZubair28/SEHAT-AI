import { assess } from '../src/modules/nutrition-advisor/assessment/clinical-assessment';
import { assertCanDraft, draftReviewContext, draftFollowUpDate } from '../src/modules/nutrition-advisor/services/draft-review-policy';
import { advisorRequest } from '../src/modules/nutrition-advisor/llm/request';
import { DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';
import { baseContext, sv } from './fixtures/clinical-context';

const prefs = { ...DEFAULT_PREFERENCES, healthConditions: ['liver_disease' as const], allergies: ['egg' as const],
  budget: 'medium' as const, activityLevel: 'light' as const };
const reviewCase = () => baseContext({ measurements: { ...baseContext().measurements, edema: sv('Moderate') } });

describe('Condition-aware drafts for doctor review', () => {
  it('drafts provisional targets and activity for oedema and liver disease, flagged for review', () => {
    const assessment = assess(reviewCase(), prefs);
    expect(() => assertCanDraft(assessment)).not.toThrow();
    expect(assessment.targets).toMatchObject({ provisional: true });
    expect(assessment.targets!.kcal).toBeGreaterThan(0);
    expect(assessment.targets!.reviewReasons!.join(' ')).toMatch(/Moderate.*Liver disease/);
    expect(assessment.activityGuidance.text).not.toBe('');
    expect(assessment.activityGuidance.caution).toMatch(/Draft for doctor review/);
    expect(draftFollowUpDate(assessment)).toBeNull();
    expect(draftReviewContext(assessment)).toMatchObject({ required: true, individualized: true });
    expect(draftReviewContext(assessment).reasons.join(' ')).toMatch(/Moderate.*Liver disease/);
  });
  it('sends clinical flags, measurements and preferences to the model', () => {
    const ctx = reviewCase();
    const request = advisorRequest(ctx, assess(ctx, prefs), prefs, 'openai/gpt-oss-120b');
    const payload = JSON.parse(request.contents[0].parts[0].text);
    expect(payload.vitals.edema).toBe('Moderate');
    expect(payload.healthConditions.patientReported).toContain('liver_disease');
    expect(payload.foodPreferences.allergies).toContain('egg');
    expect(payload.planning.clinicalReview.individualized).toBe(true);
    expect(payload.planning.calculatedTargets).toMatchObject({ provisional: true });
    expect(payload.planning.activityAllowed).toBe(true);
    expect(payload.planning.activityCaution).toMatch(/Draft for doctor review/);
    expect(request.systemInstruction.parts[0].text).toContain('provisional seven-day meal plan');
  });
  it('does not let a clinical flag bypass invalid measurements', () => {
    const ctx = reviewCase(); ctx.measurements.weightKg = sv<number>(null);
    expect(() => assertCanDraft(assess(ctx, prefs))).toThrow('correct the highlighted measurements');
  });
  it('retains routine targets for ordinary adult drafts', () => {
    const a = assess(baseContext(), DEFAULT_PREFERENCES);
    expect(() => assertCanDraft(a)).not.toThrow();
    expect(a.targets).not.toBeNull();
    expect(draftReviewContext(a).individualized).toBe(false);
  });
  it('gives children no adult targets or activity advice', () => {
    const child = baseContext({ patient: { ageYears: 9, sex: 'Female' } });
    const assessment = assess(child, DEFAULT_PREFERENCES);
    expect(assessment.eligibility.status).toBe('held');
    expect(assessment.targets).toBeNull();
    expect(assessment.activityGuidance.allowed).toBe(false);
  });
});
