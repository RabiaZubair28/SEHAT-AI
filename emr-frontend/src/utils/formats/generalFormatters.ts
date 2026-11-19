export const formatCnic = (cnic?: string | null): string | undefined => {
  if (!cnic) return cnic ?? undefined;
  const digits = cnic.replace(/\D/g, "");

  if (digits.length !== 13) return cnic;

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

export const formatDateForDisplay = (date: Date) => {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

export const formatDateToYYYYMMDD = (date: string | Date): string => {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // Returns "2025-09-24"
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "-";

  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

export const formatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return "-";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";

  const datePart = d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
};

export const formatServiceName = (serviceName: string): string => {
  if (!serviceName) return "-";

  // List of acronyms that should remain uppercase
  const acronyms = ["OPD", "ANC", "PNC"];

  if (acronyms.includes(serviceName.toUpperCase())) {
    return serviceName.toUpperCase();
  }

  return serviceName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
