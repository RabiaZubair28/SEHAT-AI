import { TextFieldType } from "@/data/types";
import { createRowIdGenerator } from "@/utils/helpers/rowId";

const ancMedicineRow = createRowIdGenerator();

import {
  ALLERGY_TYPE_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  CTG_REACTIVITY_OPTIONS,
  CTGReactivity,
  FAMILY_PLANNING_METHOD_OPTIONS,
  FETAL_ATTITUDE_OPTIONS,
  FETAL_MOVEMENT_OPTIONS,
  FETAL_PRESENTATION_OPTIONS,
  FetalMovement,
  FetalPresentation,
  LAB_TEST_TYPE_OPTIONS,
  MODE_OF_DELIVERY_OPTIONS,
  PAST_OBSTETRIC_COMPLICATION_OPTIONS,
  PLACE_OF_DELIVERY_OPTIONS,
  PLACENTA_POSITION_OPTIONS,
  PREGNANCY_COMPLICATION_OPTIONS,
  PREGNANCY_OUTCOME_OPTIONS,
  PREGNANCY_TYPE_OPTIONS,
  PregnancyType,
  PREVIOUS_ILLNESS_OPTIONS,
  ULTRASOUND_FINDING_OPTIONS,
  URGENCY_OPTIONS,
  URINE_ALBUMIN_OPTIONS,
  UrineAlbuminResult,
  VALIDATION_RANGES,
  WARNING_SIGNS_ANC,
  YES_NO_OPTIONS,
} from "./constants";
import {
  validateAncBloodSugar,
  validateAncHaemoglobin,
  validateDistolicBloodPressure,
  validateSystolicBloodPressure,
  validateBMI,
  validateFundalHeight,
  validateMUAC,
  validatePastObstetricComplication,
  validatePositiveTest,
  validatePreviousIllness,
  validatePulse,
  validateScreening,
  validateSpO2,
  validateTemperature,
  validateWarningSign,
  validateRespiratoryRate,
  validateBMIUnderAge,
} from "../utils/validationHelpers";
import { SERVICE_VALIDATION_RANGES, formatFeetInches } from "@/utils/helpers/serviceValidationRanges";
import { WARNING_MESSAGES } from "./warningMessages";
import { formatDosage } from "../utils/utilities";
import dayjs from "dayjs";
import { isMedicineOther, isSupplementOther } from "./moduleHelpers";
import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
}


/**
 * ES-781
 *
 * `isServiceCompleted` means the ANC visit was already submitted, and we are now in
 * edit mode. It disables exactly the prescription, supplement and vaccine fields,
 *
 */
