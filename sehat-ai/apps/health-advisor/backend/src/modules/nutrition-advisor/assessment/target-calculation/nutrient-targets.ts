import { NutrientTargets } from '../../models/types';
import { ACTIVITY_FACTORS, TargetInput, calculateBmi, roundTo } from './bmi';

export function calculateTargets(input: TargetInput): NutrientTargets {
  const { ageYears, sex, weightKg, heightCm, activityLevel, restrictions } = input;
  const bmi = calculateBmi(weightKg, heightCm);

  // Mifflin-St Jeor resting energy expenditure; "Other" uses the mean constant.
  const sexConstant = sex === 'Male' ? 5 : sex === 'Female' ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexConstant;
  const tee = bmr * ACTIVITY_FACTORS[activityLevel];

  let goal: NutrientTargets['goal'] = 'maintenance';
  let kcal = tee;
  if (bmi >= 25) {
    goal = 'weight_loss';
    kcal = tee - 500;
  } else if (bmi < 18.5) {
    goal = 'weight_gain';
    kcal = tee + 300;
  }
  const floor = sex === 'Male' ? 1500 : 1200;
  kcal = roundTo(Math.max(kcal, floor), 50);

  // Protein uses a reference weight at BMI 25 when the patient is above it,
  // so obesity does not inflate the protein target.
  const referenceWeight = bmi > 25 ? 25 * Math.pow(heightCm / 100, 2) : weightKg;
  const proteinPerKg = goal === 'weight_gain' ? 1.2 : goal === 'weight_loss' ? 1.0 : 0.8;
  const protein = Math.round(referenceWeight * proteinPerKg);

  const fatShare = restrictions.includes('low_fat') ? 0.25 : 0.28;
  const fat = Math.round((kcal * fatShare) / 9);
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  const fiber = Math.round((kcal / 1000) * 14);

  const iron = sex === 'Female' && ageYears <= 50 ? 18 : 8;
  const vitaminC = sex === 'Male' ? 90 : 75;
  const sodiumMax = restrictions.includes('low_salt') ? 1500 : 2000;
  const waterLitres = Number(Math.min(3, Math.max(2, (weightKg * 30) / 1000)).toFixed(1));

  const goalText =
    goal === 'weight_loss'
      ? '− 500 kcal for gradual weight loss (BMI ≥ 25)'
      : goal === 'weight_gain'
        ? '+ 300 kcal for weight gain (BMI < 18.5)'
        : 'maintenance';

  return {
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    iron,
    vitaminC,
    sodiumMax,
    waterLitres,
    goal,
    methods: [
      {
        nutrient: 'Energy',
        method: `Mifflin-St Jeor × activity factor ${ACTIVITY_FACTORS[activityLevel]} (${activityLevel}), ${goalText}; minimum ${floor} kcal`,
      },
      {
        nutrient: 'Protein',
        method: `${proteinPerKg} g/kg × ${referenceWeight.toFixed(1)} kg ${bmi > 25 ? 'reference weight (BMI 25)' : 'body weight'}`,
      },
      { nutrient: 'Fat', method: `${Math.round(fatShare * 100)}% of energy (WHO: < 30%)` },
      { nutrient: 'Carbohydrates', method: 'Remaining energy after protein and fat' },
      { nutrient: 'Fibre', method: '14 g per 1,000 kcal (IOM)' },
      { nutrient: 'Iron', method: 'IOM Recommended Dietary Allowance by age and sex' },
      { nutrient: 'Vitamin C', method: 'IOM Recommended Dietary Allowance by sex' },
      {
        nutrient: 'Sodium',
        method: restrictions.includes('low_salt')
          ? 'Limit 1,500 mg/day (recorded hypertension / low-salt restriction)'
          : 'WHO: under 2,000 mg/day (5 g salt)',
      },
      { nutrient: 'Water', method: '30 ml/kg/day, kept within 2–3 L' },
    ],
  };
}
