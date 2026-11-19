import { assertGenerationPrerequisites, NutritionGenerationInputs } from '../src/modules/nutrition-advisor/services/generation-prerequisites';

const complete = (): NutritionGenerationInputs => ({
  ageYears: 35, sex: 'Male',
  admission: { patient_coming_from: 'Self', reason_for_admission: 'New admission' },
  vitals: { weight: 70, height: 67, temperature: 98.6, pulse: 75, systolic_bp: 120,
    diastolic_bp: 80, edema: 'No edema', is_experiencing_complications: false, complications: [] },
});

describe('AI generation prerequisites', () => {
  it('blocks skipped tabs and lists missing fields', () => {
    try {
      assertGenerationPrerequisites({ ageYears: 35, sex: 'Male' });
      throw new Error('Expected validation failure');
    } catch (error: any) {
      expect(error.getStatus()).toBe(422);
      expect(error.getResponse().reasons).toEqual(expect.arrayContaining([
        'Patient admission details: Reason for admission', 'Vitals & Assessment: Weight',
      ]));
    }
  });
  it('accepts complete inputs with an explicit No for complications', () => {
    expect(() => assertGenerationPrerequisites(complete())).not.toThrow();
  });
  it.each(['weight', 'height', 'temperature', 'pulse', 'systolic_bp', 'diastolic_bp'])('blocks missing or zero %s', (field) => {
    const input = complete();
    (input.vitals as any)[field] = 0;
    expect(() => assertGenerationPrerequisites(input)).toThrow();
  });
  it('requires complication details only when Yes is selected', () => {
    const input = complete(); input.vitals!.is_experiencing_complications = true;
    expect(() => assertGenerationPrerequisites(input)).toThrow();
    input.vitals!.complications = ['Vomiting'];
    expect(() => assertGenerationPrerequisites(input)).not.toThrow();
  });
  it('requires MUAC for female patients', () => {
    const input = complete(); input.sex = 'Female';
    expect(() => assertGenerationPrerequisites(input)).toThrow();
    input.vitals!.muac = 24;
    expect(() => assertGenerationPrerequisites(input)).not.toThrow();
  });
  it('applies age-dependent requirements', () => {
    const input = complete(); input.ageYears = 4;
    delete input.vitals!.systolic_bp; delete input.vitals!.diastolic_bp;
    expect(() => assertGenerationPrerequisites(input)).toThrow();
    input.vitals!.muac = 14;
    expect(() => assertGenerationPrerequisites(input)).not.toThrow();
  });
});
