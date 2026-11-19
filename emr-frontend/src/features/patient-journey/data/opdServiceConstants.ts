import { Gender, TextFieldType } from "@/data/types";
import {
  ALLERGY_TYPE_OPTIONS,
  ASSOSSIATED_CONDITIONS,
  BLOOD_GROUP_OPTIONS,
  LAB_TEST_TYPE_OPTIONS,
  MEDICINE_OPTIONS,
  PAST_OBSTETRIC_COMPLICATION_OPTIONS,
  PATIENT_DIGNOSES_STATUS,
  PatientDignosis,
  PRESENTING_COMPLAINTS_OPTIONS,
  PREVIOUS_ILLNESS_OPTIONS,
  PreviousIllness,
  URGENCY_OPTIONS,
  VALIDATION_RANGES,
  YES_NO_OPTIONS,
} from "./constants";
import {
  validateBMI,
  validateBMIUnderAge,
  validateDistolicBloodPressure,
  validatePastObstetricComplication,
  validatePulseOpd,
  validateRespiratoryRate,
  validateSystolicBloodPressure,
  validateTemperature,
} from "../utils/validationHelpers";
import { SERVICE_VALIDATION_RANGES, formatFeetInches } from "@/utils/helpers/serviceValidationRanges";
import { formatDosage } from "../utils/utilities";
import { isMedicineOther } from "./moduleHelpers";
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

