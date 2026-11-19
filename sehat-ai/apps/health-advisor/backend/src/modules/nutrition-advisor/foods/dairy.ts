import { FoodItem } from '../models/types';
import { ALL, MAIN, SNACK, n } from './food-data';

export const DAIRY: FoodItem[] = [
{
    id: 'plain_yogurt', name: 'Yogurt (Plain)', nameUr: 'دہی (سادہ)', emoji: '🥛',
    group: 'dairy', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(150, 8.5, 11.4, 8, 0, 0.1, 1, 113),
    allergens: ['dairy'], costTier: 1, slots: ALL, tags: [], scalable: false,
  },
  {
    id: 'raita', name: 'Raita', nameUr: 'رائتہ', emoji: '🥣',
    group: 'dairy', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(120, 6, 9, 6, 0.8, 0.3, 4, 250),
    allergens: ['dairy'], costTier: 1, slots: MAIN, tags: [], scalable: false,
  },
  {
    id: 'milk_low_fat', name: 'Milk (low fat)', nameUr: 'دودھ (کم چکنائی)', emoji: '🥛',
    group: 'dairy', serving: '1 glass (240 ml)', servingUr: '1 گلاس (240 ملی لیٹر)',
    nutrients: n(102, 8, 12, 2.4, 0, 0.1, 0, 105),
    allergens: ['dairy'], costTier: 2, slots: ['breakfast', 'evening_snack', 'dinner'], tags: [], scalable: false,
  },
  {
    id: 'doodh_patti', name: 'Doodh Patti Tea (1 tsp sugar)', nameUr: 'دودھ پتی چائے (ایک چمچ چینی)', emoji: '☕',
    group: 'beverage', serving: '1 cup', servingUr: '1 کپ',
    nutrients: n(80, 2, 10, 3, 0, 0.1, 0, 30),
    allergens: ['dairy'], costTier: 1, slots: ['breakfast', 'evening_snack'],
    tags: ['tea', 'added_sugar'], scalable: false,
  },
];
