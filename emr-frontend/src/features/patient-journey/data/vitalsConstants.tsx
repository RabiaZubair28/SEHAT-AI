import {
  validateBMI,
  validateBMIUnderAge,
  validateDistolicBloodPressure,
  validatePulse,
  validateRespiratoryRate,
  validateSpO2,
  validateSystolicBloodPressure,
  validateTemperature,
} from "../utils/validationHelpers";
import {
  FAMILY_PLANNING_METHODS_VITALS,
  VALIDATION_RANGES,
  YES_NO_OPTIONS,
} from "./constants";
import { SERVICE_VALIDATION_RANGES, formatFeetInches } from "@/utils/helpers/serviceValidationRanges";

export const VITALS_FORM_FIELDS = [
  {
    tabKey: "1",
    title: "Vitals",
    fields: [
      {
        label: "Weight (kg)",
        name: "weight",
        type: "number",
        required: true,
        colSpan: 8,
        placeholder: "Enter weight",
        warningEnableCondition: (v: any) => {
          if (v?.patientAge > 14) {
            return validateBMI(v.weight, v.height);
          } else {
            return validateBMIUnderAge(v.height_cm, v.weight);
          }
        },
        rules: [
          ({ getFieldValue }: any) => ({
            validator(_: any, value: number) {
              const patientAge = getFieldValue("patientAge");
              const { min, max } =
                patientAge != null && patientAge < 14
                  ? VALIDATION_RANGES.WEIGHT_UNDER14
                  : VALIDATION_RANGES.WEIGHT;

              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error(`Weight must be between ${min} and ${max} kg`),
              );
            },
          }),
        ],
      },
      {
        label: "Height (feet and inches)",
        type: "compactfield",
        name: "height",
        required: true,
        visibleIf: (values: any) => {
          if (values?.patientAge >= 14) {
            return true;
          }

          return false;
        },
        warningEnableCondition: (v: any) => validateBMI(v.weight, v.height),
        subFields: [
          {
            name: "feet",
            placeholder: "Feet",
            min: 0,
            width: "70%",
          },
          {
            name: "inches",
            placeholder: "Inches",
            min: 0,
            width: "30%",
          },
        ],
        rules: [
          {
            validator: (_rule: any, value: any) => {
              if (!value) {
                return Promise.reject(new Error("Height is required"));
              }
              const { feet, inches } = value;

              if (feet === undefined || feet === null) {
                return Promise.reject(new Error("Feets is/are required"));
              }
              if (inches === undefined || inches === null) {
                return Promise.reject(new Error("Inches is/are required"));
              }
              if (feet > 12) {
                return Promise.reject(new Error("Feet must be 12 or less"));
              }
              if (inches > 11) {
                return Promise.reject(new Error("Inches must be 11 or less"));
              }

              const totalInches = feet * 12 + inches;
              const { inches: { min, max }, feetInches } = SERVICE_VALIDATION_RANGES.vitals.height;
              if (totalInches < min || totalInches > max) {
                return Promise.reject(
                  new Error(`Height must be between ${formatFeetInches(feetInches.min)} - ${formatFeetInches(feetInches.max)}`),
                );
              }

              return Promise.resolve();
            },
          },
        ],
      },

      {
        label: "Height (cm)",
        name: "height_cm",
        visibleIf: (values: any) => {
          if (values?.patientAge < 14) {
            return true;
          }
          return false;
        },
        warningEnableCondition: (v: any) => {
          return validateBMIUnderAge(v.height_cm, v.weight);
        },
        rules: [
          {
            validator: (_rule: any, value: any) => {
              // ✅ Do not validate when empty
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }

              const { min, max } = SERVICE_VALIDATION_RANGES.vitals.height.cm;

              if (value >= min && value <= max) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error(`Height must be between ${min} and ${max} cm`),
              );
            },
          },
        ],

        placeholder: "Enter height in cm",
        type: "number",
        colSpan: 8,
        required: true,
      },

      {
        label: "Body Mass Index (kg/m²)",
        name: "body_mass_index",
        placeholder: "Body Mass Index in kg/m²",
        type: "number",
        disabled: true,
        colSpan: 8,
        required: true,
      },

      {
        label: "Pulse (BPM)",
        type: "number",
        name: "pulse",
        required: true,
        colSpan: 8,
        placeholder: "Enter pulse rate",
        warningEnableCondition: (v: any) => validatePulse(v.pulse),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PULSE_VITALS.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pulse must be form ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Systolic BP (mmHg)",
        name: "systolic_bp",
        placeholder: "Enter systolic BP",
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolic_bp),
        colSpan: 8,
        type: "number",
        required: (values: any) => {
          return !(values?.age != null && values.age <= 14);
        },
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.systolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Systolic BP must be form ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Diastolic BP (mmHg)",
        placeholder: "Enter diastolic BP",
        warningEnableCondition: (v: any) =>
          validateDistolicBloodPressure(v.diastolic_bp),
        name: "diastolic_bp",
        colSpan: 8,
        required: (values: any) => {
          return !(values?.age != null && values.age <= 14);
        },
        type: "number",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.diastolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Diastolic BP must be form ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Temperature (°F)",
        type: "number",
        name: "temperature",
        warningEnableCondition: (v: any) => validateTemperature(v.temperature),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.TEMPERATURE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Temperature must be form ${min} to ${max} °F`),
              );
            },
          },
        ],

        required: true,
        colSpan: 8,
        placeholder: "Enter temperature",
      },

      {
        label: "Respiratory Rate",
        placeholder: "Enter respiratory rate",
        name: "respiratory_rate",
        warningEnableCondition: (v: any) =>
          validateRespiratoryRate(v?.respiratory_rate),
        colSpan: 8,
        required: true,
        type: "number",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.RESPIRATORY_RATE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(
                  `Respiratory rate must be form ${min} to ${max} per min`,
                ),
              );
            },
          },
        ],
      },
      {
        label: "SpO₂ (%)",
        required: false,
        colSpan: 8,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.SPO2_VITALS.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`SpO₂ rate must be form ${min}% to ${max}%`),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) => validateSpO2(v.spo2),
        type: "number",
        placeholder: "Enter SpO₂ (%)",
        name: "spo2",
      },
      { name: "age", type: "input", colSpan: 0, style: { display: "none" } },
    ],
  },
  {
    tabKey: "2",
    title: "General Screening",
    fields: [
      {
        label: "Is the patient anemic?",
        type: "radio",
        name: "is_anemic",
        required: false,
        placeholder: "Select yes or no",
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Is the patient dehydrated?",
        type: "radio",
        name: "is_dehydrated",
        required: false,
        placeholder: "Select yes or no",
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Level of deydration",
        type: "select",
        name: "dehydration_level",
        placeholder: "Select dehydration level",
        required: false,
        options: [
          { id: 1, value: "Mild" },
          { id: 2, value: "Moderate" },
          { id: 3, value: "Severe" },
        ],
        visibleIf: (values: any) => values?.is_dehydrated === true,
        colSpan: 8,
      },
      {
        label: "Cough (> 2 weeks)",
        type: "radio",
        name: "cough_gt_2_weeks",
        required: false,
        placeholder: "Select yes or no",
        colSpan: 8,
        options: YES_NO_OPTIONS,
      },

      {
        label: "Family Planning User",
        type: "radio",
        name: "family_planning_user",
        required: true,
        placeholder: "Select yes or no",
        options: YES_NO_OPTIONS,
        colSpan: 8,
        visibleIf: (values: any) => values?.maritalStatus === "Married",
      },
      {
        label: "Family Planning Method Used",
        name: "family_planning_methods",
        required: true,
        colSpan: 8,
        visibleIf: (values: any) => values?.family_planning_user == true,
        type: "multiselect",
        placeholder: "Select family planning method",
        options: FAMILY_PLANNING_METHODS_VITALS,
      },

      {
        type: "formList",
        name: "immunization_records",
        colSpan: 24,
        required: true,
        label: "Immunization Details",
        allowRemove: false,
        allowAdd: false,
        visibleIf: (_values: any) => false, // ES-801
        fields: [
          {
            label: "Vaccine name",
            type: "input",
            disabled: true,
            name: "vaccine",
            colSpan: 7,
            required: true,
          },

          {
            label: "Date of vaccine administration",
            name: "administration_date",
            type: "date",
            colSpan: 6,
            placeholder: "Select due date",
            allowFutureDates: false,
            disabled: (values: any, index: number) => {
              const record = values?.immunization_records?.[index];
              return (
                record?.isAlreadyAdministered ||
                record?.dosageStatus === "Administered" ||
                record?.dosageStatus === "Pending"
              );
            },
          },

          {
            label: "Administered",
            type: "singleCheckbox",
            name: "immunization_status",
            colSpan: 3,
            disabled: (values: any, index: number) => {
              const record = values?.immunization_records?.[index];
              const hasDate = record?.administration_date;
              if (record?.isAlreadyAdministered) return true;
              if (record?.dosageStatus === "Administered") return true;
              if (record?.dosageStatus === "Pending") return true;
              if (!hasDate) return true;

              return false;
            },
          },
          {
            type: "statusTag",
            name: "dosageStatus",
            colSpan: 3,
            required: false,
          },
        ],
      },
    ],
  },
];
