import { MealSlot, Nutrients } from './food';

export interface PlanItem {
  foodId: string;
  portions: number;
}
export interface PlanMeal {
  slot: MealSlot;
  time: string;
  items: PlanItem[];
}
export interface PlanDay {
  day: number;
  meals: PlanMeal[];
}
export interface PlanContent {
  days: PlanDay[];
}

export interface Handout {
  activityGuidance: string;
  activityGuidanceUr: string;
  counselingNotes: string;
  patientNotes: string;
  patientNotesUr: string;
  followUpDate: string | null;
  urduProofread: boolean;
}

export interface PlanWarning {
  day?: number;
  slot?: MealSlot;
  foodId?: string;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

export interface DayTotals extends Nutrients {
  day: number;
}
