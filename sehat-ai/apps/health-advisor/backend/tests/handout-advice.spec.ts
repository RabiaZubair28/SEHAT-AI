import { cleanHandoutAdvice } from '../src/modules/nutrition-advisor/llm/handout-advice';
import { DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';

const prefs = { ...DEFAULT_PREFERENCES, allergies: ['egg' as const], preferredFoodIds: ['masoor_daal'], excludedFoodIds: ['whole_wheat_bread'] };
const finding = (id: string, source: string) => ({ id, kind: 'observation' as const, label: id, value: '', status: 'info' as const, interpretation: id, source });
const rec = (id: string, title: string, detail: string, evidence: string[]) =>
  ({ id, priority: 1, title, titleUr: '', detail, detailUr: '', icon: '', tone: 'blue' as const, evidence, basis: '' });
const draft = (recommendations: any[], patientNotes = '') => ({
  findings: [finding('htn', 'healthConditions'), finding('pref', 'foodPreferences'), finding('allergy', 'foodPreferences')],
  recommendations,
  plan: { days: [] },
  handout: { activityGuidance: '', activityGuidanceUr: '', counselingNotes: 'Doctor to review fluids.', patientNotes, patientNotesUr: '' },
});

describe('Important advice for better health', () => {
  it('keeps health advice and drops preference, allergy and avoided-food restatements', () => {
    const { draft: out, repairs } = cleanHandoutAdvice(draft([
      rec('salt', 'Limit sodium', 'Keep salt low for blood pressure.', ['htn']),
      rec('carb', 'Monitor carbohydrate intake', 'Spread whole grains through the day.', []),
      rec('daal', 'Include masoor daal daily', 'Eat masoor daal every day.', ['pref']),
      rec('egg', 'Avoid egg and listed bread', 'Do not eat eggs or whole wheat bread.', []),
    ]) as any, prefs);
    expect(out.recommendations.map((r) => r.id)).toEqual(['salt', 'carb']);
    expect(repairs[0]).toMatch(/2 preference, allergy or review item/);
  });

  it('removes review disclaimers from patient notes but keeps practical tips and staff notes', () => {
    const { draft: out } = cleanHandoutAdvice(draft([rec('salt', 'Limit sodium', 'Keep salt low.', ['htn'])],
      'Cook with less oil. Portion sizes and food choices are suggestions only. Confirm with your clinician before starting this plan.') as any, prefs);
    expect(out.handout.patientNotes).toBe('Cook with less oil.');
    expect(out.handout.counselingNotes).toBe('Doctor to review fluids.');
  });

  it('does not mistake words like "nutrition" for a nut allergy', () => {
    const { draft: out } = cleanHandoutAdvice(draft([rec('n', 'Balanced nutrition', 'Eat a variety of nutritious foods.', [])]) as any,
      { ...DEFAULT_PREFERENCES, allergies: ['tree_nut' as const] });
    expect(out.recommendations).toHaveLength(1);
  });
  it('drops review steps from advice and leaves water and activity to their own tips', () => {
    const { draft: out } = cleanHandoutAdvice(draft([
      rec('salt', 'Limit sodium', 'Keep salt low. Ask your doctor before changing salt.', ['htn']),
      rec('edema', 'Monitor edema and seek clinician review', 'Have the doctor individualize fluid and salt.', ['htn']),
      rec('water', 'Stay hydrated', 'Drink about 2.9 L of water daily.', ['htn']),
      rec('walk', 'Light activity', 'Take short walks.', ['htn']),
    ]) as any, prefs);
    expect(out.recommendations.map((r) => r.id)).toEqual(['salt']);
    expect(out.recommendations[0].detail).toBe('Keep salt low.');
  });
  it('removes "if cleared by your doctor" clauses but keeps the advice', () => {
    const base: any = draft([rec('salt', 'Limit sodium', 'Keep salt low.', ['htn'])]);
    base.handout.activityGuidance = 'Walk briskly for 20-30 minutes most days, if cleared by your doctor.';
    const { draft: out } = cleanHandoutAdvice(base, prefs);
    expect(out.handout.activityGuidance).toBe('Walk briskly for 20-30 minutes most days.');
  });
});
