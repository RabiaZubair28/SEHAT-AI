import { VALIDATION_RANGES } from "../data/constants";
import { WARNING_MESSAGES } from "../data/warningMessages";
import { Gender } from "@/data/types";

type Height = {
  feet: number;
  inches: number;
};

export const calculateBMI = (
  weight: number,
  height?: Height | any,
): number | null => {
  if (!weight || !height || weight <= 0) {
    return null;
  }
  const feet = height.feet ?? 0;
  const inches = height.inches ?? 0;

  const totalInches = feet * 12 + inches;
  if (totalInches <= 0) {
    return null;
  }

  const heightInMeters = totalInches * 0.0254;
  const bmi = weight / heightInMeters ** 2;
  return Number(bmi.toFixed(1));
};

export const validateBMI = (
  weight?: number,
  height?: Height | null,
): string | undefined => {
  if (!height || height.feet == null || height.inches == null) {
    return undefined;
  }

  const bmi = calculateBMI(weight as number, height);

  if (!bmi) return undefined;

  const { low, high } = VALIDATION_RANGES.BMI;

  if (bmi >= high) {
    return WARNING_MESSAGES.HIGH_BMI_VITALS;
  }

  if (bmi <= low) {
    return WARNING_MESSAGES.LOW_BMI_VITALS;
  }

  return undefined;
};

export const calculateBMIUnderAge = (
  weight?: number,
  heightCm?: number,
): number | null => {
  if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
    return null;
  }

  const heightMeters = heightCm / 100; // convert cm → meters
  const bmi = weight / (heightMeters ** 2);
  return Number(bmi.toFixed(1));
};

export const validateBMIUnderAge = (height?: any, weight?: any) => {
  const bmi = calculateBMIUnderAge(weight, height);

  if (!bmi) return undefined;

  const { low, high } = VALIDATION_RANGES.BMI;

  if (bmi >= high) {
    return WARNING_MESSAGES.HIGH_BMI_VITALS;
  }

  if (bmi <= low) {
    return WARNING_MESSAGES.LOW_BMI_VITALS;
  }

  return undefined;
};
export const validateSystolicBloodPressure = (
  systolic?: number,
  // dystolic?: number
): string | null => {
  const { systolic: sysRange } = VALIDATION_RANGES.BLOOD_PRESSURE;

  if (systolic && (systolic >= sysRange.max || systolic <= sysRange.min)) {
    return WARNING_MESSAGES.ABNORMAL_BP;
  }

  return null;
};

export const validateDistolicBloodPressure = (
  dystolic?: number,
): string | null => {
  const { diastolic: diaRange } = VALIDATION_RANGES.BLOOD_PRESSURE;

  if (dystolic && (dystolic >= diaRange.max || dystolic < diaRange.min)) {
    return WARNING_MESSAGES.ABNORMAL_BP;
  }
  return null;
};

export const validateRespiratoryRate = (rate?: number): string | null => {
  const { min, max } = VALIDATION_RANGES.RESPIRATORY_RATE.normal;
  if (rate && (rate > max || rate < min)) {
    return WARNING_MESSAGES.RESPIRATORY_RATE;
  }
  return null;
};

export const validateBabyWeight = (weight?: number): string | null => {
  const { min } = VALIDATION_RANGES.BABY_WEIGHT;
  if (weight && weight < min) {
    return WARNING_MESSAGES.ABNORMAL_BABY_WEIGHT;
  }
  return null;
};

// Validate Temperature
export const validateTemperature = (
  temperature: number,
): string | undefined => {
  if (temperature > VALIDATION_RANGES.TEMPERATURE.normal.max) {
    return WARNING_MESSAGES.ABNORMAL_TEMPERATURE;
  }
  return undefined;
};

export const validateBabyTemperature = (
  temperature: number,
): string | undefined => {
  if (temperature <= VALIDATION_RANGES.TEMPERATURE_NEWBORN.normal.min) {
    return WARNING_MESSAGES.TEMPERATURE_NEWBORN_LOW;
  }

  if (temperature >= VALIDATION_RANGES.TEMPERATURE_NEWBORN.normal.max) {
    return WARNING_MESSAGES.TEMPERATURE_NEWBORN_HIGH;
  }

  return undefined;
};

// Validate Haemoglobin
export const validateAncHaemoglobin = (
  haemoglobin: number,
  trimester: "first" | "second" | "third",
): string | undefined => {
  const hbRanges = VALIDATION_RANGES.HAEMOGLOBIN_ANC;

  if (haemoglobin > hbRanges.max) {
    return WARNING_MESSAGES.HIGH_HB;
  }

  if (
    (trimester === "first" || trimester === "third") &&
    haemoglobin < hbRanges.firstTrimester.min
  ) {
    return WARNING_MESSAGES.LOW_HB;
  }

  if (trimester === "second" && haemoglobin < hbRanges.secondTrimester.min) {
    return WARNING_MESSAGES.LOW_HB;
  }

  return undefined;
};

