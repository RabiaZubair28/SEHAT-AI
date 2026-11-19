import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const LEGUMES: FoodItem[] = [
{
    id: 'masoor_daal', name: 'Masoor Daal', nameUr: 'مسور کی دال', emoji: '🍲',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(250, 16, 38, 4, 13, 5.5, 3, 380),
    allergens: [], costTier: 1, slots: MAIN, tags: ['iron_rich', 'high_fiber'], scalable: true,
  },
  {
    id: 'chana_daal', name: 'Chana Daal', nameUr: 'چنے کی دال', emoji: '🍲',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(260, 14, 40, 5, 12, 4, 2, 380),
    allergens: [], costTier: 1, slots: MAIN, tags: ['iron_rich', 'high_fiber'], scalable: true,
  },
  {
    id: 'moong_daal', name: 'Moong Daal', nameUr: 'مونگ کی دال', emoji: '🍲',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(220, 14, 36, 3, 12, 2.8, 2, 350),
    allergens: [], costTier: 1, slots: MAIN, tags: ['high_fiber'], scalable: true,
  },
  {
    id: 'lobia', name: 'Lobia / Rajma', nameUr: 'لوبیا', emoji: '🫘',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(240, 15, 40, 3.5, 13, 4, 2, 400),
    allergens: [], costTier: 1, slots: MAIN, tags: ['iron_rich', 'high_fiber'], scalable: true,
  },
  {
    id: 'chana_chaat', name: 'Chana Chaat', nameUr: 'چنا چاٹ', emoji: '🥗',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(270, 14, 45, 4.2, 12.5, 4.7, 6, 300),
    allergens: [], costTier: 1, slots: ['evening_snack', 'lunch'], tags: ['iron_rich', 'high_fiber'], scalable: true,
  },
  {
    id: 'lentil_soup', name: 'Lentil Soup', nameUr: 'دال کا سوپ', emoji: '🍜',
    group: 'legume', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(150, 9, 22, 3, 7, 3, 2, 450),
    allergens: [], costTier: 1, slots: ['evening_snack', 'dinner'], tags: ['high_fiber'], scalable: false,
  },
  {
    id: 'roasted_chana', name: 'Roasted Chana', nameUr: 'بھنے چنے', emoji: '🫘',
    group: 'legume', serving: '1/4 cup (30 g)', servingUr: 'چوتھائی کپ (30 گرام)',
    nutrients: n(110, 6, 18, 1.8, 5, 1.8, 0, 10),
    allergens: [], costTier: 1, slots: SNACK, tags: ['high_fiber'], scalable: false,
  },
];
