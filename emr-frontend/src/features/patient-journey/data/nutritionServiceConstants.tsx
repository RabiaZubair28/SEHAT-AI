import { TextFieldType } from "@/data/types";
import {
  validateDistolicBloodPressure,
  validateNutritionMUAC,
  validatePulse,
  validateSystolicBloodPressure,
  validateTemperature,
} from "../utils/validationHelpers";
import {
  EDEMA_OPTIONS,
  NUTRITION_COMPLICATIONS,
  PATIENT_ADDMISSION_REASONS,
  PATIENT_REFFERAL_OPTIONS,
  VALIDATION_RANGES,
  YES_NO_OPTIONS,
} from "./constants";
import { formatDosage } from "../utils/utilities";
import { filterFormListOptions } from "@/utils/helpers/formHelperMethods";
import { SERVICE_VALIDATION_RANGES, formatFeetInches } from "@/utils/helpers/serviceValidationRanges";
import { isSupplementOther } from "./moduleHelpers";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
}

export const createNutritionServiceFormFields = (
  supplementOptions: FormOption[] = [],
) => [
  {
    tabKey: "1",
    title: "Patient admission",
    fields: [
      {
        label: "Where is the patient coming from?",
        name: "patient_reffered_by",
        type: "select",
        required: true,
        placeholder: "Select referred by",
        options: PATIENT_REFFERAL_OPTIONS,
        colSpan: 12,
      },
      {
        label: "Reason for admission",
        name: "addmission_reason",
        type: "select",
        required: true,
        placeholder: "Select admission reason",
        options: PATIENT_ADDMISSION_REASONS,
        colSpan: 12,
      },
      { name: "age", type: "input", colSpan: 0, style: { display: "none" } },
    ],
  },

  {
    title: "Vitals & Assessment",
    tabKey: "2",
    fields: [
      {
        label: "Weight (kg)",
        name: "weight",
        type: "number",
        required: true,
        colSpan: 8,
        placeholder: "Enter weight",
        rules: [
          ({ getFieldValue }: any) => ({
            validator(_: any, value: number) {
              const age = getFieldValue("age");
              const { min, max } =
                age != null && age < 14
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
                return Promise.reject(new Error("Feet is required"));
              }
              if (inches === undefined || inches === null) {
                return Promise.reject(new Error("Inches is required"));
              }
              if (feet > 12) {
                return Promise.reject(new Error("Feet must be 12 or less"));
              }
              if (inches > 11) {
                return Promise.reject(new Error("Inches must be 11 or less"));
              }

              const totalInches = feet * 12 + inches;
              const { inches: { min, max }, feetInches } = SERVICE_VALIDATION_RANGES.nutrition.height;
              if (totalInches < min || totalInches > max) {
                return Promise.reject(
                  new Error(`Height must be between ${formatFeetInches(feetInches.min)} and ${formatFeetInches(feetInches.max)}`),
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

        rules: [
          {
            validator: (_rule: any, value: any) => {
              // ✅ Do not validate when empty
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }

              const { min, max } = SERVICE_VALIDATION_RANGES.nutrition.height.cm;

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
        label: "Systolic BP",
        name: "systolic_bp",
        placeholder: "Enter systolic BP",
        rules: [
          {
            validator: (_: any, value: number) => {
              if (!value || (value >= 50 && value <= 300)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Systolic bp must be between 50 mmHg to 300 mmHg"),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolic_bp),
        colspan: 8,
        type: "number",
        required: (values: any) => {
          return !(values?.age != null && values.age <= 14);
        },
      },
      {
        label: "Diastolic BP",
        placeholder: "Enter diastolic BP",
        warningEnableCondition: (v: any) =>
          validateDistolicBloodPressure(v.diastolic_bp),
        rules: [
          {
            validator: (_: any, value: number) => {
              if (!value || (value >= 20 && value <= 200)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Diastolic bp must be between 20 mmHg to 200 mmHg"),
              );
            },
          },
        ],
        name: "diastolic_bp",
        colspan: 8,
        type: "number",
        required: (values: any) => {
          return !(values?.age != null && values.age <= 14);
        },
      },
      {
        label: "Temperature (°F)",
        name: "temperature",
        type: "number",
        required: true,
        placeholder: "Enter temperature",
        warningEnableCondition: (v: any) => validateTemperature(v.temperature),
        colspan: 8,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.TEMPERATURE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Temperature must be from ${min} to ${max} °F`),
              );
            },
          },
        ],
      },
      {
        label: "Pulse (BPM)",
        required: true,
        colSpan: 8,
        warningEnableCondition: (v: any) => validatePulse(v.pulse),
        type: "number",
        placeholder: "Enter pulse (BPM)",
        name: "pulse",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PULSE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pulse must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "MUAC (cm)",
        required: true,
        colSpan: 8,
        visibleIf: (values: any) =>
          (values?.age != null && values.age < 5) ||
          values?.gender === "Female",
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.MUAC_NUTRITION.possible.min &&
                value <= VALIDATION_RANGES.MUAC_NUTRITION.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                return Promise.reject(
                  new Error(
                    `Muac must be between ${VALIDATION_RANGES.MUAC_NUTRITION.possible.min} - ${VALIDATION_RANGES.MUAC_NUTRITION.possible.max} cm`,
                  ),
                );
              }
              return Promise.resolve();
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateNutritionMUAC(v.muac, v?.age, v.gender),
        type: "number",
        placeholder: "Enter MUAC (cm)",
        name: "muac",
      },
      {
        label: "Edema",
        name: "edema",
        type: "select",
        required: true,
        placeholder: "Select edema",
        options: EDEMA_OPTIONS,
        colSpan: 16,
      },
      {
        label: "Is the patient experiencing any complications?",
        name: "patient_complications",
        type: "radio",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 12,
      },

      {
        label: "Select Complication",
        name: "patient_selected_complications",
        type: "multiselect",
        visibleIf: (values: any) => values?.patient_complications === true,
        required: true,
        placeholder: "Select patient complications",
        options: NUTRITION_COMPLICATIONS,
        colSpan: 12,
      },
    ],
  },
  {
    tabKey: "3",
    title: "Supplements",
    fields: [
      {
        label: "Are you prescribing any supplements to the patient?",
        type: "radio",
        name: "supplements_prescribed",
        colSpan: 24,
        required: true,
        placeholder: "Select supplements",
        options: YES_NO_OPTIONS,
      },
      {
        type: "formList",
        name: "supplements",
        colSpan: 24,
        disabled: false,
        label: "Supplements",
        visibleIf: (values: any) => values?.supplements_prescribed === true,
        // required: true,
        fields: [
          {
            name: "supplementName",
            label: "Name of supplement",
            type: "select",
            placeholder: "Select supplements type",
            colSpan: 6,
            required: true,
            options: (formValues: any, rowIndex: any) => {
              return filterFormListOptions(
                supplementOptions,
                formValues,
                "supplements",
                "supplementName",
                rowIndex,
              );
            },
          },
          {
            label: "Other supplement",
            name: "other_supplement",
            type: "input",
            inputType: TextFieldType.Text,
            placeholder: "Specify other supplement",
            required: true,
            colSpan: 6,
            visibleIf: (values: any, fieldIndex: number) => {
              return isSupplementOther(
                values,
                fieldIndex,
                "supplements",
                "supplementName",
              );
            },
          },
          {
            name: "supplementDosage",
            label: "Dosage per day",
            type: "maskedInput",
            required: true,
            pattern: "0-0-0",
            colSpan: 6,
            placeholder: "0-0-0",
            rules: [
              {
                validator: (_: any, value: string) => {
                  if (!value) return Promise.resolve();

                  const isValid = formatDosage(value);
                  if (!isValid) return Promise.reject("Format must be 0-0-0");

                  // Split the dosage pattern
                  const parts = value.split("-");

                  // Check if any part > 2
                  const exceedsLimit = parts.some((num) => Number(num) > 2);
                  if (exceedsLimit)
                    return Promise.reject("Dosage must not exceed 2");

                  return Promise.resolve();
                },
              },
            ],
          },
        ],
      },
      {
        label: "Special instructions",
        name: "supplementsInstrction",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Enter instructions",
        required: false,
        colSpan: 24,
        visibleIf: (values: any) => {
          return values?.supplements_prescribed === true;
        },
      },
    ],
  },
  {
    tabKey: "4",
    title: "Counseling",
    fields: [
      {
        label: "Did you counsel the patient on nutrition and home-made diet?",
        name: "counsling_status",
        type: "radio",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 24,
      },
    ],
  },
];
