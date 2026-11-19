import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const GRAINS: FoodItem[] = [
{
    id: 'whole_wheat_roti', name: 'Whole Wheat Roti', nameUr: 'گندم کی روٹی', emoji: '🫓',
    group: 'grain', serving: '1 roti (medium)', servingUr: '1 روٹی (درمیانی)',
    nutrients: n(120, 4, 25, 0.6, 3.5, 1.4, 0, 5),
    allergens: ['gluten'], costTier: 1, slots: ['breakfast', 'lunch', 'dinner'],
    tags: ['whole_grain', 'high_fiber'], scalable: true,
  },
  {
    id: 'paratha', name: 'Paratha', nameUr: 'پراٹھا', emoji: '🥙',
    group: 'grain', serving: '1 paratha', servingUr: '1 پراٹھا',
    nutrients: n(260, 5, 32, 12, 3, 1.5, 0, 300),
    allergens: ['gluten', 'dairy'], costTier: 1, slots: ['breakfast'],
    tags: ['fried', 'high_fat'], scalable: false,
  },
  {
    id: 'white_rice', name: 'Boiled Rice', nameUr: 'اُبلے چاول', emoji: '🍚',
    group: 'grain', serving: '1 cup cooked', servingUr: '1 کپ پکے ہوئے',
    nutrients: n(205, 4.3, 45, 0.4, 0.6, 0.3, 0, 2),
    allergens: [], costTier: 1, slots: MAIN, tags: [], scalable: true,
  },
  {
    id: 'brown_rice', name: 'Brown Rice', nameUr: 'براؤن چاول', emoji: '🍚',
    group: 'grain', serving: '1 cup cooked', servingUr: '1 کپ پکے ہوئے',
    nutrients: n(216, 5, 45, 1.8, 3.5, 0.8, 0, 10),
    allergens: [], costTier: 2, slots: MAIN, tags: ['whole_grain', 'high_fiber'], scalable: true,
  },
  {
    id: 'daliya', name: 'Daliya (Wheat Porridge)', nameUr: 'دلیہ', emoji: '🥣',
    group: 'grain', serving: '1 bowl, made with milk', servingUr: '1 پیالہ، دودھ کے ساتھ',
    nutrients: n(220, 8, 38, 4, 5, 1.6, 0, 60),
    allergens: ['gluten', 'dairy'], costTier: 1, slots: ['breakfast'],
    tags: ['whole_grain', 'high_fiber'], scalable: true,
  },
  {
    id: 'oats_porridge', name: 'Oats Porridge', nameUr: 'جئی کا دلیہ', emoji: '🥣',
    group: 'grain', serving: '1 cup cooked with water', servingUr: '1 کپ، پانی میں پکا ہوا',
    nutrients: n(166, 6, 28, 3.6, 4, 2.1, 0, 9),
    allergens: [], costTier: 2, slots: ['breakfast'], tags: ['whole_grain', 'high_fiber'], scalable: true,
  },
  {
    id: 'whole_wheat_bread', name: 'Whole Wheat Bread', nameUr: 'آٹے کی ڈبل روٹی', emoji: '🍞',
    group: 'grain', serving: '2 slices', servingUr: '2 سلائس',
    nutrients: n(160, 8, 28, 2, 4, 1.6, 0, 290),
    allergens: ['gluten'], costTier: 2, slots: ['breakfast'], tags: ['whole_grain'], scalable: true,
  },
  {
    id: 'khichdi', name: 'Khichdi', nameUr: 'کھچڑی', emoji: '🍲',
    group: 'grain', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(230, 8, 40, 4, 4, 1.8, 0, 350),
    allergens: [], costTier: 1, slots: MAIN, tags: [], scalable: true,
  },
  {
    id: 'chicken_pulao', name: 'Chicken Pulao', nameUr: 'چکن پلاؤ', emoji: '🍛',
    group: 'grain', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(320, 15, 42, 10, 1.5, 1.5, 2, 500),
    allergens: [], containsMeat: true, costTier: 2, slots: MAIN, tags: ['high_sodium'], scalable: true,
  },
];