export const createOPDFormFields = (
  medicineOptions: FormOption[] = [],
  isServiceCompleted: boolean,
  paginationProps?: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
) => [
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
          if (v?.age >= 14) {
            return validateBMI(v.weight, v.height);
          } else {
            return validateBMIUnderAge(v.height_cm, v.weight);
          }
        },
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
          if (values?.age >= 14) {
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
              const { inches: { min, max }, feetInches } = SERVICE_VALIDATION_RANGES.opd.height;
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
          if (values?.age < 14) {
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

              const { min, max } = SERVICE_VALIDATION_RANGES.opd.height.cm;

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
        label: "Body Mass Index",
        type: "number",
        inputType: TextFieldType.Number,
        name: "body_mass_index",
        placeholder: "Body Mass Index",
        colSpan: 8,
        required: false,
        disabled: true,
      },
      {
        label: "Change in weight",
        type: "number",
        name: "change_in_weight",
        placeholder: "Enter change in weight",
        colSpan: 8,
        disabled: true,
        required: true,
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
              const { min, max } = VALIDATION_RANGES.PULSE_OPD.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pulse bpm must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Systolic BP",
        name: "systolic_bp",
        placeholder: "Enter systolic BP",
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolic_bp),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.systolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Systolic bp must be from ${min} to ${max}`),
              );
            },
          },
        ],
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
        name: "diastolic_bp",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.diastolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`diastolic bp  must be from ${min} to ${max}`),
              );
            },
          },
        ],
        colspan: 8,
        required: (values: any) => {
          return !(values?.age != null && values.age <= 14);
        },
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
        label: "Respiratory rate",
        name: "respiratory_rate",
        placeholder: "Enter respiratory rate",
        warningEnableCondition: (v: any) =>
          validateRespiratoryRate(v.respiratory_rate),
        colspan: 8,
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
                  `Respiratory rate must be from ${min} to ${max} per min`,
                ),
              );
            },
          },
        ],
        required: true,
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
      { name: "age", type: "input", colSpan: 0, style: { display: "none" } },
    ],
  },
  {
    tabKey: "2",
    title: "Medical History",
    fields: [
      {
        label: "Presenting Complaints",
        name: "presenting_complaints",
        type: "multiselect",
        required: true,
        options: PRESENTING_COMPLAINTS_OPTIONS,
        placeholder: "Select presenting complaints",
        colSpan: 8,
      },
      {
        label: "Other presenting complaint",
        name: "presenting_complaint_other",
        type: "input",
        inputType: TextFieldType.Text,
        required: true,
        placeholder: "Specify presenting complaint",
        colSpan: 8,
        visibleIf: (values: any) => {
          return values?.presenting_complaints?.includes("Other");
        },
      },
      {
        label: "History of previous illness",
        name: "previous_illness",
        type: "multiselect",
        required: true,
        placeholder: "Select previous illnesses",
        colSpan: 8,
        dataSource: "previous_opd_records", // fetched from OPD API
        options: PREVIOUS_ILLNESS_OPTIONS,
      },
      {
        label: "Other previous illness",
        name: "previous_illness_other",
        type: "input",
        inputType: TextFieldType.Text,
        required: true,
        placeholder: "Specify other illness",
        colSpan: 8,
        visibleIf: (values: any) => values?.previous_illness?.includes("Other"),
      },
      {
        label: "Does the patient have any known allergies?",
        name: "has_allergies",
        type: "radio",
        required: true,
        placeholder: "Select yes or no",
        colSpan: 8,
        options: YES_NO_OPTIONS,
      },
      {
        label: "Specify known allergies",
        type: "multiselect",
        name: "allergy_details",
        visibleIf: (values: any) => values?.has_allergies === true,
        options: ALLERGY_TYPE_OPTIONS,
        colSpan: 8,
        placeholder: "Specify allergies",
        required: true,
      },
      {
        label: "History of previous medication",
        name: "previous_medication",
        type: "radio",
        required: true,
        placeholder: "Select yes or no",
        colSpan: 8,
        options: YES_NO_OPTIONS,
      },
      {
        label: "Please specify previous medication",
        name: "previous_medication_details",
        // type: "multiselect",
        required: true,
        placeholder: "Specify other medicines",
        type: "input",
        inputType: TextFieldType.Text,
        colSpan: 8,
        visibleIf: (values: any) => values?.previous_medication === true,
        options: medicineOptions || MEDICINE_OPTIONS,
      },
      // {
      //   label: "Other previous medication",
      //   name: "previous_medication_other",
      //   type: "input",
      //   inputType: TextFieldType.Text,
      //   placeholder: "Enter other medication name",
      //   colSpan: 8,
      //   required: true,
      //   visibleIf: (values: any) =>
      //     values?.previous_medication_details?.includes("Other"),
      // },
      {
        label: "History of obstetric complication",
        name: "has_obstetric_complication",
        type: "radio",
        placeholder: "Select yes or no",
        colSpan: 8,
        required: true,
        visibleIf: (values: any) => {
          return values?.gender === Gender.FEMALE;
        },
        options: YES_NO_OPTIONS,
      },
      {
        label: "Past obstetric complication",
        type: "multiselect",
        name: "past_obstetric_complication",
        warningEnableCondition: (v: any) =>
          validatePastObstetricComplication(v?.past_obstetric_complication),
        required: true,
        visibleIf: (values: any) => {
          return values?.has_obstetric_complication === true;
        },
        placeholder: "Select past obstetric complication",
        options: PAST_OBSTETRIC_COMPLICATION_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Please specify other past obstetric complication",
        name: "other_past_obstetric_complication",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Enter other past obstetric complication",
        colSpan: 8,
        visibleIf: (values: any) =>
          values?.past_obstetric_complication?.includes("Other"),
      },

      {
        label: "History of previous surgery",
        name: "has_previous_surgery",
        type: "radio",
        required: true,
        placeholder: "Select yes or no",
        colSpan: 8,
        options: YES_NO_OPTIONS,
      },
      {
        label: "Please specify surgical history",
        name: "surgical_history_details",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Enter surgical history details",
        colSpan: 8,
        visibleIf: (values: any) => values?.has_previous_surgery === true,
      },

      // {
      //   label: "Provisional Diagnosis",
      //   name: "provisional_diagnosis",
      //   type: "multiselect",
      //   required: true,
      //   placeholder: "Select provisional diagnosis",
      //   colSpan: 8,
      //   options: PROVISIONAL_DIAGNOSIS,
      // },
      {
        label: "Associated Conditions",
        name: "associated_conditions",
        type: "multiselect",
        required: true,
        placeholder: "Select associated conditions",
        colSpan: 8,
        options: ASSOSSIATED_CONDITIONS,
      },
      {
        label: "Other associated conditions",
        name: "other_associated_conditions",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Specify associated conditions",
        required: true,
        colSpan: 6,
        visibleIf: (values: any) => {
          if (values?.associated_conditions?.includes("Other")) return true;
        },
      },

      // {
      //   label: "Follow-up Date",
      //   name: "follow_up_date",
      //   type: "date",
      //   required: false,
      //   placeholder: "Select follow-up date (dd/mm/yy)",
      //   allowFutureDates: true,
      //   colSpan: 8,
      // },
    ],
  },

  {
    tabKey: "3",
    title: "Prescriptions & Diagnostics",
    fields: [
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
            isLoadingMore: paginationProps?.isLoadingMore,
            onSearch: paginationProps?.onSearch,
          },
          {
            label: "Other Medicine",
            name: "other_medicine",
            type: "input",
            inputType: TextFieldType.Text,
            disabled: isServiceCompleted,
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

              if (!medicineItem) return [];
              const strenthOptions =
                getStrengthsByMedicineId(
                  medicineItem?.medicineName,
                  medicineOptions,
                ) || [];
              const filtered = filterFormListOptions(
                strenthOptions,
                formValues,
                "medicine",
                "strength",
                fieldIndex,
                "medicineName",
              );
              return filtered;
            },
            required: true,
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
        label: "Special Instructions",
        name: "special_instructions",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Enter any special instructions",
        visibleIf: (values: any) => values?.medicines_prescribed === true,
        colSpan: 24,
        required: false,
      },

      // -------------------- LAB TESTS --------------------
      {
        label: "Are you prescribing any diagnostic test to the patient?",
        name: "prescribing_lab_test",
        type: "radio",
        required: true,
        placeholder: "Select yes or no",
        colSpan: 24,
        options: YES_NO_OPTIONS,
      },
      {
        label: "Lab Test Name",
        name: "prescribed_lab_tests",
        type: "formList",
        // placeholder: "Select lab test(s)",
        colSpan: 24,
        required: true,
        visibleIf: (values: any) => values?.prescribing_lab_test === true,
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
          // {
          //   label: "Other Lab Test",
          //   name: "lab_test_other",
          //   type: "input",
          //   inputType: TextFieldType.Text,
          //   placeholder: "Specify other lab test",
          //   required: true,
          //   colSpan: 6,
          //   visibleIf: (values: any, fieldIndex: number) => {
          //     const labTests = values?.prescribed_lab_tests || []; // 👈 adjust this key to your actual array name
          //     const currentTest = labTests?.[fieldIndex]?.lab_test_name;
          //     return currentTest?.includes("Other");
          //   },
          // },
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
      {
        label: "Does the patient have their lab results?",
        type: "radio",
        name: "patient_lab_results",
        required: true,
        colSpan: 8,
        visibleIf: (values: any) => values?.prescribing_lab_test === true,
        placeholder: "Select yes or no",
        options: YES_NO_OPTIONS,
      },
      {
        label: "Result Value",
        name: "result_value",
        type: "input",
        visibleIf: (values: any) => values?.patient_lab_results === true,
        inputType: TextFieldType.Text,
        placeholder: "Enter result value (if available)",
        colSpan: 8,
        required: true,
      },
      {
        label: "Result Lab Date",
        name: "result_lab_date",
        type: "date",
        visibleIf: (values: any) => values?.patient_lab_results === true,
        placeholder: "Select result date (dd/mm/yy)",
        colSpan: 8,
        required: true,
        allowFutureDates: true,
      },
      {
        label: "Status of patient's final diagnosis",
        type: "radio",
        name: "patient_diagnosis_status",
        required: true,
        colSpan: 8,
        placeholder: "Select diagnisis status",
        options: PATIENT_DIGNOSES_STATUS,
      },

      // -------------------- FINAL DIAGNOSIS --------------------
      {
        label: "Final Diagnosis",
        name: "final_diagnosis",
        type: "multiselect",
        visibleIf: (values: any) =>
          values?.patient_diagnosis_status === PatientDignosis.AVAILABLE,
        placeholder: "Select final diagnosis",
        colSpan: 8,
        required: true,
        options: PREVIOUS_ILLNESS_OPTIONS,
      },
      {
        label: "Other final diagnosis",
        name: "other_final_diagnosis",
        type: "input",
        inputType: TextFieldType.Text,
        visibleIf: (values: any) =>
          values?.final_diagnosis?.includes(PreviousIllness.OTHER),
        placeholder: "Select final diagnosis",
        colSpan: 8,
        required: true,
      },
    ],
  },
];
