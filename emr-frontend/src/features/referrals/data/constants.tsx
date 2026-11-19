export const REFERRAL_TYPES = {
  IN: "Internal",
  OUT: "External",
  SELF: "Assign to me",
};

const ServiceTypes = {
  OPD: "OPD",
  ANC: "ANC",
  PNC: "PNC",
  DELIVERY: "DELIVERY",
  FAMILY_PLANNING: "FAMILY_PLANNING",
  IMMUNIZATION: "IMMUNISATION",
  NUTRITION: "NUTRITION",
  MEDICINE_DISPENSING: "MEDICINE_DISPENSING",
  OTHER: "Other",
};

const SERVICE_TYPES = [
  { label: ServiceTypes.OPD, value: ServiceTypes.OPD },
  { label: ServiceTypes.ANC, value: ServiceTypes.ANC },
  { label: ServiceTypes.PNC, value: ServiceTypes.PNC },
  { label: ServiceTypes.DELIVERY, value: ServiceTypes.DELIVERY },
  { label: ServiceTypes.FAMILY_PLANNING, value: ServiceTypes.FAMILY_PLANNING },
  { label: ServiceTypes.IMMUNIZATION, value: ServiceTypes.IMMUNIZATION },
  { label: ServiceTypes.NUTRITION, value: ServiceTypes.NUTRITION },
  {
    label: ServiceTypes.MEDICINE_DISPENSING,
    value: ServiceTypes.MEDICINE_DISPENSING,
  },
  { label: ServiceTypes.OTHER, value: ServiceTypes.OTHER },
];

const LEVEL_OF_CARE = [
  { label: "Primary", value: "Primary" },
  { label: "Secondary", value: "Secondary" },
  { label: "Tertiary", value: "Tertiary" },
];

export const REFERRAL_IN = [
  {
    type: "select",
    label: "Provider",
    name: "referred_to_id",
    placeholder: "Select type of service",
    required: true,
  },
];

export const REFERRAL_OUT = [
  {
    type: "select",
    label: "Level of care",
    name: "levelOfCare",
    placeholder: "Select level of care",
    required: true,
    options: LEVEL_OF_CARE,
    showSearch: true,
  },

  {
    type: "select",
    label: "District Name",
    name: "district_id",
    placeholder: "Select district",
    required: true,
    showSearch: true,
  },

  {
    type: "select",
    label: "Facility Name",
    name: "facility_id",
    placeholder: "Select CEmONC facility",
    required: true,
    showSearch: true,
  },
  {
    label: "Type of service required",
    type: "select",
    name: "typeOfService",
    placeholder: "Select type of service",
    required: true,
    showSearch: true,
    options: SERVICE_TYPES,
  },
  {
    type: "input",
    label: "Reasons to refer out the patient",
    name: "refer_out_reason",
    placeholder: "Enter referral reason",
    required: true,
  },
];

export const getEligibleServices = (age: number, gender: string) => {
  const eligibilityRules = {
    ANC: { gender: "Female", minAge: 14, maxAge: 54 },
    PNC: { gender: "Female", minAge: 14, maxAge: 54 },
    Delivery: { gender: "Female", minAge: 14, maxAge: 54 },
    "Family Planning": { gender: "Female", minAge: 14, maxAge: 54 },
    Immunisation: { gender: "All", minAge: 0, maxAge: 5 }, // months converted to years
    Nutrition: { gender: "All", minAge: 0, maxAge: 54 },
    OPD: { gender: "All", minAge: 0, maxAge: 54 },
    "Medicine Dispensing": { gender: "All", minAge: null, maxAge: null },
  };

  return SERVICE_TYPES.filter((service) => {
    const rule =
      eligibilityRules[service.value as keyof typeof eligibilityRules];
    if (!rule) return true; // Include "Other" and unknown services

    const genderMatch = rule.gender === "All" || rule.gender === gender;
    const ageMatch =
      (rule.minAge === null || age >= rule.minAge) &&
      (rule.maxAge === null || age <= rule.maxAge);

    return genderMatch && ageMatch;
  });
};
