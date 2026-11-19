import { FoodItem, MealSlot, Nutrients } from '../models/types';

// Food composition reference for the Nutrition Advisor.
// Values are per listed serving and were compiled from USDA FoodData Central
// (SR Legacy) and the Pakistan Food Composition Table; home-cooked dishes use
// standard household recipes (moderate oil, iodised salt). The dataset is
// versioned so every saved plan records which data it was validated against.
// It must be signed off by the programme nutritionist before pilot use.
export const FOOD_DATA_VERSION = '2026.10-draft';
export const FOOD_DATA_SOURCE =
  'USDA FoodData Central (SR Legacy) & Pakistan Food Composition Table; household recipes estimated';

import { GRAINS } from './grains';
import { PROTEINS } from './protein-foods';
import { LEGUMES } from './legumes';
import { VEGETABLES } from './vegetables';
import { DAIRY } from './dairy';
import { FRUITS } from './fruits';
import { NUTS } from './nuts';

export const FOOD_LIBRARY: FoodItem[] = [
  GRAINS, PROTEINS, LEGUMES, VEGETABLES, DAIRY, FRUITS, NUTS,
].flat();

export const FOOD_BY_ID: Record<string, FoodItem> = Object.fromEntries(FOOD_LIBRARY.map((food) => [food.id, food]));
