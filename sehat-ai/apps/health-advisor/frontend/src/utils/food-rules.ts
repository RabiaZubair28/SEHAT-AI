import type { FoodItem, MedicalRestriction, Preferences } from '../types';

export const MIN_PORTION = 0.5;
export const MAX_PORTION = 4;

export const ALLERGEN_LABELS: Record<string, string> = {
  egg: "Egg",
  dairy: "Milk / dairy",
  gluten: "Wheat / gluten",
  fish: "Fish",
  peanut: "Peanut",
  tree_nut: "Tree nuts",
};

export const RESTRICTION_LABELS: Record<MedicalRestriction, string> = {
  low_salt: "Low salt",
  diabetic: "Diabetic (no added sugar)",
  low_fat: "Low fat",
};

export function exclusionReason(
  food: FoodItem,
  prefs: Preferences,
  restrictions: MedicalRestriction[],
): string | null {
  const allergen = food.allergens.find((a) => prefs.allergies.includes(a));
  if (allergen) return `Contains ${ALLERGEN_LABELS[allergen].toLowerCase()} (allergy)`;
  if (prefs.dietType !== "any" && (food.containsMeat || food.containsFish)) return "Not vegetarian";
  if (prefs.dietType === "vegetarian" && food.containsEgg) return "Contains egg (vegetarian)";
  if (prefs.excludedFoodIds.includes(food.id)) return "Excluded (dislike / not available)";
  if (restrictions.includes("diabetic") && food.tags.includes("added_sugar")) return "Added sugar (diabetes)";
  if (restrictions.includes("low_fat") && (food.tags.includes("fried") || food.tags.includes("high_fat")))
    return "High fat (low-fat restriction)";
  if (restrictions.includes("low_salt") && food.tags.includes("high_sodium")) return "High salt (low-salt restriction)";
  return null;
}
