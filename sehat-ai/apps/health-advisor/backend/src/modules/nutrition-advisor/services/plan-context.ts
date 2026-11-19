import { Assessment } from '../assessment/clinical/context';
import { FoodRules, allowedFoods } from '../meal-planning/meal-planner';
import { NutrientTargets, PLAN_DAYS } from '../models/types';

/** Whitelisted assessment data; never pass the complete EMR record to a provider. */
export type PlanClinicalContext = Pick<Assessment, 'effective' | 'findings' | 'dataQuality'>;
export interface PlanPatient {
  ageYears: number;
  sex: string;
  clinical?: PlanClinicalContext;
}

export function buildPlanContext(patient: PlanPatient, targets: NutrientTargets, rules: FoodRules) {
  const prefs = rules.prefs;
  return {
    contextVersion: 'nutrition-v1',
    patient: { ageYears: patient.ageYears, sex: String(patient.sex).slice(0, 30) },
    anthropometrics: patient.clinical?.effective ?? null,
    findings: patient.clinical?.findings.map((f) => ({
      id: f.id, kind: f.kind, label: f.label, value: f.value, status: f.status,
    })) ?? [],
    dataQuality: patient.clinical?.dataQuality.map((q) => ({ field: q.field, severity: q.severity })) ?? [],
    targets,
    restrictions: rules.restrictions,
    conditions: prefs.healthConditions ?? [],
    allergies: prefs.allergies,
    dietType: prefs.dietType,
    activityLevel: prefs.activityLevel,
    budget: prefs.budget,
    preferredFoodIds: prefs.preferredFoodIds,
    excludedFoodIds: prefs.excludedFoodIds,
    notes: String(prefs.notes ?? '').slice(0, 500),
    selectionPolicy: {
      mandatory: ['catalog_and_slot_eligibility', 'allergies', 'medical_restrictions', 'diet_type', 'excluded_foods'],
      priorities: ['nutrient_target_fit', 'budget_fit', 'preferred_foods', 'weekly_variety'],
      missingData: 'Unknown values are not normal results. Do not infer diagnoses.',
    },
    eligibleFoods: allowedFoods(rules).map((f) => ({
      id: f.id, group: f.group, slots: f.slots, serving: f.serving,
      nutrients: f.nutrients, costTier: f.costTier,
    })),
    expectedDays: PLAN_DAYS,
  };
}
