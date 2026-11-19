import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const FRUITS: FoodItem[] = [
{
    id: 'apple', name: 'Apple', nameUr: 'سیب', emoji: '🍎',
    group: 'fruit', serving: '1 medium', servingUr: '1 درمیانہ',
    nutrients: n(95, 0.5, 25, 0.3, 4.4, 0.2, 8.4, 2),
    allergens: [], costTier: 2, slots: ['breakfast', ...SNACK], tags: ['high_fiber'], scalable: false,
  },
  {
    id: 'banana', name: 'Banana', nameUr: 'کیلا', emoji: '🍌',
    group: 'fruit', serving: '1 medium', servingUr: '1 درمیانہ',
    nutrients: n(105, 1.3, 27, 0.4, 3.1, 0.3, 10, 1),
    allergens: [], costTier: 1, slots: ['breakfast', ...SNACK], tags: [], scalable: false,
  },
  {
    id: 'guava', name: 'Guava', nameUr: 'امرود', emoji: '🍐',
    group: 'fruit', serving: '1 medium', servingUr: '1 درمیانہ',
    nutrients: n(37, 1.4, 8, 0.5, 3, 0.1, 126, 1),
    allergens: [], costTier: 1, slots: SNACK, tags: ['vitamin_c_rich', 'high_fiber'], scalable: false,
  },
  {
    id: 'kinnow', name: 'Kinnow / Orange', nameUr: 'کینو / مالٹا', emoji: '🍊',
    group: 'fruit', serving: '1 medium', servingUr: '1 درمیانہ',
    nutrients: n(62, 1.2, 15.4, 0.2, 3.1, 0.1, 70, 0),
    allergens: [], costTier: 1, slots: ['breakfast', ...SNACK], tags: ['vitamin_c_rich'], scalable: false,
  },
  {
    id: 'papaya', name: 'Papaya', nameUr: 'پپیتا', emoji: '🥭',
    group: 'fruit', serving: '1 cup pieces', servingUr: '1 کپ ٹکڑے',
    nutrients: n(62, 0.7, 15.7, 0.4, 2.5, 0.4, 88, 12),
    allergens: [], costTier: 2, slots: SNACK, tags: ['vitamin_c_rich'], scalable: false,
  },
  {
    id: 'dates', name: 'Dates', nameUr: 'کھجور', emoji: '🌰',
    group: 'fruit', serving: '2 pieces', servingUr: '2 عدد',
    nutrients: n(45, 0.4, 12, 0.1, 1.3, 0.2, 0, 0),
    allergens: [], costTier: 2, slots: SNACK, tags: [], scalable: false,
  },
  {
    id: 'lemon_water', name: 'Lemon Water (no sugar)', nameUr: 'لیموں پانی (بغیر چینی)', emoji: '🍋',
    group: 'beverage', serving: '1 glass', servingUr: '1 گلاس',
    nutrients: n(10, 0.1, 3, 0, 0.1, 0, 18, 5),
    allergens: [], costTier: 1, slots: ALL, tags: ['vitamin_c_rich'], scalable: false,
  },
];
