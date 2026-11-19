export type PlanStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "superseded";

export const STATUS_META: Record<PlanStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "default" },
  pending_review: { label: "Awaiting review", color: "gold" },
  changes_requested: { label: "Changes requested", color: "orange" },
  approved: { label: "Approved", color: "green" },
  rejected: { label: "Rejected", color: "red" },
  superseded: { label: "Superseded", color: "default" },
};