export const createFormFieldsANC = (
  medicineOptions: FormOption[] = [],
  paginationProps: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
  supplementOptions: FormOption[] = [],
  isServiceCompleted: boolean,
  tdVaccines: any[] = [],
  hasLmpAleady?: boolean,
) => [
  {
    tabKey: "1",
    title: "Pregnancy Info",
    fields: [
      {
        label: "Last Menstrual Period (LMP)",
        name: "lmp",
        type: "date",
        required: true,
        disabled: hasLmpAleady,
        colSpan: 8,
        rules: [
          {
            validator: (_: any, value: any) => {
              if (!value) return Promise.resolve();

              const selected = dayjs(value); // convert!
              const nineMonthsAgo = dayjs().subtract(10, "month");

              if (selected.isBefore(nineMonthsAgo)) {
                return Promise.reject("LMP cannot be older than 10 months");
              }

              return Promise.resolve();
            },
          },
        ],
      },
      {
        label: "Reason for edit",
        type: "select",
        name: "reason_for_edit",
        placeholder: "Select reason",
        visibleIf: (values: any) => {
          return values?.serviceCompleted && values?.serviceCompleted === true;
        },
        options: [
          { id: 1, value: "Changing current LMP" },
          { id: 1, value: "Adding LMP for a new pregnancy" },
        ],
        required: true,
        colSpan: 8,
      },
      {
        label: "Gestational age",
        type: "number",
        name: "gestational_age",
        required: true,
        disabled: true,
        colSpan: 8,
        placeholder: "Enter gestational age",
      },
      {
        label: "Gravidity",
        type: "number",
        name: "gravidity",
        maxLength: 2,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.GRAVIDITY;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Gravidity must be from ${min} to ${max}`),
              );
            },
          },
        ],
        required: true,
        colSpan: 8,
        placeholder: "Enter gravidity",
      },
      {
        label: "Parity",
        type: "number",
        name: "parity",
        required: true,
        colSpan: 8,
        placeholder: "Enter parity",
        rules: [
          ({ getFieldValue }: any) => ({
            validator(_: any, value: number) {
              const gravidity = getFieldValue("gravidity");
              if (!value || !gravidity || value < gravidity) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Parity must be less than gravidity"),
              );
            },
          }),
        ],
      },
      {
        label: "Abortion",
        type: "number",
        name: "abortion",
        required: true,
        disabled: true,
        colSpan: 8,
        placeholder: "Enter abortion count",
      },
      {
        label: "Expected Date of Delivery",
        name: "edd",
        type: "date",
        disabled: true,
        required: true,
        colSpan: 8,
        placeholder: "Select Expected Date ",
      },
      {
        label: "Trimester",
        type: "input",
        inputType: TextFieldType.Text,
        name: "trimester",
        required: true,
        disabled: true,
        colSpan: 8,
        placeholder: "Trimester",
      },
      {
        type: "table",
        name: "previousPregnancies", // This will be an array!
        tableTitle: "Enter previous pregnancy records",
        titlePrefix: "Pregnancy",
        showSummary: true,
        // Calculate how many rows to show based on gravidity
        dataCount: (formValues: any) => {
          const gravidity = formValues?.gravidity || 0;
          return gravidity > 1 && gravidity <= 20 ? gravidity - 1 : 0;
        },
        // Define fields for each row - simple field names!
        getGroupFields: () => {
          return [
            {
              label: "Place of delivery",
              type: "select",
              name: "place_of_delivery",
              placeholder: "Select Place",
              required: true,
              options: PLACE_OF_DELIVERY_OPTIONS,
              colSpan: 6,
            },
            {
              label: "Outcome",
              type: "select",
              name: "outcome",
              placeholder: "Select Outcome",
              required: true,
              options: PREGNANCY_OUTCOME_OPTIONS,
              colSpan: 6,
            },
            {
              label: "Mode of delivery",
              type: "select",
              name: "mode_of_delivery",
              placeholder: "Select Mode",
              required: true,
              options: MODE_OF_DELIVERY_OPTIONS,
              colSpan: 6,
            },
            {
              label: "Complications",
              type: "multiselect",
              name: "complication",
              placeholder: "Select Complication",
              required: true,
              options: PREGNANCY_COMPLICATION_OPTIONS,
              colSpan: 6,
            },
            {
              label: "Other",
              name: "otherComplication",
              inputType: TextFieldType.Text,
              visibleIf: (values: any, idx: number) => {
                const complications =
                  values?.previousPregnancies?.[idx]?.complication;
                return complications?.includes("Other");
              },
              type: "input",
              placeholder: "Enter other complication",
              required: true,
              colSpan: 6,
            },
          ];
        },
      },
    ],
  },

  {
    tabKey: "2",
    title: "Medical and Surgical History",
    fields: [
      {
        label: "History of previous illness",
        type: "multiselect",
        name: "previousIllness",
        required: true,
        placeholder: "Select previous illness",
        warningEnableCondition: (v: any) =>
          validatePreviousIllness(v?.previousIllness),
        options: PREVIOUS_ILLNESS_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Past obstetric complication",
        type: "multiselect",
        name: "past_obstetric_complication",
        warningEnableCondition: (v: any) =>
          validatePastObstetricComplication(v.past_obstetric_complication),
        required: true,
        placeholder: "Select Past obstetric complication",
        options: PAST_OBSTETRIC_COMPLICATION_OPTIONS,
        colSpan: 8,
      },
      {
        label: "History of previous surgery",
        type: "radio",
        name: "previous_surgery",
        placeholder: "Select surgery details",
        required: false,
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Specify previous surgery",
        inputType: TextFieldType.Text,
        visibleIf: (values: any) => values?.previous_surgery === true,
        type: "input",
        name: "previous_surgery_details",
        colSpan: 8,
        required: false,
        placeholder: "Enter previous Surgery",
      },
      {
        label: "History of previous medication",
        type: "radio",
        name: "previous_medication",
        placeholder: "Select Previous Medication",
        options: YES_NO_OPTIONS,
        colSpan: 8,
        required: false,
      },
      {
        label: "Specify previous medication",
        inputType: TextFieldType.Text,
        type: "input",
        name: "previous_medication_details",
        visibleIf: (values: any) => values?.previous_medication === true,
        colSpan: 8,
        placeholder: "Specify medication",
        required: false,
      },
      {
        label: "Allergies",
        type: "radio",
        name: "known_allergies",
        placeholder: "Select Allergies",
        options: YES_NO_OPTIONS,
        colSpan: 8,
        required: false,
      },
      {
        label: "Specify known allergies",
        type: "multiselect",
        name: "allergy_details",
        visibleIf: (values: any) => values?.known_allergies === true,
        options: ALLERGY_TYPE_OPTIONS,
        colSpan: 8,
        placeholder: "Specify allergies",
        required: false,
      },
      {
        label: "Has the patient used any FP methods previously?",
        type: "radio",
        name: "used_family_planning",
        placeholder: "Select FP methods used",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Specify FP method",
        type: "multiselect",
        name: "family_planning_methods",
        placeholder: "Select FP method",
        visibleIf: (values: any) => values?.used_family_planning === true,
        required: true,
        options: FAMILY_PLANNING_METHOD_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Has the patient received any blood transfusion previously?",
        type: "radio",
        required: true,
        placeholder: "Select blood transfusion",
        name: "prior_blood_transfusion",
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
    ],
  },
  {
    tabKey: "3",
    title: "Vitals & Screenings",
    fields: [
      {
        type: "label",
        label: "Vitals",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)", // use CSS variable here
      },
      {
        label: "Weight (kg)",
        name: "weight",
        type: "number",
        required: true,
        colSpan: 8,
        placeholder: "Enter weight",
        warningEnableCondition: (v: any) => {
          if (v?.patientAge >= 14) {
            return validateBMI(v.weight, v.height);
          } else {
            return validateBMIUnderAge(v.height_cm, v.weight);
          }
        },
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.WEIGHT;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Weight must be between ${min} and ${max} kg`),
              );
            },
          },
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
              const { inches: { min, max }, feetInches } = SERVICE_VALIDATION_RANGES.anc.height;
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

              const { min, max } = SERVICE_VALIDATION_RANGES.anc.height.cm;

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
        label: "Body Mass Index (kg/m^2)",
        name: "body_mass_index",
        placeholder: "Enter Body Mass Index",
        type: "number",
        disabled: true,
        colSpan: 8,
        required: true,
      },
      {
        name: "change_in_weight",
        label: "Change in weight (kg)",
        placeholder: "Enter change in weight (kg)",
        type: "number",
        disabled: true,
        colSpan: 8,
        required: true,
      },
      {
        label: "Systolic BP",
        name: "systolic_bp",
        placeholder: "Enter systolic BP",
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolic_bp),
        colSpan: 8,
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
        type: "number",
        required: true,
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
                new Error("Systolic bp must be between 20 mmHg to 200 mmHg"),
              );
            },
          },
        ],
        name: "diastolic_bp",
        colSpan: 8,
        required: true,
        type: "number",
      },
      {
        label: "Respiratory rate",
        name: "respiratory_rate",
        placeholder: "Enter respiratory rate",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.RESPIRATORY_RATE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Respiratory should be between 5–60 breaths/min"),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateRespiratoryRate(v.respiratory_rate),
        colSpan: 8,
        type: "number",
        required: true,
      },
      {
        label: "Temperature (°F)",
        name: "temperature",
        type: "number",
        required: true,
        placeholder: "Enter temperature",
        warningEnableCondition: (v: any) => validateTemperature(v.temperature),
        colSpan: 8,
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
        label: "Blood group",
        type: "select",
        name: "blood_group",
        required: false,
        colSpan: 8,
        placeholder: "Select blood group",
        options: BLOOD_GROUP_OPTIONS,
      },
      {
        type: "label",
        label: "Screenings",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)", // use CSS variable here
      },
      {
        label: "Haemoglobin (g/dL)",
        placeholder: "Enter haemoglobin",
        type: "number",
        required: true,
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.HAEMOGLOBIN_ANC.possible.min &&
                value <= VALIDATION_RANGES.HAEMOGLOBIN_ANC.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `Haemoglobin must be between ${VALIDATION_RANGES.HAEMOGLOBIN_ANC.possible.min} - ${VALIDATION_RANGES.HAEMOGLOBIN_ANC.possible.max} g/DL`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateAncHaemoglobin(v.haemoglobin, v.trimester),
        colSpan: 8,
        name: "haemoglobin",
      },
      {
        label: "Fundal height (cm)",
        placeholder: "Enter Fundal height (cm)",
        type: "number",
        required: true,
        visibleIf: (v: any) => {
          return v?.gestational_age && v?.gestational_age > 20;
        },
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >=
                  VALIDATION_RANGES.FUNDAL_HEIGHT_VITALS_ASSESSMENT.min &&
                value <= VALIDATION_RANGES.FUNDAL_HEIGHT_VITALS_ASSESSMENT.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `Fundal height must be between ${VALIDATION_RANGES.FUNDAL_HEIGHT_VITALS_ASSESSMENT.min} - ${VALIDATION_RANGES.FUNDAL_HEIGHT_VITALS_ASSESSMENT.max} cm`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateFundalHeight(v.fundal_height, v.gestational_age),
        colSpan: 8,
        name: "fundal_height",
      },
      {
        label: "Blood Sugar (Random) mg/dL",
        type: "number",
        required: true,
        rules: [
          {
            validator: (_: any, value: any) => {
              const num = Number(value);

              // if empty, skip (required rule will handle missing)
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }

              if (Number.isNaN(num)) {
                return Promise.reject(
                  new Error("Blood Sugar must be a number"),
                );
              }

              if (num < 50 || num > 600) {
                return Promise.reject(
                  new Error(
                    "Blood Sugar (Random) must be between 50 and 600 mg/dL",
                  ),
                );
              }

              return Promise.resolve();
            },
          },
        ],

        colSpan: 8,
        visibleIf: (v: any) => {
          return v?.hasPreviousVisit === false && v.gestational_age > 24;
        },
        warningEnableCondition: (v: any) =>
          validateAncBloodSugar(
            Number(v.blood_sugar_random),
            v?.hasPreviousVisit,
            Number(v?.gestational_age),
          ),
        placeholder: "Enter Blood Sugar (Random) mg/dL",
        name: "blood_sugar_random",
      },
      {
        label: "Albumin on urine dipstick",
        type: "select",
        name: "albumin_urine_dipstick",
        visibleIf: (v: any) => {
          return v.gestational_age && v.gestational_age > 24;
        },
        warningEnableCondition: (v: any) => {
          if (
            v?.albumin_urine_dipstick &&
            v?.albumin_urine_dipstick === UrineAlbuminResult.POSITIVE
          )
            return WARNING_MESSAGES.HIGH_ALBUMIN;
        },
        required: true,
        placeholder: "Select Albumin Urine",
        colSpan: 8,
        options: URINE_ALBUMIN_OPTIONS,
      },
      {
        label: "MUAC (cm)",
        required: true,
        colSpan: 8,
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.MUAC_ANC.possible.min &&
                value <= VALIDATION_RANGES.MUAC_ANC.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `MUAC must be between ${VALIDATION_RANGES.MUAC_ANC.possible.min} - ${VALIDATION_RANGES.MUAC_ANC.possible.max} cm`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
        warningEnableCondition: (v: any) => validateMUAC(v.muac),
        type: "number",
        placeholder: "Enter MUAC (cm)",
        name: "muac",
      },
      {
        label: "SpO₂ (%)",
        required: true,
        colSpan: 8,
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.SPO2.possible.min &&
                value <= VALIDATION_RANGES.SPO2.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `SpO₂ must be between ${VALIDATION_RANGES.SPO2.possible.min} - ${VALIDATION_RANGES.SPO2.possible.max} %`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
        warningEnableCondition: (v: any) => validateSpO2(v.spo2),
        type: "number",
        placeholder: "Enter SpO₂ (%)",
        name: "spo2",
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
        label: "Warning sign(s)",
        type: "multiselect",
        required: true,
        warningEnableCondition: (v: any) =>
          validateWarningSign(v.warning_signs),
        placeholder: "Select warning sign",
        name: "warning_signs",
        options: WARNING_SIGNS_ANC,
      },
    ],
  },
  {
    tabKey: "4",
    title: "Ultrasound and CTG",
    fields: [
      {
        label: "Does the patient require an ultrasound?",
        type: "radio",
        placeholder: "Select",
        name: "ultrasound_require",
        options: YES_NO_OPTIONS,
        required: true,
      },
      {
        label: "Ultrasound machine available?",
        type: "radio",
        placeholder: "Select Avalibility",
        name: "ultrasoundMachineAvailable",
        visibleIf: (v: any) => {
          return v?.ultrasound_require && v?.ultrasound_require === true;
        },
        options: YES_NO_OPTIONS,
        required: true,
      },
      {
        label: "Type of pregnancy",
        type: "select",
        name: "typeOfPregnancy",
        warningEnableCondition: (v: any) => {
          if (v?.typeOfPregnancy && v?.typeOfPregnancy !== PregnancyType.SINGLE)
            return WARNING_MESSAGES.HIGH_RISK_REFER_CEMONC;
        },
        required: true,
        placeholder: "Select Type Of Pregnancy",
        options: PREGNANCY_TYPE_OPTIONS,
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            v?.ultrasoundMachineAvailable === true
          );
        },
      },
      {
        label: "Fetal Movement",
        type: "select",
        name: "fetalMovement",
        required: true,
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        warningEnableCondition: (v: any) => {
          if (v?.fetalMovement === FetalMovement.ABSENT) {
            return WARNING_MESSAGES.NO_FETAL_MOVEMENT;
          }
        },
        placeholder: "Select Fetal",
        options: FETAL_MOVEMENT_OPTIONS,
      },
      {
        label: "Presentation of fetus",
        type: "select",
        name: "fetalPresentation",
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        warningEnableCondition: (v: any) => {
          if (
            v?.fetalPresentation &&
            v?.fetalPresentation !== FetalPresentation.LONGITUDINAL &&
            v?.fetalPresentation !== FetalPresentation.CEPHALIC
          )
            return WARNING_MESSAGES.HIGH_RISK_REFER_CEMONC;
        },
        placeholder: "Select presentation of fetus",
        required: true,
        options: FETAL_PRESENTATION_OPTIONS,
      },
      {
        label: "Attitude",
        type: "select",
        name: "attitude",
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        placeholder: "Select Attitude",
        required: true,
        options: FETAL_ATTITUDE_OPTIONS,
      },
      {
        label: "Placenta",
        type: "select",
        name: "placentaPosition",
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        placeholder: "Select Placenta",
        required: true,
        options: PLACENTA_POSITION_OPTIONS,
      },
      {
        label: "Amniotic Fluid Index",
        type: "number",
        rules: [
          {
            type: "number",
            min: 0,
            max: 40,
            message: "Amniotic Fluid Index must be between 0 and 40",
          },
        ],
        required: true,
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        warningEnableCondition: (v: any) => {
          const { min, max } = VALIDATION_RANGES.AMNIOTIC_FLUID_INDEX.normal;
          if (
            (v.amnioticFluidIndex && v.amnioticFluidIndex < min) ||
            v.amnioticFluidIndex > max
          )
            return WARNING_MESSAGES.ABNORMAL_AMNIOTIC_FLUID;
        },
        placeholder: "Enter Amniotic Fluid Index",
        name: "amnioticFluidIndex",
      },
      {
        label: "Fetal heart rate (bpm)",
        type: "number",
        placeholder: "Enter Fetal heart rate (bpm)",
        rules: [
          {
            validator: (_: any, value: any) => {
              // If no value is entered, skip this check (required rule handles emptiness)
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }

              const numValue = Number(value);

              // Range check
              if (numValue < 60 || numValue > 220) {
                return Promise.reject(
                  new Error("Fetal heart rate must be between 60 and 220 bpm"),
                );
              }

              return Promise.resolve();
            },
          },
        ],
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        warningEnableCondition: (v: any) => {
          const { min, max } = VALIDATION_RANGES.FETAL_HEART_RATE.normal;
          if (
            (v.fetalHeartRate && v.fetalHeartRate < min) ||
            v.fetalHeartRate > max
          )
            return WARNING_MESSAGES.ABNORMAL_FETAL_HEART_RATE;
        },
        name: "fetalHeartRate",
        required: true,
      },
      {
        label: "Fundal height (cm)",
        type: "number",
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        rules: [
          {
            validator: (_: any, value: any) => {
              // If no value is entered, skip this check (required rule handles emptiness)
              if (value === undefined || value === null || value === "") {
                return Promise.resolve();
              }

              const numValue = Number(value);

              // Range check
              if (numValue < 12 || numValue > 40) {
                return Promise.reject(
                  new Error("Fundal height must be in range 12–40 cm"),
                );
              }

              return Promise.resolve();
            },
          },
        ],
        placeholder: "Enter Fundal height (cm)",
        name: "fundalHeightUltrasound",
        required: true,
      },
      {
        label: "Ultrasound reporting",
        type: "multiselect",
        name: "ultrasoundReporting",
        required: true,
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        placeholder: "Select ultrasound reporting",
        options: ULTRASOUND_FINDING_OPTIONS,
      },
      {
        label: "Observations from ultrasound",
        type: "input",
        visibleIf: (v: any) => {
          return (
            v?.ultrasoundMachineAvailable &&
            [
              PregnancyType.SINGLE,
              PregnancyType.TWINS,
              PregnancyType.TRIPLETS,
            ].includes(v?.typeOfPregnancy)
          );
        },
        required: false,
        inputType: TextFieldType.Text,
        placeholder: "Enter observations from ultrasounds",
        name: "ultrasoundObservations",
      },
      {
        label: "Does the patient require a CTG?",
        type: "radio",
        required: true,
        // placeholder: "Select Cardiotocography (CTG) machine availablity",
        name: "requiresCtg",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Cardiotocography (CTG) machine available",
        type: "radio",
        required: true,
        visibleIf: (v: any) => {
          return v?.requiresCtg === true;
        },
        placeholder: "Select Cardiotocography (CTG) machine availablity",
        name: "ctgMachineAvailable",
        options: YES_NO_OPTIONS,
      },
      {
        label: "CTG Reporting",
        type: "select",
        name: "ctgReactivity",
        visibleIf: (v: any) => {
          return v?.ctgMachineAvailable === true;
        },
        warningEnableCondition: (v: any) => {
          if (v.ctgReactivity === CTGReactivity.SUSPICIOUS)
            return WARNING_MESSAGES.SUSPICIOUS_CTG;
          else if (v.ctgReactivity === CTGReactivity.ABNORMAL_NON_REACTIVE)
            return WARNING_MESSAGES.ABNORMAL_CTG;
        },
        required: true,
        placeholder: "Select CTG Reporting",
        options: CTG_REACTIVITY_OPTIONS,
      },
      {
        label: "Observations from CTG",
        type: "input",
        inputType: TextFieldType.Text,
        visibleIf: (v: any) => {
          return v?.ctgMachineAvailable === true;
        },
        name: "ctgObservations",
        required: false,
        placeholder: "Enter Observations from CTG",
      },
    ],
  },
  {
    tabKey: "5",
    title: "Diagnostics and Prescriptions",
    fields: [
      {
        label: "Are you prescribing any supplements to the patient?",
        type: "radio",
        name: "supplements_prescribed",
        disabled: isServiceCompleted,
        colSpan: 24,
        required: true,
        placeholder: "Select supplements",
        options: YES_NO_OPTIONS,
      },
      {
        type: "formList",
        name: "supplements",
        colSpan: 24,
        allowAdd: !isServiceCompleted,
        allowRemove: !isServiceCompleted,
        disabled: false,
        initialValue: [{}],
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
            disabled: isServiceCompleted,
            options: (formValues: any, fieldIndex: any) => {
              return filterFormListOptions(
                supplementOptions,
                formValues,
                "supplements",
                "supplementName",
                fieldIndex,
              );
            },
          },
          {
            label: "Other supplement",
            name: "other_supplement",
            type: "input",
            inputType: TextFieldType.Text,
            disabled: isServiceCompleted,
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
            disabled: isServiceCompleted,
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
                    return Promise.reject("dosage must not exceed 2");

                  return Promise.resolve();
                },
              },
            ],
          },
        ],
      },
      {
        label: "Special instructions",
        name: "supplementInstruction",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Enter instructions",
        required: false,
        colSpan: 24,
        visibleIf: (values: any) => {
          return values?.supplements_prescribed === true;
        },
      },
      {
        type: "table",
        name: "previousPrescriptions",
        tableTitle: "Prescribed Prescriptions",
        titlePrefix: "Prescription",
        showSummary: true,
        disabled: true,

        dataCount: (formValues: any) =>
          formValues?.previousPrescriptions?.length || 0,

        getGroupFields: (index: number, formValues: any) => {
          const row = formValues?.previousPrescriptions?.[index] || {};
          const category = row?.category?.toLowerCase();
          const isSupplement = category === "supplement";
          const isContraceptive = row?.isContraceptive;
          const formOfMedicine = row?.formOfMedicine;

          return [
            // ---------------- NAME ----------------
            {
              label: isSupplement ? "Supplement Name" : "Medicine Name",
              type: "input",
              inputType: TextFieldType.Text,
              name: isSupplement ? "supplementName" : "medicineName",
              disabled: true,
              visibleIf: () => !isContraceptive,
            },

            {
              label: "Method Name",
              type: "input",
              inputType: TextFieldType.Text,
              name: "method_name",
              disabled: true,
              visibleIf: () => isContraceptive,
            },

            // ---------------- STRENGTH (MEDICINE ONLY) ----------------
            {
              label: "Strength",
              type: "input",
              inputType: TextFieldType.Text,
              name: "strength",
              disabled: true,
              visibleIf: () => !isSupplement && !isContraceptive,
            },

            // ---------------- DOSAGE ----------------
            {
              label: "Dosage",
              type: "maskedInput",
              name: isSupplement ? "supplementDosage" : "medicineDosage",
              disabled: true,
              visibleIf: () => !isContraceptive,
            },

            // ---------------- DURATION (MEDICINE ONLY) ----------------
            {
              label: "Duration",
              type: "input",
              inputType: TextFieldType.Text,
              name: "medicineDuration",
              disabled: true,
              visibleIf: () => !isSupplement && !isContraceptive,
            },

            // ---------------- FORM (MEDICINE ONLY) ----------------
            {
              label: "Form of Medicine",
              type: "input",
              inputType: TextFieldType.Text,
              name: "formOfMedicine",
              disabled: true,
              visibleIf: () => !isSupplement && !isContraceptive,
            },
            // ---------------- CYCLES LABEL ----------------
            {
              type: "label",
              label: "cycle(s)",
              visibleIf: () => isContraceptive && formOfMedicine === "Pill",
              marginBottom: 0,
              marginTop: 25,
            },

            // ---------------- UNITS LABEL ----------------
            {
              type: "label",
              label: "unit(s)",
              visibleIf: () => isContraceptive && formOfMedicine !== "Pill",
              marginBottom: 0,
              marginTop: 25,
            },
          ];
        },
      },
      {
        label: "Are you prescribing any medicines?",
        type: "radio",
        placeholder: "Select prescribed medicines",
        required: true,
        disabled: isServiceCompleted,
        colSpan: 24,
        name: "medicines_prescribed",
        options: YES_NO_OPTIONS,
      },
      {
        type: "formList",
        name: "medicine",
        colSpan: 24,
        disabled: false,
        allowAdd: !isServiceCompleted,
        allowRemove: !isServiceCompleted,
        label: "medicines",
        visibleIf: (values: any) => values?.medicines_prescribed === true,
        initialValue: [ancMedicineRow()],
        newRow: ancMedicineRow,
        fields: [
          {
            label: "Medicine name",
            type: "select",
            disabled: isServiceCompleted,
            name: "medicineName",
            colSpan: 4,
            placeholder: "Select medicine name",
            showSearch: true,
            required: true,
            options: medicineOptions,
            fetchMore: paginationProps?.fetchMore,
            onSearch: paginationProps?.onSearch,
            isLoadingMore: paginationProps?.isLoadingMore,
          },
          {
            label: "Other Medicine",
            name: "other_medicine",
            type: "input",
            disabled: isServiceCompleted,
            inputType: TextFieldType.Text,
            placeholder: "Specify other medicine",
            required: true,
            colSpan: 6,
            visibleIf: (values: any, fieldIndex: number) => {
              return isMedicineOther(
                values,
                fieldIndex,
                "medicine",
                "medicineName",
              );
            },
          },
          {
            label: "Strength",
            type: "select",
            disabled: isServiceCompleted,
            name: "strength",
            colSpan: 4,
            placeholder: "Select strength",
            visibleIf: (values: any, fieldIndex: number) => {
              return !isMedicineOther(
                values,
                fieldIndex,
                "medicine",
                "medicineName",
              );
            },
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              if (!medicineItem) return []; //
              const strenthOptions =
                getStrengthsByMedicineId(
                  medicineItem?.medicineName,
                  medicineOptions,
                ) || [];
              return filterFormListOptions(
                strenthOptions,
                formValues,
                "medicine",
                "strength",
                fieldIndex,
                "medicineName",
              );
            },
            required: true,
            // options: medicineOptions || MEDICINE_OPTIONS,
          },
          {
            label: "Dosage per day",
            type: "maskedInput",
            name: "medicineDosage",
            disabled: isServiceCompleted,
            colSpan: 4,
            placeholder: "0-0-0",
            pattern: "0-0-0",
            required: true,
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
                    return Promise.reject("dosage must not exceed 2");

                  return Promise.resolve();
                },
              },
            ],
          },
          {
            name: "medicineDuration",
            label: "Medicine duration",
            type: "number",
            disabled: isServiceCompleted,
            colSpan: 4,
            rules: [
              {
                validator: (_: any, value: any) => {
                  if (value === undefined || value === null || value === "") {
                    return Promise.resolve();
                  }

                  if (Number(value) > 14) {
                    return Promise.reject(
                      "Medicine duration cannot exceed 14 days",
                    );
                  }

                  return Promise.resolve();
                },
              },
            ],
            placeholder: "Enter duration in days",
            required: true,
          },
          {
            label: "Form of medicine",
            type: "select",
            disabled: isServiceCompleted,
            placeholder: "Select administration route",
            required: true,
            visibleIf: (values: any, fieldIndex: number) => {
              return !isMedicineOther(
                values,
                fieldIndex,
                "medicine",
                "medicineName",
              );
            },
            colSpan: 4,
            name: "formOfMedicine",
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              if (!medicineItem) return []; //
              const formOfmeidinceOptions =
                getFormOfMedicineByMedicineIdAndStrength(
                  medicineItem.medicineName,
                  medicineItem?.strength,
                  medicineOptions,
                );
              return formOfmeidinceOptions;
            },
            // options: ROUTE_OF_ADMINISTRATION_OPTIONS,
          },
        ],
      },
      {
        label: "Special instructions",
        name: "medicineInstruction",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Enter instructions",
        required: false,
        colSpan: 24,
        visibleIf: (values: any) => {
          return values?.medicines_prescribed === true;
        },
      },
      {
        label: "Has the patient screened for rubella?",
        type: "radio",
        warningEnableCondition: (v: any) =>
          validateScreening(v?.screenedRubella, "rubella"),
        name: "screenedRubella",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Did the patient test positive for rubella?",
        type: "radio",
        name: "rubellaPositive",
        visibleIf: (values: any) => values?.screenedRubella === true,
        warningEnableCondition: (v: any) =>
          validatePositiveTest(v.rubellaPositive, "rubella"),
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Has the patient screened for Hepatitis B?",
        type: "radio",
        name: "screenedHepB",
        warningEnableCondition: (v: any) =>
          validateScreening(v.screenedHepB, "hepB"),
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Did the patient test positive Hepatitis B positive?",
        type: "radio",
        visibleIf: (values: any) => values?.screenedHepB === true,
        warningEnableCondition: (v: any) =>
          validatePositiveTest(v.hepBPositive, "hepB"),
        name: "hepBPositive",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Has the patient screened for Hepatitis C?",
        type: "radio",
        name: "screenedHepC",
        warningEnableCondition: (v: any) =>
          validateScreening(v.screenedHepC, "hepC"),
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Did the patient test positive Hepatitis C positive?",
        type: "radio",
        visibleIf: (values: any) => values?.screenedHepC === true,
        warningEnableCondition: (v: any) =>
          validatePositiveTest(v.hepCPositive, "hepC"),
        name: "hepCPositive",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Has the patient been screened for Thalassemia?",
        type: "radio",
        required: true,
        warningEnableCondition: (v: any) =>
          validateScreening(v.screenedThalassemia, "thalassemia"),
        placeholder: "Select option",
        name: "screenedThalassemia",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Did the patient test positive for Thalassemia?",
        type: "radio",
        placeholder: "Select option",
        visibleIf: (values: any) => values?.screenedThalassemia === true,
        warningEnableCondition: (v: any) =>
          validatePositiveTest(v.thalassemiaPositive, "thalassemia"),
        required: true,
        name: "thalassemiaPositive",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Has the patient been screened for HIV?",
        type: "radio",
        placeholder: "Select option",
        warningEnableCondition: (v: any) =>
          validateScreening(v.screenedHiv, "hiv"),
        required: true,
        name: "screenedHiv",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Did the patient test positive for HIV?",
        type: "radio",
        placeholder: "Select option",
        visibleIf: (values: any) => values?.screenedHiv === true,
        warningEnableCondition: (v: any) =>
          validatePositiveTest(v.hivPositive, "hiv"),
        required: true,
        name: "hivPositive",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Are you prescribing any other test to the patient?",
        type: "radio",
        placeholder: "Select option",
        required: true,
        name: "prescribedLabTest",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Lab Test Name",
        name: "prescribed_lab_tests",
        type: "formList",
        // placeholder: "Select lab test(s)",
        colSpan: 24,
        required: true,
        visibleIf: (values: any) => values?.prescribedLabTest === true,
        fields: [
          {
            label: "Lab Test Name",
            name: "lab_test_name",
            type: "select",
            placeholder: "Select lab test",
            colSpan: 6,
            required: true,
            options: LAB_TEST_TYPE_OPTIONS,
          },

          {
            label: "Urgency",
            name: "lab_test_urgency",
            type: "select",
            placeholder: "Select urgency level",
            colSpan: 6,
            required: true,
            options: URGENCY_OPTIONS,
          },
        ],
      },
    ],
  },
  {
    tabKey: "6",
    title: "Immunization",
    fields: [
      {
        type: "label",
        label: "Tetanus toxoid vaccination",
        colSpan: 24,
        fontSize: 16,
        marginTop: 0,
        textAlign: "start",
        marginBottom: 50,
        color: "var(--color-green-custom)",
      },
      ...tdVaccines.flatMap((vaccine: any) => {
        const isAdministered =
          vaccine.immunisationDosageStatus === "Administered";
        const isScheduledOrOverdue = ["Scheduled", "Defaulter"].includes(
          vaccine.immunisationDosageStatus,
        );
        const shouldShowVaccine = isServiceCompleted
          ? isAdministered
          : vaccine.dose_number === 1 || isAdministered || isScheduledOrOverdue;
        const visibleIf = () => shouldShowVaccine;

        return [
          {
            type: "label",
            label: `Td ${vaccine.dose_number}`,
            colSpan: 8,
            fontSize: 16,
            marginTop: 20,
            justify: "center",
            marginBottom: 0,
            color: "var(--color-green-custom)",
            visibleIf,
          },
          {
            label: "Date Administered",
            type: "date",
            name: `dateAdministered${vaccine.dose_number}`,
            disabled: isServiceCompleted || isAdministered,
            placeholder: "Select date",
            required: isScheduledOrOverdue,
            colSpan: 12,
            visibleIf,
          },
        ];
      }),
    ],
  },
];
