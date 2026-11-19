import { FoodItem, MealSlot, PLAN_DAYS } from '../models/types';

export const SLOT_KEYS: Record<string, MealSlot> = {
  b: 'breakfast',
  m: 'mid_morning',
  l: 'lunch',
  e: 'evening_snack',
  d: 'dinner',
};

export const planSchema = (foods: FoodItem[]) => ({
  type: 'object',
  properties: {
    days: {
      type: 'array',
      minItems: PLAN_DAYS,
      maxItems: PLAN_DAYS,
      items: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(SLOT_KEYS).map(([key, slot]) => [
            key,
            {
              type: 'array',
              items: { type: 'string', enum: foods.filter((f) => f.slots.includes(slot)).map((f) => f.id) },
              minItems: 1,
              maxItems: slot === 'mid_morning' || slot === 'evening_snack' ? 2 : 3,
            },
          ]),
        ),
        required: Object.keys(SLOT_KEYS),
      },
    },
  },
  required: ['days'],
});
