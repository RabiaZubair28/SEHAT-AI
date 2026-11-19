import { MealSlot } from '../../models/types';

// Familiar Pakistani meal patterns. Disallowed items are swapped for an allowed
// food from the same group, so restrictions never leave an empty meal.
export const TEMPLATES: Record<MealSlot, string[][]> = {
  breakfast: [
    ['whole_wheat_roti', 'boiled_egg', 'spinach_saag'],
    ['daliya', 'banana'],
    ['oats_porridge', 'boiled_egg', 'apple'],
    ['besan_cheela', 'plain_yogurt'],
    ['whole_wheat_roti', 'omelette', 'kinnow'],
    ['whole_wheat_bread', 'boiled_egg', 'milk_low_fat'],
    ['daliya', 'almonds'],
  ],
  mid_morning: [
    ['guava'], ['apple', 'almonds'], ['kinnow'], ['roasted_chana'], ['banana'], ['papaya'], ['plain_yogurt', 'dates'],
  ],
  lunch: [
    ['whole_wheat_roti', 'masoor_daal', 'kachumber_salad'],
    ['brown_rice', 'chicken_curry', 'kachumber_salad'],
    ['whole_wheat_roti', 'spinach_saag', 'raita'],
    ['whole_wheat_roti', 'lobia', 'kachumber_salad'],
    ['khichdi', 'plain_yogurt', 'kachumber_salad'],
    ['whole_wheat_roti', 'moong_daal', 'mixed_vegetables'],
    ['white_rice', 'grilled_fish', 'kachumber_salad'],
  ],
  evening_snack: [
    ['chana_chaat'], ['plain_yogurt', 'apple'], ['roasted_chana', 'lemon_water'], ['guava', 'roasted_chana'],
    ['lentil_soup'], ['kinnow', 'roasted_chana'], ['milk_low_fat', 'banana'],
  ],
  dinner: [
    ['whole_wheat_roti', 'grilled_chicken', 'mixed_vegetables'],
    ['whole_wheat_roti', 'aloo_gobi', 'chana_daal'],
    ['whole_wheat_roti', 'grilled_fish', 'spinach_saag'],
    ['whole_wheat_roti', 'bhindi', 'raita'],
    ['whole_wheat_roti', 'chicken_liver', 'kachumber_salad'],
    ['whole_wheat_roti', 'lauki', 'masoor_daal'],
    ['brown_rice', 'beef_curry_lean', 'kachumber_salad'],
  ],
};
