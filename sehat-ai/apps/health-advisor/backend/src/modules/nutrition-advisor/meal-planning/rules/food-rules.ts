import { FOOD_LIBRARY } from '../../foods/food-library';
import { AdvisorPreferences, FoodItem, MedicalRestriction } from '../../models/types';

const BUDGET_TIER = { low: 1, medium: 2, high: 3 } as const;
export const MIN_PORTION = 0.5;
export const MAX_PORTION = 4;

export interface FoodRules {
  prefs: AdvisorPreferences;
  restrictions: MedicalRestriction[];
}

/** Why a food is not allowed for this patient, or null if it is safe to offer. */
export function exclusionReason(food: FoodItem, { prefs, restrictions }: FoodRules): string | null {
  const allergen = food.allergens.find((a) => prefs.allergies.includes(a));
  if (allergen) return `Contains ${allergen.replace('_', ' ')} (allergy)`;
  if (prefs.dietType !== 'any' && (food.containsMeat || food.containsFish)) return 'Not vegetarian';
  if (prefs.dietType === 'vegetarian' && food.containsEgg) return 'Contains egg (vegetarian)';
  if (prefs.excludedFoodIds.includes(food.id)) return 'Excluded (dislike / not available)';
  if (restrictions.includes('diabetic') && food.tags.includes('added_sugar')) return 'Added sugar (diabetes)';
  if (restrictions.includes('low_fat') && (food.tags.includes('fried') || food.tags.includes('high_fat'))) return 'High fat (low-fat restriction)';
  if (restrictions.includes('low_salt') && food.tags.includes('high_sodium')) return 'High salt (low-salt restriction)';
  return null;
}

export const allowedFoods = (rules: FoodRules) =>
  FOOD_LIBRARY.filter((f) => !exclusionReason(f, rules));

