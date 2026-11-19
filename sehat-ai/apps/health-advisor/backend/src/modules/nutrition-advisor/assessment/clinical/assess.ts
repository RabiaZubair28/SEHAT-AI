import { AdvisorPreferences, MedicalRestriction } from '../../models/types';
import { calculateBmi, calculateTargets } from '../targets';
import { checkDataQuality } from './data-quality';
import { checkEligibility } from './eligibility';
import { deriveRestrictions } from './restrictions';
import { buildFindings } from './findings';
import { buildRecommendations } from './recommendations';
import { activityGuidanceFor } from './activity-guidance';
import { Assessment, ClinicalContext } from './context';

export function assess(ctx: ClinicalContext, prefs: AdvisorPreferences): Assessment {
  const corrections = prefs.measurementCorrections ?? {};
  const corrected = !!(corrections.weightKg || corrections.heightCm);
  const correctedCtx: ClinicalContext = corrected
    ? {
        ...ctx,
        measurements: {
          ...ctx.measurements,
          weightKg: corrections.weightKg
            ? { ...ctx.measurements.weightKg, value: corrections.weightKg, source: 'Corrected in Nutrition Advisor', isMissing: false, isOutdated: false, recordedAt: new Date().toISOString() }
            : ctx.measurements.weightKg,
          heightCm: corrections.heightCm
            ? { ...ctx.measurements.heightCm, value: corrections.heightCm, source: 'Corrected in Nutrition Advisor', isMissing: false, isOutdated: false, recordedAt: new Date().toISOString() }
            : ctx.measurements.heightCm,
        },
      }
    : ctx;

  const dataQuality = checkDataQuality(correctedCtx);
  const eligibility = checkEligibility(correctedCtx, dataQuality, prefs);
  const w = correctedCtx.measurements.weightKg.value;
  const h = correctedCtx.measurements.heightCm.value;
  const anthropometricsOk = !dataQuality.some((i) => i.severity === 'blocking');
  const bmi = anthropometricsOk && w && h ? calculateBmi(w, h) : null;
  const effective = { weightKg: w, heightCm: h, bmi, corrected };
  const withBmi: ClinicalContext = {
    ...correctedCtx,
    measurements: { ...correctedCtx.measurements, bmi: { ...correctedCtx.measurements.bmi, value: bmi } },
  };

  const derivedRestrictions = deriveRestrictions(ctx, prefs);
  const restrictions = [...new Set([...derivedRestrictions, ...prefs.medicalRestrictions])];
  // Cases needing individual review still get draft targets for the doctor to
  // confirm. Adult formulas do not apply to children, so they get none (NA-07).
  const held = eligibility.status === 'held';
  const adult = ctx.patient.ageYears >= 18;
  const calculated =
    (eligibility.status === 'eligible' || (held && adult)) && anthropometricsOk && w && h
      ? calculateTargets({
          ageYears: ctx.patient.ageYears,
          sex: ctx.patient.sex,
          weightKg: w,
          heightCm: h,
          activityLevel: prefs.activityLevel,
          restrictions,
        })
      : null;
  const targets = calculated && held
    ? { ...calculated, provisional: true, reviewReasons: eligibility.reasons }
    : calculated;

  const findings = buildFindings(withBmi, effective, dataQuality, prefs);
  const recommendations = eligibility.status === 'held' ? [] : buildRecommendations(withBmi, findings, restrictions, targets);
  const drafted = activityGuidanceFor(withBmi, findings);
  const activityGuidance = !held
    ? drafted
    : adult
      ? { ...drafted, caution: ['Draft for doctor review: confirm this suits the patient\'s condition.', drafted.caution].filter(Boolean).join(' ') }
      : { allowed: false, text: '', textUr: '', caution: 'Activity advice for children needs the doctor\'s individual assessment.' };

  return { dataQuality, eligibility, effective, derivedRestrictions, targets, findings, recommendations, activityGuidance };
}
