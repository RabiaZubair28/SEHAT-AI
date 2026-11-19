import type { FoodItem, PlanContent } from '../types';

// "1 roti (medium)" × 1.5 → "1.5 roti (medium)"; other servings → "1.5 × 100 g".
const scaleServing = (serving: string, portions: number) =>
  portions === 1 ? serving : /^1 /.test(serving) ? serving.replace(/^1 /, `${portions} `) : `${portions} × ${serving}`;

export const formatPortion = (food: FoodItem, portions: number) => scaleServing(food.serving, portions);

export const formatPortionUr = (food: FoodItem, portions: number) => scaleServing(food.servingUr, portions);

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const clonePlan = (plan: PlanContent): PlanContent => JSON.parse(JSON.stringify(plan));
