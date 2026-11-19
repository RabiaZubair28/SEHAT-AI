import { SERVICE_TYPE_OPTIONS } from "@/data/types";

export const normalizeServiceName = (name?: string) =>
  (name || "").trim().toUpperCase().replace(/\s+/g, "_");

export const formatServiceLabel = (name?: string) => {
  const normalized = normalizeServiceName(name);
  const matchedOption = SERVICE_TYPE_OPTIONS.find(
    (option) => option.value === normalized,
  );

  if (matchedOption) {
    return matchedOption.label;
  }

  return normalized
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
