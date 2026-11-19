export type MealSlot =
  | 'breakfast'
  | 'mid_morning'
  | 'lunch'
  | 'evening_snack'
  | 'dinner';

export const MEAL_SLOTS: { slot: MealSlot; label: string; labelUr: string; time: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', labelUr: 'ناشتہ', time: '07:00' },
  { slot: 'mid_morning', label: 'Mid-Morning', labelUr: 'درمیانی کھانا', time: '10:00' },
  { slot: 'lunch', label: 'Lunch', labelUr: 'دوپہر کا کھانا', time: '13:00' },
  { slot: 'evening_snack', label: 'Evening Snack', labelUr: 'شام کا ناشتہ', time: '16:00' },
  { slot: 'dinner', label: 'Dinner', labelUr: 'رات کا کھانا', time: '19:00' },
];

export const PLAN_DAYS = 7;

export type Allergen = 'egg' | 'dairy' | 'gluten' | 'fish' | 'peanut' | 'tree_nut';

export type FoodGroup =
  | 'grain'
  | 'protein'
  | 'legume'
  | 'dairy'
  | 'vegetable'
  | 'fruit'
  | 'nuts'
  | 'beverage';

export interface Nutrients {
  kcal: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  iron: number; // mg
  vitaminC: number; // mg
  sodium: number; // mg
}

export interface FoodItem {
  id: string;
  name: string;
  nameUr: string;
  emoji: string;
  imageUrl?: string;
  group: FoodGroup;
  serving: string;
  servingUr: string;
  nutrients: Nutrients; // per one serving
  allergens: Allergen[];
  containsMeat?: boolean;
  containsFish?: boolean;
  containsEgg?: boolean;
  costTier: 1 | 2 | 3; // 1 = low cost, widely available
  slots: MealSlot[];
  tags: (
    | 'iron_rich'
    | 'vitamin_c_rich'
    | 'high_sodium'
    | 'added_sugar'
    | 'fried'
    | 'high_fat'
    | 'tea'
    | 'whole_grain'
    | 'high_fiber'
  )[];
  scalable: boolean; // portion may be adjusted automatically to meet energy targets
}