export const validatePncHaemoglobin = (
  haemoglobin: number,
): string | undefined => {
  if (haemoglobin > VALIDATION_RANGES.HAEMOGLOBIN_PNC.high) {
    return WARNING_MESSAGES.HIGH_HB_PNC;
  }

  if (
    haemoglobin < VALIDATION_RANGES.HAEMOGLOBIN_PNC.low &&
    haemoglobin >= VALIDATION_RANGES.HAEMOGLOBIN_PNC.veryLow
  ) {
    return WARNING_MESSAGES.LOW_HB_PNC;
  }

  if (haemoglobin < VALIDATION_RANGES.HAEMOGLOBIN_PNC.veryLow) {
    return WARNING_MESSAGES.VERY_LOW_HB;
  }

  return undefined;
};

// Validate Fundal Height
export const validateFundalHeight = (
  fundalHeight: number,
  gestationalAge: number,
): string | undefined => {
  if (Math.abs(fundalHeight - gestationalAge) > 2) {
    return WARNING_MESSAGES.ABNORMAL_FUNDAL_HEIGHT;
  }
  return undefined;
};

export const validateAncBloodSugar = (
  rbs: number,
  isFirstVisit: boolean,
  gestationalAge: number,
): string | undefined => {
  if (rbs < VALIDATION_RANGES.BLOOD_SUGAR.min) {
    return WARNING_MESSAGES.LOW_RBS;
  }

  if (rbs > VALIDATION_RANGES.BLOOD_SUGAR.max && isFirstVisit) {
    return WARNING_MESSAGES.HIGH_RBS_FIRST_VISIT;
  }

  if (rbs > VALIDATION_RANGES.BLOOD_SUGAR.max && gestationalAge >= 24) {
    return WARNING_MESSAGES.HIGH_RBS_WITH_OGTT;
  }

  return undefined;
};

export const validatePncBloodSugar = (rbs: number): string | undefined => {
  if (rbs < VALIDATION_RANGES.BLOOD_SUGAR_PNC.min) {
    return WARNING_MESSAGES.LOW_RBS;
  } else if (rbs > VALIDATION_RANGES.BLOOD_SUGAR_PNC.max) {
    return WARNING_MESSAGES.HIGH_RBS_PNC;
  }

  return undefined;
};

export const validateBloodSugar = (rbs: number): string | undefined => {
  if (rbs < VALIDATION_RANGES.BLOOD_SUGAR.min) {
    return WARNING_MESSAGES.LOW_RBS;
  } else if (rbs > VALIDATION_RANGES.BLOOD_SUGAR.max) {
    return WARNING_MESSAGES.HIGH_RBS;
  }

  return undefined;
};

// Validate MUAC
export const validateMUAC = (muac: number): string | undefined => {
  if (muac < VALIDATION_RANGES.MUAC.normal.min) {
    return WARNING_MESSAGES.LOW_MUAC;
  }
  return undefined;
};

export const validateNutritionMUAC = (
  muac: number,
  age: number,
  gender?: Gender,
): string | undefined => {
  // --- For children under 5 years ---
  if (age < 5) {
    if (muac < 11.5) {
      return "Severe Acute Malnutrition (SAM) alert";
    } else if (muac >= 11.5 && muac <= 12.5) {
      return "Moderate Acute Malnutrition (MAM) alert";
    } else if (muac > 12.5) {
      return "Normal Counseling Alert - Counsel on healthy dietary practices and importance of clean drinking water";
    }
  }

  // --- For pregnant females ---
  if (gender === Gender.FEMALE) {
    if (muac < 19) {
      return "Severe Acute Malnutrition (SAM) alert";
    } else if (muac >= 19 && muac <= 22) {
      return "Moderate Acute Malnutrition (MAM) alert";
    } else if (muac > 22) {
      return "Normal Counseling Alert - Counsel on healthy dietary practices and importance of clean drinking water";
    }
  }

  return undefined; // no alert needed
};

export const validateMUACPNC = (muac: number): string | undefined => {
  if (muac < VALIDATION_RANGES.MUAC_PNC.normal.min) {
    return WARNING_MESSAGES.LOW_MUAC;
  }
  return undefined;
};

export const validateMUACNewborn = (muac: number): string | undefined => {
  if (muac < VALIDATION_RANGES.MUAC_NEWBORN.normal.min) {
    return WARNING_MESSAGES.MUAC_NEWBORN_LOW;
  }
  return undefined;
};

