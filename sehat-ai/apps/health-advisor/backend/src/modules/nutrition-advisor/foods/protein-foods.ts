import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const PROTEINS: FoodItem[] = [
{
    id: 'boiled_egg', name: 'Boiled Egg', nameUr: 'اُبلا انڈا', emoji: '🥚',
    group: 'protein', serving: '1 egg', servingUr: '1 انڈا',
    nutrients: n(78, 6.3, 0.6, 5.3, 0, 0.6, 0, 62),
    allergens: ['egg'], containsEgg: true, costTier: 1, slots: ['breakfast', 'evening_snack'],
    tags: [], scalable: false,
  },
  {
    id: 'omelette', name: 'Omelette (little oil)', nameUr: 'آملیٹ (کم تیل)', emoji: '🍳',
    group: 'protein', serving: '1 egg', servingUr: '1 انڈا',
    nutrients: n(120, 6.5, 1, 10, 0.3, 0.7, 2, 180),
    allergens: ['egg'], containsEgg: true, costTier: 1, slots: ['breakfast'], tags: [], scalable: false,
  },
  {
    id: 'grilled_chicken', name: 'Grilled Chicken', nameUr: 'گرل چکن', emoji: '🍗',
    group: 'protein', serving: '100 g', servingUr: '100 گرام',
    nutrients: n(165, 31, 0, 3.6, 0, 1, 0, 300),
    allergens: [], containsMeat: true, costTier: 3, slots: MAIN, tags: [], scalable: true,
  },
  {
    id: 'chicken_curry', name: 'Chicken Salan', nameUr: 'چکن سالن', emoji: '🍛',
    group: 'protein', serving: '1 cup with gravy', servingUr: '1 کپ شوربے کے ساتھ',
    nutrients: n(280, 25, 8, 16, 1.5, 1.5, 5, 550),
    allergens: [], containsMeat: true, costTier: 2, slots: MAIN, tags: ['high_sodium', 'high_fat'], scalable: true,
  },
  {
    id: 'grilled_fish', name: 'Grilled Fish', nameUr: 'گرل مچھلی', emoji: '🐟',
    group: 'protein', serving: '100 g', servingUr: '100 گرام',
    nutrients: n(130, 22, 0, 4.5, 0, 0.8, 0, 280),
    allergens: ['fish'], containsFish: true, costTier: 3, slots: MAIN, tags: [], scalable: true,
  },
  {
    id: 'beef_curry_lean', name: 'Lean Beef Salan', nameUr: 'گائے کے گوشت کا سالن', emoji: '🥘',
    group: 'protein', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(300, 26, 6, 19, 1.5, 3.2, 4, 550),
    allergens: [], containsMeat: true, costTier: 3, slots: MAIN,
    tags: ['iron_rich', 'high_sodium', 'high_fat'], scalable: true,
  },
  {
    id: 'chicken_liver', name: 'Chicken Kaleji', nameUr: 'مرغی کی کلیجی', emoji: '🍖',
    group: 'protein', serving: '75 g cooked', servingUr: '75 گرام پکی ہوئی',
    nutrients: n(130, 18, 1, 5, 0, 8.6, 2, 300),
    allergens: [], containsMeat: true, costTier: 2, slots: MAIN, tags: ['iron_rich'], scalable: false,
  },
  {
    id: 'besan_cheela', name: 'Besan Cheela', nameUr: 'بیسن کا چیلا', emoji: '🥞',
    group: 'legume', serving: '1 cheela', servingUr: '1 چیلا',
    nutrients: n(150, 7, 18, 5, 4, 1.6, 3, 200),
    allergens: [], costTier: 1, slots: ['breakfast'], tags: ['high_fiber'], scalable: true,
  },
];
