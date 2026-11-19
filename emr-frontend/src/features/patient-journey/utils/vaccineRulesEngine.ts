import dayjs from "dayjs";
import { formatDateToYYYYMMDD } from "@/utils/formats/generalFormatters";

export enum VaccineStatus {
  ADMINISTERED = "Administered",
  SCHEDULED = "Scheduled",
  PENDING = "Pending",
  DEFAULTER = "Defaulter",
  EXPIRED = "Expired",
  NOT_ELIGIBLE = "Not Eligible",
  OVERDUE = "Over Due", // Unfortunate spelling, grandfathered in
}

export const colorMap: Record<string, string> = {
  [VaccineStatus.ADMINISTERED]: "green",
  [VaccineStatus.SCHEDULED]: "blue",
  [VaccineStatus.PENDING]: "orange",
  [VaccineStatus.DEFAULTER]: "purple",
  [VaccineStatus.EXPIRED]: "red",
  [VaccineStatus.NOT_ELIGIBLE]: "maroon",
  [VaccineStatus.OVERDUE]: "red",
};

type VaccineDef = {
  id: number;
  code: string;
  dose_number: number;
  age_min_days: number;
  age_overdue_days: number;
  max_age_days: number;
  pre_requisite_codes: string[] | null;
  gender_restriction?: "Any" | "Male" | "Female" | string;
  applies_to?: string;
  dateAdministered?: string | null;
  immunisationDosageStatus?: string;
  dueDate?: string | null;
};

type RecordEntry = {
  vaccine_id: number;
  immunization_status?: boolean;
  administration_date?: string | Date | null;
  dosageStatus?: VaccineStatus | string;
  isAlreadyAdministered?: boolean;
  dueDate?: string | null;
  [key: string]: any;
};

const daysBetween = (from: dayjs.ConfigType, to: dayjs.ConfigType) =>
  dayjs(to).startOf("day").diff(dayjs(from).startOf("day"), "day");


const CANNOT_ADMINISTER_STATUSES: VaccineStatus[] = [
  VaccineStatus.PENDING,
  VaccineStatus.EXPIRED,
  VaccineStatus.NOT_ELIGIBLE,
];

const matchesGender = (
  restriction: string | undefined,
  patientGender?: string,
) => {
  if (!restriction || restriction === "Any") return true;
  if (!patientGender) return true;
  return restriction.toLowerCase() === patientGender.toLowerCase();
};

/**
 * Pure rules engine. Given vaccine defs + current records + patient info,
 * returns records with dosageStatus and dueDate recomputed.
 *
 * First dose (no prereqs): age_min/overdue/max_days measured from patient DOB.
 * Subsequent dose:         measured from last administered prerequisite date.
 */
