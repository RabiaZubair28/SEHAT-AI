import { UnprocessableEntityException } from '@nestjs/common';

/** Nutrition inputs (saved or submitted draft): visit-vital fallbacks cannot bypass required tabs. */
export interface NutritionGenerationInputs {
  ageYears: number;
  sex: string;
  admission?: { patient_coming_from?: unknown; reason_for_admission?: unknown } | null;
  vitals?: {
    weight?: unknown; height?: unknown; systolic_bp?: unknown; diastolic_bp?: unknown;
    temperature?: unknown; pulse?: unknown; muac?: unknown; edema?: unknown;
    is_experiencing_complications?: unknown; complications?: unknown;
  } | null;
}

export function assertGenerationPrerequisites(input: NutritionGenerationInputs): void {
  const reasons: string[] = [];
  const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  const positive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;
  if (!text(input.admission?.patient_coming_from)) reasons.push('Patient admission details: Where is the patient coming from?');
  if (!text(input.admission?.reason_for_admission)) reasons.push('Patient admission details: Reason for admission');
  const v = input.vitals;
  const fields: [keyof NonNullable<NutritionGenerationInputs['vitals']>, string][] = [
    ['weight', 'Weight'], ['height', 'Height'], ['temperature', 'Temperature'], ['pulse', 'Pulse'],
  ];
  if (input.ageYears > 14) fields.push(['systolic_bp', 'Systolic BP'], ['diastolic_bp', 'Diastolic BP']);
  if (input.ageYears < 5 || input.sex === 'Female') fields.push(['muac', 'MUAC']);
  for (const [key, label] of fields) {
    if (!positive(v?.[key])) reasons.push(`Vitals & Assessment: ${label}`);
  }
  if (!text(v?.edema)) reasons.push('Vitals & Assessment: Edema');
  if (typeof v?.is_experiencing_complications !== 'boolean') reasons.push('Vitals & Assessment: Is the patient experiencing any complications?');
  if (v?.is_experiencing_complications === true &&
      (!Array.isArray(v.complications) || !v.complications.length || !v.complications.every(text))) {
    reasons.push('Vitals & Assessment: Select complication');
  }
  if (reasons.length) throw new UnprocessableEntityException({
    message: 'Complete the required Nutrition fields before generating AI advice.', reasons,
  });
}
