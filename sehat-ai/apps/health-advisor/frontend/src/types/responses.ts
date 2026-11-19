import { PlanStatus } from './status';
import { PlanRecord } from './plan-record';
import { DayTotals, PlanWarning } from './plan';

export interface PlanResponse {
  plan: PlanRecord | null;
  totals?: DayTotals[];
  warnings?: PlanWarning[];
  events?: { action: string; at: string; by: string | null; details: Record<string, any> | null }[];
  generationNote?: string | null;
}

export interface Delivery {
  id: number;
  planId: number;
  planVersion: number;
  channel: "whatsapp" | "download";
  status: "sent" | "failed";
  language: "en" | "ur";
  recipient: string | null;
  error: string | null;
  createdAt: string;
  createdBy: string | null;
}
export interface ReviewQueueItem {
  planId: number;
  appointmentServiceId: number;
  version: number;
  status: PlanStatus;
  updatedAt: string;
  reviewedAt: string | null;
  patientName: string;
  mrNo: string;
  submittedBy: string | null;
}