export function recomputeVaccineStatuses(
  vaccines: VaccineDef[],
  records: RecordEntry[],
  patientDOB?: string | Date | null,
  patientGender?: string,
  now: dayjs.ConfigType = dayjs(),
): RecordEntry[] {
  const today = dayjs(now);
  const vaccineById = new Map<number, VaccineDef>(
    vaccines.map((v) => [v.id, v]),
  );

  const adminDateByCode = new Map<string, dayjs.Dayjs>();
  records.forEach((r) => {
    const v = vaccineById.get(r.vaccine_id);
    if (!v) return;
    if (r.immunization_status && r.administration_date) {
      adminDateByCode.set(v.code, dayjs(r.administration_date));
    }
  });

  const computeOne = (
    v: VaccineDef,
  ): { status: VaccineStatus; dueDate?: string } => {
    if (!matchesGender(v.gender_restriction, patientGender)) {
      return { status: VaccineStatus.NOT_ELIGIBLE };
    }

    // NOTE: do NOT short-circuit to "Administered" just because this vaccine
    // has a date in adminDateByCode. Form-entered dates should cascade to
    // dependent doses (via prereq resolution below) but must not lock the
    // current field (ANC/PNC would disable the date picker otherwise).
    // "Administered" is only set by the outer loop from backend-confirmed
    // state (isAlreadyAdministered / dosageStatus === "Administered").

    let reference: dayjs.Dayjs | null = null;

    if (v.pre_requisite_codes && v.pre_requisite_codes.length > 0) {
      const prereqDates: dayjs.Dayjs[] = [];
      for (const code of v.pre_requisite_codes) {
        const d = adminDateByCode.get(code);
        if (!d) {
          return { status: VaccineStatus.PENDING };
        }
        prereqDates.push(d);
      }
      reference = prereqDates.reduce((a, b) => (a.isAfter(b) ? a : b));
    } else {
      if (!patientDOB) return { status: VaccineStatus.PENDING };
      reference = dayjs(patientDOB);
    }

    const daysSince = daysBetween(reference, today);
    const dueDate = formatDateToYYYYMMDD(
      reference.add(v.age_min_days, "day").toDate(),
    );

    if (daysSince < v.age_min_days) return { status: VaccineStatus.PENDING, dueDate };
    if (daysSince > v.max_age_days) return { status: VaccineStatus.EXPIRED, dueDate };
    if (daysSince > v.age_overdue_days) return { status: VaccineStatus.DEFAULTER, dueDate };
    return { status: VaccineStatus.SCHEDULED, dueDate };
  };

  const ordered = [...records].sort((a, b) => {
    const va = vaccineById.get(a.vaccine_id);
    const vb = vaccineById.get(b.vaccine_id);
    return (va?.dose_number ?? 0) - (vb?.dose_number ?? 0);
  });

  const updatedById = new Map<number, RecordEntry>();
  for (const rec of ordered) {
    const v = vaccineById.get(rec.vaccine_id);
    if (!v) {
      updatedById.set(rec.vaccine_id, rec);
      continue;
    }

    if (rec.isAlreadyAdministered || rec.dosageStatus === VaccineStatus.ADMINISTERED) {
      updatedById.set(rec.vaccine_id, {
        ...rec,
        dosageStatus: VaccineStatus.ADMINISTERED,
      });
      continue;
    }

    const { status, dueDate } = computeOne(v);
    const shouldClear = CANNOT_ADMINISTER_STATUSES.includes(status);

    updatedById.set(rec.vaccine_id, {
      ...rec,
      dosageStatus: status,
      dueDate: dueDate ?? rec.dueDate,
      immunization_status: shouldClear ? false : rec.immunization_status, // ES-812: Clear checkbox when status isn't editable
      administration_date: shouldClear ? null : rec.administration_date,  // ES-812: Clear administration date when status isn't editable
    });
  }

  return records.map((r) => updatedById.get(r.vaccine_id) ?? r);
}

/**
 * Adapter for ANC/PNC where Td dose admin dates live in form fields
 * named `dateAdministered{N}` rather than in a records array.
 *
 * Returns vaccines with `immunisationDosageStatus` and `dueDate` recomputed
 * based on current form values + API-side admin dates.
 */
export function recomputeTdVaccinesFromFormDates(
  vaccines: VaccineDef[],
  formValues: Record<string, any>,
  patientDOB?: string | Date | null,
  patientGender?: string,
): VaccineDef[] {
  if (!vaccines?.length) return [];

  const records: RecordEntry[] = vaccines.map((v) => {
    const formDate = formValues?.[`dateAdministered${v.dose_number}`];
    const apiDate = v.dateAdministered;
    const adminDate = formDate || apiDate || undefined;
    return {
      vaccine_id: v.id,
      administration_date: adminDate,
      immunization_status: !!adminDate,
      isAlreadyAdministered: v.immunisationDosageStatus === VaccineStatus.ADMINISTERED,
      dosageStatus: v.immunisationDosageStatus,
    };
  });

  const recomputed = recomputeVaccineStatuses(
    vaccines,
    records,
    patientDOB,
    patientGender,
  );
  const byId = new Map<number, RecordEntry>(
    recomputed.map((r) => [r.vaccine_id, r]),
  );

  return vaccines.map((v) => {
    const r = byId.get(v.id);
    return {
      ...v,
      immunisationDosageStatus:
        (r?.dosageStatus as string) ?? v.immunisationDosageStatus,
      dueDate: r?.dueDate ?? v.dueDate,
    };
  });
}
