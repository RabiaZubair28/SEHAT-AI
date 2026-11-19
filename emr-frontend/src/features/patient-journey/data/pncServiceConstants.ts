import { TextFieldType } from "@/data/types";
import {
  BLOOD_GROUP_OPTIONS,
  showContratceptivesTypesNonPill,
  showContratceptivesTypesPills,
  TYPE_OF_CONTRACEPTION_OPTIONS,
  TypeOfContraception,
  VALIDATION_RANGES,
  WARNING_SIGNS_PNC,
  YES_NO_OPTIONS,
} from "./constants";

import {
  validateDistolicBloodPressure,
  validateMUACPNC,
  validatePncBloodSugar,
  validatePncHaemoglobin,
  validatePulseOpd,
  validateSpO2Pnc,
  validateSystolicBloodPressure,
  validateTemperature,
  validateWarningSign,
} from "../utils/validationHelpers";
import { formatDosage } from "../utils/utilities";
import { isSupplementOther } from "./moduleHelpers";
import { filterFormListOptions } from "@/utils/helpers/formHelperMethods";
import { SERVICE_VALIDATION_RANGES, formatFeetInches } from "@/utils/helpers/serviceValidationRanges";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
}

export const createFormFieldsPnc = (
  supplementOptions: FormOption[],
  larcContraceptiveOptions: FormOption[],
  shortTermContraceptiveOptions: FormOption[],
  isServiceCompleted: boolean,
  tdVaccines: any[] = [],
  // hasLmpDate: boolean,
) => [
  {
    tabKey: "1",
    title: "Vitals & Screenings",
    fields: [
      {
        type: "label",
        label: "Vitals",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)",
      },
      {
        label: "Weight (kg)",
        name: "weight",
        type: "number",
        required: true,
        colSpan: 8,
        placeholder: "Enter weight",
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
              const { inches: { min, max }, feetInches } = SERVICE_VALIDATION_RANGES.pnc.height;
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

              const { min, max } = SERVICE_VALIDATION_RANGES.pnc.height.cm;

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
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolic_bp),
        colspan: 8,
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
        name: "diastolic_bp",
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
        colspan: 8,
        required: true,
        type: "number",
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
        label: "Blood group",
        type: "select",
        name: "blood_group",
        required: false,
        colspan: 8,
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
        name: "haemoglobin",
        required: true,
        warningEnableCondition: (v: any) =>
          validatePncHaemoglobin(v.haemoglobin),
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.HAEMOGLOBIN_PNC.min &&
                value <= VALIDATION_RANGES.HAEMOGLOBIN_PNC.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `Haemoglobin must be between ${VALIDATION_RANGES.HAEMOGLOBIN_PNC.min} - ${VALIDATION_RANGES.HAEMOGLOBIN_PNC.max} g/dL`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
      },

      {
        label: "Blood Sugar (Random) mg/dL",
        type: "number",
        required: true,
        colSpan: 8,
        inputType: TextFieldType.Number,
        warningEnableCondition: (v: any) =>
          validatePncBloodSugar(v?.blood_sugar_random),
        placeholder: "Enter blood sugar (random) mg/dL",
        name: "blood_sugar_random",
        rules: [
          {
            validator: (_: any, value: number) => {
              if (
                value &&
                value >= VALIDATION_RANGES.BLOOD_SUGAR_PNC.possible.min &&
                value <= VALIDATION_RANGES.BLOOD_SUGAR_PNC.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(`RBS must be between 50 and 400 mg/dl`),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
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
                value >= VALIDATION_RANGES.MUAC_PNC.possible.min &&
                value <= VALIDATION_RANGES.MUAC_PNC.possible.max
              ) {
                return Promise.resolve();
              }
              if (value) {
                // only show error if a value is present
                return Promise.reject(
                  new Error(
                    `MUAC must be between ${VALIDATION_RANGES.MUAC_PNC.possible.min} - ${VALIDATION_RANGES.MUAC_PNC.possible.max} cm`,
                  ),
                );
              }
              return Promise.resolve(); // no value, no error
            },
          },
        ],
        warningEnableCondition: (v: any) => validateMUACPNC(v.muac),
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
        warningEnableCondition: (v: any) => validateSpO2Pnc(v.spo2),
        type: "number",
        placeholder: "Enter SpO₂ (%)",
        name: "spo2",
      },
      {
        label: "Pulse (BPM)",
        required: true,
        colSpan: 8,
        warningEnableCondition: (v: any) => validatePulseOpd(v.pulse),
        type: "number",
        placeholder: "Enter pulse (BPM)",
        name: "pulse",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PULSE_PNC.possible;
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
        options: WARNING_SIGNS_PNC,
      },
      {
        label: "Other warning signs",
        name: "other_warning_signs",
        type: "input",

        inputType: TextFieldType.Text,
        placeholder: "Specify other warning signs",
        required: true,
        colSpan: 6,
        visibleIf: (values: any) => {
          return values?.warning_signs?.includes(
            WARNING_SIGNS_PNC[WARNING_SIGNS_PNC.length - 2].value,
          );
        },
      },
    ],
  },
  {
    tabKey: "2",
    title: "Immunisation",
    fields: [
      // {
      //   label: "Last Menstrual Period (LMP)",
      //   name: "lmp",
      //   type: "date",
      //   required: true,
      //   colSpan: 12,
      //   disabled: isServiceCompleted || hasLmpDate,
      // },
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
  {
    tabKey: "3",
    title: "Breastfeeding",

    fields: [
      {
        label:
          "Did the patient initiate early breastfeeding within the first one hour of delivery?",
        name: "early_breastfeeding",
        type: "radio",
        placeholder: "Select yes or no",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 12,
        warningEnableCondition: (v: any) => {
          if (v.early_breastfeeding == false)
            return "Please counsel the mother on breastfeeding";
          return;
        },
      },
      {
        label:
          "Did the patient initiate exclusive breastfeeding to the baby for the first six months?",
        name: "exclusive_breastfeeding",
        type: "radio",
        placeholder: "Select yes or no",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 12,
        warningEnableCondition: (v: any) => {
          if (v.exclusive_breastfeeding == false)
            return "Please council the mother on exclusive breastfeeding";
          return;
        },
      },
      {
        label: "Did the patient report any issue with breastfeeding?",
        name: "breastfeeding_issue",
        type: "radio",
        placeholder: "Select yes or no",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 12,
      },
      {
        label: "What type of issues is she facing?",
        visibleIf: (values: any) => values?.breastfeeding_issue === true,
        type: "multiselect",
        name: "breastfeeding_issue_type",
        required: true,
        placeholder: "Select issue types",
        warningEnableCondition: (v: any) => {
          if (v.breastfeeding_issue_type == "Sore or cracked nipples")
            return "Please advise the mother in applying hot compress to the nipple area.";
          else if (v.breastfeeding_issue_type == "Not enough breastmilk")
            return "Please counsel the mother on proper nutrition to enable breastmilk production";
          else if (v.breastfeeding_issue_type == "Too much breastmilk")
            return "Please counsel the mother on proper nutrition to enable breastmilk production";
          else if (
            v.breastfeeding_issue_type === "Baby is not latching on properly"
          )
            return "Please assist the mother in achieving the correct position and attachment at each breast";
          else if (v.breastfeeding_issue_type === "Breast tenderness")
            return "Please assist the mother in applying soothing medication to the nipple";
          else if (v.breastfeeding_issue_type === "Other")
            return "Please prescribe the mother with antibitoics after consultation with a doctor";
        },

        options: [
          {
            id: 1,
            label: "Sore or cracked nipples",
            value: "Sore or cracked nipples",
          },
          {
            id: 2,
            label: "Not enough breastmilk",
            value: "Not enough breastmilk",
          },
          { id: 3, label: "Too much breastmilk", value: "Too much breastmilk" },
          {
            id: 4,
            label: "Baby is not latching on properly",
            value: "Baby is not latching on properly",
          },
          { id: 5, label: "Breast tenderness", value: "Breast tenderness" },
          { id: 6, label: "Infections", value: "Infections" },
          { id: 7, label: "Other", value: "Other" },
        ],
        colSpan: 12,
      },
    ],
  },
  {
    tabKey: "4",
    title: "Postpartum Nutrition",
    fields: [
      {
        label: "Did you counsel the patient on nutrition and home-made diet?",
        name: "nutrition_counseling",
        type: "radio",
        placeholder: "Select yes or no",
        required: true,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],

        colSpan: 24,
        warningEnableCondition: (v: any) => {
          if (v.nutrition_counseling == false)
            return "Please council the mother on postpartum nutrition and home-made diet";
          return;
        },
      },
      {
        label: "Are you prescribing any supplements to the patient?",
        name: "supplements_prescribed",
        type: "radio",
        disabled: isServiceCompleted,
        placeholder: "Select yes or no",
        required: true,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        colSpan: 24,
      },
      {
        type: "formList",
        name: "supplements",
        colSpan: 24,
        disabled: false,
        label: "Supplements",
        allowAdd: !isServiceCompleted,
        allowRemove: !isServiceCompleted,
        visibleIf: (values: any) => values?.supplements_prescribed === true,
        // required: true,
        fields: [
          {
            name: "supplementName",
            label: "Name of supplement",
            type: "select",
            placeholder: "Select supplements type",
            colSpan: 6,
            disabled: isServiceCompleted,
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
            disabled: isServiceCompleted,
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
            disabled: isServiceCompleted,
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
        name: "supplementsInstruction",
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
    tabKey: "5",
    title: "Postpartum Family Planning",
    fields: [
      {
        label: "Did you counsel the patient on family planning?",
        name: "family_planning_counseling",
        type: "radio",
        placeholder: "Select yes or no",
        required: true,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        colSpan: 12,
        warningEnableCondition: (v: any) => {
          if (v.family_planning_counseling == false)
            return "Please council the mother on family planning";
          return;
        },
      },
      {
        label: "Did you dispense any family planning methods to the patient?",
        name: "dispensed_family_method",
        type: "radio",
        disabled: isServiceCompleted,
        placeholder: "Select yes or no",
        required: true,
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        colSpan: 12,
      },
      {
        label: "Type of contraception",
        name: "type_of_contraception",
        visibleIf: (values: any) => values.dispensed_family_method === true,
        type: "select",
        required: true,
        disabled: isServiceCompleted,
        placeholder: "Select contraception type",
        options: TYPE_OF_CONTRACEPTION_OPTIONS,
        colSpan: 24,
      },
      {
        type: "label",
        label: "Which type of family planning method was provided?",
        colSpan: 24,
        visibleIf: (values: any) =>
          values.type_of_contraception &&
          values.dispensed_family_method === true,
        marginBottom: 12,
      },
      {
        type: "formList",
        name: "family_planning_prescriptions_short_term",
        colSpan: 24,
        allowAdd: !isServiceCompleted,
        allowRemove: !isServiceCompleted,
        disabled: false,
        label: "Family Planning Prescriptions",
        visibleIf: (values: any) =>
          values.dispensed_family_method === true &&
          values.type_of_contraception === TypeOfContraception.SHORT_TERM,
        // required: true,
        fields: [
          {
            label: "Method selected",
            type: "select",
            name: "selected_family_planning_method_short_term",
            visibleIf: (values: any) => {
              return (
                values?.type_of_contraception === TypeOfContraception.SHORT_TERM
              );
            },
            required: true,
            placeholder: "Select Method",
            disabled: isServiceCompleted,
            options: (formValues: any, fieldIndex: number) => {
              return filterFormListOptions(
                shortTermContraceptiveOptions,
                formValues,
                "family_planning_prescriptions_short_term",
                "selected_family_planning_method_short_term",
                fieldIndex,
              );
            },
            colSpan: 6,
          },
          {
            label: "Quantity",
            required: true,
            colSpan: 6,
            disabled: isServiceCompleted,
            type: "number",
            rules: [
              {
                validator: (_: any, value: number) => {
                  if (!value || (value >= 1 && value <= 30)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Quantity must be between 1 and 30"),
                  );
                },
              },
            ],
            placeholder: "Enter quantity",
            name: "quantity_short_term",
          },
          {
            type: "label",
            label: "cycle(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesPills(
                values,
                fieldIndex,
                "selected_family_planning_method_short_term",
                shortTermContraceptiveOptions,
              );
            },
          },
          {
            type: "label",
            label: "unit(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesNonPill(
                values,
                fieldIndex,
                "selected_family_planning_method_short_term",
                shortTermContraceptiveOptions,
              );
            },
          },
        ],
      },
      {
        type: "formList",
        name: "family_planning_prescriptions_larc",
        colSpan: 24,
        disabled: false,
        allowAdd: false,
        allowRemove: false,
        label: "Family Planning Prescriptions",
        visibleIf: (values: any) =>
          values.dispensed_family_method === true &&
          values.type_of_contraception === TypeOfContraception.LARC,
        // required: true,
        fields: [
          {
            label: "Method selected",
            type: "select",
            name: "selected_family_planning_method_larc",
            visibleIf: (values: any) => {
              return values?.type_of_contraception === TypeOfContraception.LARC;
            },
            required: true,
            placeholder: "Select Method",
            disabled: isServiceCompleted,
            options: (formValues: any, fieldIndex: number) => {
              return filterFormListOptions(
                larcContraceptiveOptions,
                formValues,
                "family_planning_prescriptions_larc",
                "selected_family_planning_method_larc",
                fieldIndex,
              );
            },
            colSpan: 6,
          },
          {
            label: "Quantity",
            required: true,
            colSpan: 6,
            disabled: isServiceCompleted,
            type: "number",
            rules: [
              {
                validator: (_: any, value: number) => {
                  if (!value || (value >= 1 && value <= 30)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Quantity must be between 1 and 30"),
                  );
                },
              },
            ],
            placeholder: "Enter quantity",
            name: "quantity_larc",
          },
          {
            type: "label",
            label: "cycle(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesPills(
                values,
                fieldIndex,
                "selected_family_planning_method_larc",
                larcContraceptiveOptions,
              );
            },
          },
          {
            type: "label",
            label: "unit(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesNonPill(
                values,
                fieldIndex,
                "selected_family_planning_method_larc",
                larcContraceptiveOptions,
              );
            },
          },
        ],
      },
    ],
  },
];
