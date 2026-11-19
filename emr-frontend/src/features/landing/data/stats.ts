export interface Stat {
  /** Numeric target to count up to. Omit for non-numeric values like "24/7". */
  to?: number;
  /** Suffix appended after the counted number, e.g. "+" or "%". */
  suffix?: string;
  /** Static display value used when the stat isn't a simple number. */
  display?: string;
  label: string;
}

export const stats: Stat[] = [
  { to: 150, suffix: "+", label: "Facilities Connected" },
  { to: 10, suffix: "+", label: "Clinical Modules" },
  { display: "24/7", label: "Platform Availability" },
  { to: 100, suffix: "%", label: "EPI Schedule Aligned" },
];
