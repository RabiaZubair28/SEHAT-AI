import { FoodItem, PLAN_DAYS } from '../models/types';
import { SLOT_KEYS } from './plan-schema';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

/** Validate before repair so hallucinations cannot silently become accepted AI output. */
export function validProposal(raw: unknown, foods: FoodItem[]): boolean {
  if (!record(raw) || !exactKeys(raw, ['days']) || !Array.isArray(raw.days) || raw.days.length !== PLAN_DAYS) return false;
  return raw.days.every((day) => record(day) && exactKeys(day, Object.keys(SLOT_KEYS)) &&
    Object.entries(SLOT_KEYS).every(([key, slot]) => {
      const ids = day[key];
      const allowed = new Set(foods.filter((food) => food.slots.includes(slot)).map((food) => food.id));
      return Array.isArray(ids) && ids.length >= 1 && ids.length <= (key === 'm' || key === 'e' ? 2 : 3) &&
        new Set(ids).size === ids.length && ids.every((id) => typeof id === 'string' && allowed.has(id));
    }));
}
