import { TextFieldType } from "@/data/types";
import { createRowIdGenerator } from "@/utils/helpers/rowId";

const emergencyMedicineRow = createRowIdGenerator();

import { LEVEL_OF_CARE } from "@/features/patient-journey/data/constants";
import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";

export const IDENTITY_PROVIDER_OPTIONS = [
  { label: "Self", value: "Self" },
  { label: "Mother", value: "Mother" },
  { label: "Father", value: "Father" },
  { label: "Sibling", value: "Sibling" },
  { label: "Spouse", value: "Spouse" },
  { label: "Guardian", value: "Guardian" },
  { label: "Uncle/Aunt (blood-relation)", value: "Uncle/Aunt" },
  { label: "Other", value: "Other" },
];

export const SEX_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

export const BLOOD_GROUP_OPTIONS = [
  { label: "A +ve", value: "A +ve" },
  { label: "A -ve", value: "A -ve" },
  { label: "B +ve", value: "B +ve" },
  { label: "B -ve", value: "B -ve" },
  { label: "AB +ve", value: "AB +ve" },
  { label: "AB -ve", value: "AB -ve" },
  { label: "O +ve", value: "O +ve" },
  { label: "O -ve", value: "O -ve" },
];

export const SERVICE_REQUIRED_OPTIONS = [
  { label: "OPD", value: "OPD" },
  { label: "ANC", value: "ANC" },
  { label: "Delivery", value: "Delivery" },
  { label: "PNC", value: "PNC" },
  { label: "Family planning", value: "Family planning" },
  { label: "Nutrition", value: "Nutrition" },
  { label: "Other", value: "Other" },
];

export const SERVICE_TYPE_OPTIONS = [
  { label: "OPD", value: "OPD" },
  { label: "ANC", value: "ANC" },
  { label: "Delivery", value: "Delivery" },
  { label: "PNC", value: "PNC" },
  { label: "Immunisation", value: "Immunisation" },
  { label: "Family planning", value: "Family planning" },
  { label: "Nutrition", value: "Nutrition" },
  { label: "Other", value: "Other" },
];

export const OUTCOME_OPTIONS = [
  { label: "Discharged", value: "Discharged" },
  { label: "Referred", value: "Referred" },
  { label: "LAMA", value: "LAMA" },
  { label: "Expired", value: "Expired" },
  { label: "Admitted", value: "Admitted" },
];

export const NationalityStatusOptions = [
  { label: "Pakistani", value: "Pakistani" },
  { label: "Non-Pakistani", value: "Non-Pakistani" },
];

