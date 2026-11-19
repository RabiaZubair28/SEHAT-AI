import dayjs from "dayjs";

export function calculateAge(dobString: string): string | number {
  const dob = dayjs(dobString);
  const now = dayjs();

  // return now.diff(dob, "year");
  const weeks = now.diff(dob, "week");
  const months = now.diff(dob, "month");
  const years = now.diff(dob, "year");

  if (weeks < 5) {
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  if (months < 12) {
    return `${months} month${months !== 1 ? "s" : ""}`;
  }

  return years;
}

export const getAgeInYears = (dob: string) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
};

export function getImmunizationAgeCategory(dobString: string): string | null {
  const dob = dayjs(dobString);
  const now = dayjs();

  const weeks = now.diff(dob, "week");
  const months = now.diff(dob, "month");

  if (weeks < 6) {
    return "AT_BIRTH";
  }

  if (weeks >= 6 && weeks < 10) {
    return "WEEKS_6";
  }

  if (weeks >= 10 && weeks < 14) {
    return "WEEKS_10";
  }

  if (weeks >= 14 && months < 9) {
    return "WEEKS_14";
  }

  if (months >= 9 && months < 15) {
    return "MONTHS_9";
  }

  if (months >= 15 && months < 18) {
    return "MONTHS_15";
  }

  // if (months >= 18 && months < 24) {
  if (months >= 18) {
    return "MONTHS_18";
  }

  return null;
}

export function getVaccinationListByCategory(
  category: string | null
): string[] {
  if (!category) return [];

  const vaccinesByCategory = {
    AT_BIRTH: ["BCG", "OPV 0", "HepB 0"],
    WEEKS_6: ["Penta 1", "OPV 1", "PCV 1", "Rota 1"],
    WEEKS_10: ["Penta 2", "OPV 2", "PCV 2", "Rota 2"],
    WEEKS_14: ["Penta 3", "OPV 3", "PCV 3", "Rota 3", "IPV 1"],
    MONTHS_9: ["Measles", "TCV", "IPV 2"],
    MONTHS_15: ["Measles 2"],
    MONTHS_18: ["DTP Booster"],
  } as const;

  const order = [
    "AT_BIRTH",
    "WEEKS_6",
    "WEEKS_10",
    "WEEKS_14",
    "MONTHS_9",
    "MONTHS_15",
    "MONTHS_18",
  ] as const;

  const index = order.indexOf(category as (typeof order)[number]);
  if (index === -1) return [];

  const list: string[] = [];
  for (let i = 0; i <= index; i++) {
    list.push(...vaccinesByCategory[order[i]]);
  }

  return list;
}

export function getVaccinationListByDOB(dobString: string): string[] {
  const category = getImmunizationAgeCategory(dobString);
  return getVaccinationListByCategory(category);
}
export function calculateAgeByDob(dobString: string): string {
  const dob = dayjs(dobString);
  const now = dayjs();

  const diffInWeeks = now.diff(dob, "week");
  const diffInMonths = now.diff(dob, "month");
  const diffInYears = now.diff(dob, "year");

  if (diffInWeeks < 12) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""}`;
  } else if (diffInMonths < 24) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""}`;
  } else {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""}`;
  }
}

export const isLessThanTwoYears = (dob: string | Date): boolean => {
  if (!dob) return false;

  const birthDate = new Date(dob);
  const today = new Date();

  // Calculate age in years
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust if birthday hasn't occurred this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age < 2;
};
