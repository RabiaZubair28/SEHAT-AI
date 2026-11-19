import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";
import { YES_NO_OPTIONS } from "./constants";
import { categoryIsMedicine } from "./moduleHelpers";
import { TextFieldType } from "@/data/types";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
}

export const createDispenserFormFields = (
  otcMedicinsOptions: FormOption[],
  paginationProps: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
  serviceCompleted: boolean,
) => [
  {
    tabKey: "1",
    title: "Medicine Dispensing",
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

            // ---------------- REQUIRED QTY ----------------
            {
              label: "Quantity Required",
              type: "number",
              name: "required_quantity",
              disabled: true,
            },

            // ---------------- DISPENSED QTY ----------------
            {
              label: "Quantity Dispensed",
              type: "number",
              name: "quantity_Dispensed",
              disabled: true,
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
        label: "Does the patient require any OTC medicines?",
        type: "radio",
        name: "otc_required",
        disabled: serviceCompleted,
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
      },
      {
        type: "formList",
        name: "medicine",
        colSpan: 24,
        disabled: false,
        label: "OTC Medicine",
        visibleIf: (formValues: any) => {
          // if (serviceCompleted) return false;
          return formValues?.otc_required === true;
        },
        required: false,
        fields: [
          {
            name: "medicineName",
            label: "Name of Medicine",
            type: "select",
            required: true,
            colSpan: 4,
            placeholder: "Select medicine",
            options: otcMedicinsOptions,
            onSearch: paginationProps.onSearch,
            fetchMore: paginationProps.fetchMore,
            isLoadingMore: paginationProps.isLoadingMore,
          },
          {
            label: "Strength",
            type: "select",
            name: "strength",
            colSpan: 4,
            visibleIf: (values: any, fieldIndex: number) => {
              const medicineItem = values?.medicine?.[fieldIndex];
              return categoryIsMedicine(
                medicineItem?.medicineName,
                otcMedicinsOptions,
              );
            },
            placeholder: "Select strength",
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              if (!medicineItem) return []; //
              const strenthOptions =
                getStrengthsByMedicineId(
                  medicineItem?.medicineName,
                  otcMedicinsOptions,
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
          },
          {
            label: "Form of medicine",
            type: "select",
            placeholder: "Select administration route",
            required: true,
            colSpan: 4,
            name: "formOfMedicine",
            visibleIf: (values: any, fieldIndex: number) => {
              const medicineItem = values?.medicine?.[fieldIndex];
              return categoryIsMedicine(
                medicineItem?.medicineName,
                otcMedicinsOptions,
              );
            },
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];

              if (!medicineItem) return []; //
              const formOfmeidinceOptions =
                getFormOfMedicineByMedicineIdAndStrength(
                  medicineItem.medicineName,
                  medicineItem?.strength,
                  otcMedicinsOptions,
                );
              return formOfmeidinceOptions;
            },
            // options: ROUTE_OF_ADMINISTRATION_OPTIONS,
          },
          {
            name: "quantity_dispensed_otc",
            label: "Quantity Dispensed",
            type: "number",
            inputType: "number",
            required: true,
            colSpan: 4,
            placeholder: "Enter quantity dispensed",
            rules: [
              {
                type: "number",
                min: 1,
                message: "Quantity dispensed must be at least 1",
              },
            ],
          },
        ],
      },
    ],
  },
];