export const createEmergencyFormFields = (
  medicineOptions: any[] = [],
  paginationProps?: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
) => [
  {
    tabKey: "1",
    title: "Patient Information",
    fields: [
      {
        type: "label",
        label: "Patient Details",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)",
      },
      {
        label: "First name",
        name: "firstName",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Enter first name",
        colSpan: 6,
      },
      {
        label: "Last name",
        name: "lastName",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Enter last name",
        colSpan: 6,
      },
      {
        label: "Mobile No",
        name: "mobileNo",
        type: "maskedInput",
        maxLength: 11,
        required: true,
        prefix: "03",
        inputType: TextFieldType.Number,
        placeholder: "xxxx-xxxxxxx",
        pattern: "03XX-XXXXXXX",
        colSpan: 6,
        rules: [
          {
            validator: (_: any, value: string) => {
              if (!value) {
                return Promise.resolve(); // allow empty if optional, or reject if required
              }
              const digitsOnly = value.replace(/\D/g, "");

              // Phone number must start with '03' and have 11 digits
              if (/^03\d{9}$/.test(digitsOnly)) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error("Phone number must be exactly 11 digits"),
              );
            },
          },
        ],
      },
      {
        label: "Age",
        name: "age",
        type: "input",
        inputType: TextFieldType.Text,
        placeholder: "Enter Age",
        colSpan: 6,
        required: true,
      },

      {
        label: "Sex",
        name: "sex",
        type: "radio",
        options: SEX_OPTIONS,
        required: true,
        colSpan: 6,
      },
      {
        name: "nationalityStatus",
        label: "Nationality Status",
        type: "radio",
        options: NationalityStatusOptions,
        required: false,
        colSpan: 6,
      },
      {
        label: "Identity Provider",
        name: "identityProvider",
        type: "select",
        required: false,
        placeholder: "Select identity provider",
        options: IDENTITY_PROVIDER_OPTIONS,
        colSpan: 7,
      },
      {
        name: "cnic",
        label: "CNIC",
        type: "maskedInput",
        placeholder: "xxxxx-xxxxxxx-x",
        pattern: "XXXXX-XXXXXXX-X",
        maxLength: 13,
        required: false,
        colSpan: 6,
        visibleIf: (v: any) => v?.nationalityStatus === "Pakistani",
        rules: [
          {
            validator: (_: any, value: string) => {
              if (!value) {
                return Promise.resolve();
              }

              const digitsOnly = value.replace(/\D/g, "");

              if (digitsOnly.length === 13) {
                return Promise.resolve();
              }

              return Promise.reject(
                new Error("CNIC must be exactly 13 digits"),
              );
            },
          },
        ],
      },

      {
        label: "International ID / Passport Number",
        name: "internationalId",
        type: "input",
        required: false,
        inputType: TextFieldType.Number,
        placeholder: "Enter ID/Passport",
        colSpan: 6,
        maxLength: 20,
        minLength: 6,
        visibleIf: (v: any) => v?.nationalityStatus === "Non-Pakistani",
      },

      {
        label: "Blood Group",
        name: "bloodGroup",
        type: "select",
        required: false,
        placeholder: "Select blood group",
        options: BLOOD_GROUP_OPTIONS,
        colSpan: 6,
      },
      {
        label: "What service does the patient require?",
        name: "serviceRequired",
        type: "select",
        required: true,
        placeholder: "Select service",
        options: SERVICE_REQUIRED_OPTIONS,
        colSpan: 10,
      },
      {
        label: "Other",
        name: "otherServiceRequired",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Specify other service",
        colSpan: 6,
        visibleIf: (v: any) => v?.serviceRequired === "Other",
      },
      {
        label: "Past Medical/Surgical history",
        name: "pastHistory",
        type: "input",
        required: false,
        inputType: TextFieldType.Text,
        placeholder: "Enter past medical/surgical history",
        colSpan: 24,
      },
      {
        label: "Presenting complaint",
        name: "presentingComplaint",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Enter presenting complaint",
        colSpan: 24,
      },
      {
        label: "Did you administered any medicines to the patient?",
        name: "administeredMedicines",
        type: "radio",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        required: true,
        colSpan: 6,
      },
      {
        label: "Medicines administered",
        type: "formList",
        name: "medicinesAdministered",
        colSpan: 24,
        allowAdd: true,
        allowRemove: true,
        visibleIf: (v: any) => v?.administeredMedicines === true,
        initialValue: [emergencyMedicineRow()],
        newRow: emergencyMedicineRow,
        fields: [
          {
            label: "Medicine name",
            type: "select",
            name: "medicineName",
            colSpan: 6,
            required: true,
            placeholder: "Select medicine",
            showSearch: true,
            fetchMore: paginationProps?.fetchMore,
            isLoadingMore: paginationProps?.isLoadingMore,
            onSearch: paginationProps?.onSearch,
            options: medicineOptions,
          },
          {
            label: "Strength",
            type: "select",
            name: "strength",
            placeholder: "Select strength",
            colSpan: 4,
            required: true,
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem =
                formValues?.medicinesAdministered?.[fieldIndex];
              if (!medicineItem) return [];
              const strengthOptions =
                getStrengthsByMedicineId(
                  medicineItem.medicineName,
                  medicineOptions,
                ) || [];
              return filterFormListOptions(
                strengthOptions,
                formValues,
                "medicinesAdministered",
                "strength",
                fieldIndex,
                "medicineName",
              );
            },
          },
          {
            label: "Form of medicine",
            type: "select",
            name: "formOfMedicine",
            placeholder: "Select form of medicine",
            colSpan: 4,
            required: true,
            options: (formValues: any, idx: any) => {
              const item = formValues?.medicinesAdministered?.[idx];
              if (!item) return [];
              return getFormOfMedicineByMedicineIdAndStrength(
                item.medicineName,
                item?.strength,
                medicineOptions,
              );
            },
          },
          {
            label: "Quantity",
            type: "number",
            name: "quantity",
            placeholder: "Enter quantity",
            colSpan: 3,
            required: true,
          },
        ],
      },

      {
        label: "Medicines Prescribed",
        name: "medicines_prescribed",
        type: "input",
        placeholder: "Enter medicines prescribed",
        colSpan: 24,
        required: false,
      },
      {
        type: "label",
        label: "Vitals",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)",
      },

      {
        label: "Temperature",
        name: "temperature",
        type: "input",
        required: false,
        inputType: TextFieldType.Number,
        placeholder: "Enter temperature",
        colSpan: 6,
      },
      {
        label: "Pulse",
        name: "pulse",
        type: "input",
        required: false,
        inputType: TextFieldType.Number,
        placeholder: "Enter pulse",
        colSpan: 6,
      },
      {
        label: "Systolic BP",
        name: "systolicBp",
        type: "input",
        required: false,
        inputType: TextFieldType.Number,
        placeholder: "Enter systolic BP",
        colSpan: 6,
      },
      {
        label: "Diastolic BP",
        name: "diastolicBp",
        type: "input",
        required: false,
        inputType: TextFieldType.Number,
        placeholder: "Enter diastolic BP",
        colSpan: 6,
      },
      {
        label: "Respiratory Rate",
        placeholder: "Enter respiratory rate",
        name: "respiratoryRate",
        colspan: 6,
        required: false,
        type: "number",
      },
      {
        label: "SpO₂ (%)",
        required: false,
        colSpan: 6,
        type: "number",
        placeholder: "Enter SpO₂ (%)",
        name: "spo2",
      },
      {
        type: "label",
        label: "Patient Outcome",
        colSpan: 24,
        fontSize: 18,
        color: "var(--color-green-custom)",
      },
      {
        type: "select",
        label: "Outcome",
        name: "outcome",
        placeholder: "Select outcome",
        required: true,
        showSearch: true,
        colSpan: 6,
        options: OUTCOME_OPTIONS,
      },
      {
        type: "select",
        label: "Level of care",
        name: "levelOfCare",
        options: LEVEL_OF_CARE,
        placeholder: "Select level of care",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => v?.outcome === "Referred",
      },

      {
        type: "select",
        label: "District",
        name: "district",
        placeholder: "Select district",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => v?.outcome === "Referred",
      },
      {
        type: "select",
        label: "Name of facility",
        name: "facility",
        placeholder: "Select facility",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => v?.outcome === "Referred",
      },
      {
        label: "Other Facility",
        type: "input",
        required: false,
        inputType: TextFieldType.Text,
        placeholder: "Specify other facility",
        name: "otherFacility",
        colSpan: 6,
        visibleIf: (v: any) =>
          v?.facility === "Other" && v?.outcome === "Referred",
      },
      {
        label: "Type of service",
        name: "serviceType",
        type: "select",
        required: true,
        placeholder: "Select service",
        options: SERVICE_TYPE_OPTIONS,
        colSpan: 8,
        visibleIf: (v: any) => v?.outcome === "Referred",
      },
      {
        label: "Other",
        name: "otherServiceType",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Specify other service",
        colSpan: 6,
        visibleIf: (v: any) =>
          v?.serviceType === "Other" && v?.outcome === "Referred",
      },
      {
        label: "Reason of referral",
        name: "referralReason",
        type: "input",
        required: true,
        placeholder: "Enter reason of referral",
        colSpan: 6,
        visibleIf: (v: any) => v?.outcome === "Referred",
      },
    ],
  },
];
