import { assess } from '../src/modules/nutrition-advisor/assessment/clinical-assessment';
import { calculateTargets } from '../src/modules/nutrition-advisor/assessment/targets';
import { DEFAULT_PREFERENCES } from '../src/modules/nutrition-advisor/models/types';
import { baseContext, sv } from './fixtures/clinical-context';

describe('Nutrition Advisor clinical assessment', () => {
it('calculates targets with Mifflin-St Jeor and a weight-loss deficit for obesity', () => {
    const t = calculateTargets({ ageYears: 35, sex: 'Male', weightKg: 80, heightCm: 150, activityLevel: 'light', restrictions: [] });
    expect(t.goal).toBe('weight_loss');
    expect(t.kcal).toBe(1650); // (800 + 937.5 - 175 + 5) * 1.375 - 500 = 1655 → 1650
    expect(t.protein).toBe(56); // 1.0 g/kg × reference weight 56.25 kg
  });

  it('flags swapped blood pressure, implausible pulse and MUAC in mm', () => {
    const a = assess(
      baseContext({
        measurements: {
          ...baseContext().measurements,
          systolicBp: sv(90), diastolicBp: sv(120), pulse: sv(23), muacCm: sv(894),
        },
      }),
      DEFAULT_PREFERENCES,
    );
    const fields = a.dataQuality.map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(['bp', 'pulse', 'muac']));
    expect(a.eligibility.status).toBe('eligible'); // vitals warnings do not block, anthropometrics do
    expect(a.activityGuidance.allowed).toBe(false);
  });

  it('holds children, pregnancy and complications for professional assessment', () => {
    expect(assess(baseContext({ patient: { ageYears: 4, sex: 'Female' } }), DEFAULT_PREFERENCES).eligibility.status).toBe('held');
    expect(assess(baseContext({ pregnancyStatus: { status: 'pregnant', source: 'ANC', recordedAt: null } }), DEFAULT_PREFERENCES).eligibility.status).toBe('held');
    const held = assess(baseContext(), DEFAULT_PREFERENCES);
    expect(held.recommendations.length).toBeGreaterThan(0);
  });

  it('asks for corrected values when weight is impossible, and accepts a correction', () => {
    const ctx = baseContext({ measurements: { ...baseContext().measurements, weightKg: sv(800, 'kg') } });
    expect(assess(ctx, DEFAULT_PREFERENCES).eligibility.status).toBe('needs_data');
    const fixed = assess(ctx, { ...DEFAULT_PREFERENCES, measurementCorrections: { weightKg: 80 } });
    expect(fixed.eligibility.status).toBe('eligible');
    expect(fixed.targets).not.toBeNull();
  });

  it('treats low haemoglobin as a lab finding for review, never a diagnosis', () => {
    const a = assess(baseContext(), DEFAULT_PREFERENCES);
    const hb = a.findings.find((f) => f.id === 'lab:hb')!;
    expect(hb.kind).toBe('lab_result');
    expect(hb.status).toBe('low');
    expect(a.findings.some((f) => f.kind === 'recorded_diagnosis')).toBe(false);
    expect(a.recommendations.map((r) => r.id)).toContain('iron_rich');
  });
});
