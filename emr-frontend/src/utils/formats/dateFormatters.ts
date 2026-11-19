import type { Dayjs } from "dayjs";

export const DATE_FORMATS = {
  API_DATE: "YYYY-MM-DD",
  DAY: "D MMM YYYY",
  DAY_WITH_WEEKDAY: "ddd, D MMM YYYY",
  DAY_MONTH: "D MMM",
  MONTH: "MMMM YYYY",
  TIME_12H: "h:mm A",
} as const;

export type DateFormat = string;

export const isToday = (d: Dayjs) => d.isSame(new Date(), "day");

export const isCurrentMonth = (d: Dayjs) => d.isSame(new Date(), "month");

export const dayLabel = (d: Dayjs, format: DateFormat = DATE_FORMATS.DAY) =>
  d.format(format);

export const monthLabel = (d: Dayjs, format: DateFormat = DATE_FORMATS.MONTH) =>
  d.format(format);

export const monthRangeLabel = (
  d: Dayjs,
  startFormat: DateFormat = DATE_FORMATS.DAY_MONTH,
  endFormat: DateFormat = DATE_FORMATS.DAY,
) => `${d.startOf("month").format(startFormat)} – ${d.endOf("month").format(endFormat)}`;
