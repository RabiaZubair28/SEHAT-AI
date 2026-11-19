import { MealPlanContent } from './types';

export interface AiPlanResult {
  plan: MealPlanContent;
  generatedBy: string;
  note?: string;
}
