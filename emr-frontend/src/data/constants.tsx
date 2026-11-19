export const IMMUNISATION_STATUSES = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  ADMINISTERED: "Administered",
  OVER_DUE: "Defaulter",
  CLOSED: "Closed",
} as const;

export const getImmunisationStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    [IMMUNISATION_STATUSES.PENDING]: "default",
    [IMMUNISATION_STATUSES.SCHEDULED]: "blue",
    [IMMUNISATION_STATUSES.ADMINISTERED]: "green",
    [IMMUNISATION_STATUSES.OVER_DUE]: "red",
    [IMMUNISATION_STATUSES.CLOSED]: "gray",
  };
  return statusMap[status] || "default";
};

export const STATUS_OPTIONS = [
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Pending", value: "PENDING" },
  { label: "Partially Fulfilled", value: "PARTIALLY_FULFILLED" },
];