// Validate SpO2
export const validateSpO2 = (spo2: number): string | undefined => {
  if (spo2 < VALIDATION_RANGES.SPO2.normal.min) {
    return WARNING_MESSAGES.LOW_SPO2;
  }
  return undefined;
};

export const validateSpO2Delivery = (spo2: number): string | undefined => {
  if (spo2 < VALIDATION_RANGES.SPO2.normal_delivery.min) {
    return WARNING_MESSAGES.LOW_SPO2;
  }
  return undefined;
};

export const validateSpO2Pnc = (spo2: number): string | undefined => {
  if (spo2 < VALIDATION_RANGES.SPO2_PNC.normal.min) {
    return WARNING_MESSAGES.LOW_SPO2;
  }
  return undefined;
};

// Validate Pulse
export const validatePulse = (pulse: number): string | undefined => {
  const { min, max } = VALIDATION_RANGES.PULSE.normal;
  if (pulse > max || pulse < min) {
    return WARNING_MESSAGES.ABNORMAL_PULSE;
  }
  return undefined;
};

export const validatePulseDelivery = (pulse: number): string | undefined => {
  const { min, max } = VALIDATION_RANGES.PULSE_DELIVERY.normal;
  if (pulse > max || pulse < min) {
    return WARNING_MESSAGES.ABNORMAL_PULSE;
  }
  return undefined;
};

// Validate Pulse
export const validatePulseOpd = (pulse: number): string | undefined => {
  const { min, max } = VALIDATION_RANGES.PULSE_OPD.normal;
  if (pulse > max || pulse < min) {
    return WARNING_MESSAGES.ABNORMAL_PULSE;
  }
  return undefined;
};

export const validateVitalsPulse = (pulse: number): string | undefined => {
  const { min, max } = VALIDATION_RANGES.PULSE.normal;
  if (pulse > max || pulse < min) {
    return WARNING_MESSAGES.ABNORMAL_PULSE;
  }
  return undefined;
};

// validate Warning Signs
export const validateWarningSign = (
  warningSigns: string[],
): string | undefined => {
  if (!warningSigns || warningSigns.length === 0) return undefined;

  // Dynamic check every time: if "none" is selected, skip warning
  if (warningSigns.includes("None")) {
    return undefined;
  }

  // Any other warning selected → show warning
  if (warningSigns.length > 0) {
    return WARNING_MESSAGES.WARNING_SIGNS;
  }

  return undefined;
};

// Validate Previous Illness
export const validatePreviousIllness = (
  illnesses: string[],
): string | undefined => {
  if (!illnesses || illnesses.length === 0) return undefined;

  // Dynamic check every time: if "none" is selected, skip warning
  if (illnesses.includes("None")) {
    return undefined;
  }

  if (illnesses.length > 0) {
    return WARNING_MESSAGES.PREVIOUS_ILLNESS;
  }
  return undefined;
};

// Validate Past Obstetric Complication
export const validatePastObstetricComplication = (
  complications: string[],
): string | undefined => {
  if (!complications || complications.length === 0) return undefined;

  // Dynamic check every time: if "none" is selected, skip warning
  if (complications.includes("None")) {
    return undefined;
  }

  if (complications.length > 0) {
    return WARNING_MESSAGES.HIGH_RISK_REFER_CEMONC;
  }
  return undefined;
};

// Validate Screening Tests
export const validateScreening = (
  screened: boolean,
  type: "rubella" | "hepB" | "thalassemia" | "hiv" | "hepC",
): string | undefined => {
  if (screened === false) {
    switch (type) {
      case "rubella":
        return WARNING_MESSAGES.ADVISE_RUBELLA_SCREENING;
      case "hepB":
        return WARNING_MESSAGES.ADVISE_HEPB_SCREENING;
      case "thalassemia":
        return WARNING_MESSAGES.ADVISE_THALASSEMIA_SCREENING;
      case "hiv":
        return WARNING_MESSAGES.HIV_SCREENING;
      case "hepC":
        return WARNING_MESSAGES.ADVISE_HEPC_SCREENING;
    }
  }
  return undefined;
};

// Validate Positive Test Results
export const validatePositiveTest = (
  positive: boolean,
  type: "rubella" | "hepB" | "thalassemia" | "hiv" | "hepC",
): string | undefined => {
  if (positive === true) {
    switch (type) {
      case "rubella":
        return WARNING_MESSAGES.RUBELLA_POSITIVE;
      case "hepB":
        return WARNING_MESSAGES.HEPB_POSITIVE;
      case "thalassemia":
        return WARNING_MESSAGES.THALASSEMIA_POSITIVE;
      case "hiv":
        return WARNING_MESSAGES.HIV_POSITIVE;
      case "hepC":
        return WARNING_MESSAGES.HEPC_POSITIVE;
    }
  }
  return undefined;
};
