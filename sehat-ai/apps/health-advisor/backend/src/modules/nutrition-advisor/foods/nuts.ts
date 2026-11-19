import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const NUTS: FoodItem[] = [
{
    id: 'almonds', name: 'Almonds', nameUr: 'بادام', emoji: '🌰',
    group: 'nuts', serving: '10 pieces', servingUr: '10 عدد',
    nutrients: n(70, 2.5, 2.6, 6, 1.5, 0.4, 0, 0),
    allergens: ['tree_nut'], costTier: 3, slots: ['breakfast', ...SNACK], tags: [], scalable: false,
  },
  {
    id: 'peanuts', name: 'Peanuts', nameUr: 'مونگ پھلی', emoji: '🥜',
    group: 'nuts', serving: '1 handful (28 g)', servingUr: '1 مٹھی (28 گرام)',
    nutrients: n(160, 7, 4.6, 14, 2.4, 0.6, 0, 5),
    allergens: ['peanut'], costTier: 1, slots: SNACK, tags: ['high_fat'], scalable: false,
  },
];
