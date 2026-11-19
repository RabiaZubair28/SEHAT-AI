import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const VEGETABLES: FoodItem[] = [
{
    id: 'spinach_saag', name: 'Spinach (Saag)', nameUr: 'پالک (ساگ)', emoji: '🥬',
    group: 'vegetable', serving: '1 cup cooked', servingUr: '1 کپ پکا ہوا',
    nutrients: n(80, 5, 7, 4, 4.3, 6.4, 17, 300),
    allergens: [], costTier: 1, slots: ['breakfast', 'lunch', 'dinner'],
    tags: ['iron_rich', 'high_fiber'], scalable: false,
  },
  {
    id: 'mixed_vegetables', name: 'Mixed Vegetables', nameUr: 'مکس سبزی', emoji: '🥕',
    group: 'vegetable', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(120, 3.5, 15, 5.5, 5, 1.5, 20, 350),
    allergens: [], costTier: 1, slots: MAIN, tags: ['high_fiber'], scalable: false,
  },
  {
    id: 'aloo_gobi', name: 'Aloo Gobi', nameUr: 'آلو گوبھی', emoji: '🥦',
    group: 'vegetable', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(150, 3.5, 20, 7, 4.5, 1.2, 45, 380),
    allergens: [], costTier: 1, slots: MAIN, tags: ['vitamin_c_rich'], scalable: false,
  },
  {
    id: 'bhindi', name: 'Bhindi', nameUr: 'بھنڈی', emoji: '🫑',
    group: 'vegetable', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(130, 3, 12, 8, 5, 0.8, 22, 350),
    allergens: [], costTier: 1, slots: MAIN, tags: ['high_fiber'], scalable: false,
  },
  {
    id: 'lauki', name: 'Lauki (Bottle Gourd)', nameUr: 'لوکی', emoji: '🥒',
    group: 'vegetable', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(90, 2, 10, 5, 3, 0.6, 15, 320),
    allergens: [], costTier: 1, slots: MAIN, tags: [], scalable: false,
  },
  {
    id: 'kachumber_salad', name: 'Kachumber Salad', nameUr: 'کچومر سلاد', emoji: '🥗',
    group: 'vegetable', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(30, 1.2, 6.5, 0.2, 1.8, 0.4, 15, 10),
    allergens: [], costTier: 1, slots: MAIN, tags: ['vitamin_c_rich'], scalable: false,
  },
];
