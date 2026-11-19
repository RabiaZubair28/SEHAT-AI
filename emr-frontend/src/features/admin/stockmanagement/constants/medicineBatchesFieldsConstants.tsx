import { TextFieldType } from "@/data/types";
import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";
import { createRowIdGenerator } from "@/utils/helpers/rowId";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
  category: string;
  contraceptive: boolean;
  is_otc: boolean;
  variants: any[];
}

export const newBatchRow = createRowIdGenerator();

interface PaginationProps {
  fetchMore: () => void;
  isLoadingMore: boolean;
  onSearch: (val: string) => void;
}

export const createMedicineDispatchFields = (
  allMedicineOptions: FormOption[],
  paginationProps?: PaginationProps,
  contraceptivePaginationProps?: PaginationProps,
  paginatedContraceptiveOptions?: FormOption[],
) => [
  {
    tabKey: "1",
    title: "Medicine Batches",
    fields: [
      {
        type: "formList",
        name: "medicine",
        colSpan: 24,
        label: "Medicine",
        required: true,
        initialValue: [newBatchRow()],
        newRow: newBatchRow,
        fields: [
          {
            name: "medicineName",
            label: "Name of Medicine",
            type: "select",
            required: true,
            colSpan: 5,
            placeholder: "Select medicine",
            options: allMedicineOptions?.filter((m) => {
              return m.contraceptive === false;
            }),
            showSearch: true,
            fetchMore: paginationProps?.fetchMore,
            isLoadingMore: paginationProps?.isLoadingMore,
            onSearch: paginationProps?.onSearch,
          },
          {
            name: "strength",
            label: "Strength",
            type: "select",
            colSpan: 5,
            placeholder: "Select strength",
            required: true,
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              if (!medicineItem) return [];
              const strengthOptions =
                getStrengthsByMedicineId(
                  medicineItem.medicineName,
                  allMedicineOptions,
                ) || [];
              return filterFormListOptions(
                strengthOptions,
                formValues,
                "medicine",
                "strength",
                fieldIndex,
                "medicineName"
              );
            },
          },
          {
            name: "formOfMedicine",
            label: "Form of medicine",
            type: "select",
            colSpan: 5,
            placeholder: "Select administration route",
            required: true,
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              if (!medicineItem) return [];
              return getFormOfMedicineByMedicineIdAndStrength(
                medicineItem.medicineName,
                medicineItem.strength,
                allMedicineOptions,
              );
            },
          },
          {
            name: "batch_number",
            label: "Batch Number",
            type: "input",
            inputType: TextFieldType.Text,
            colSpan: 5,
            placeholder: "Batch number",
            required: true,
          },
          {
            name: "purchase_date",
            label: "Purchase Date",
            type: "date",
            colSpan: 5,
            placeholder: "Purchase date",
            required: true,
          },
          {
            name: "expiry_date",
            label: "Expiry Date",
            type: "date",
            allowFutureDates: true,
            disablePastDates: true,
            colSpan: 5,
            placeholder: "Expiry date",
            required: true,
          },
          {
            name: "stock_quantitys",
            label: "Stock Quantity",
            type: "number",
            colSpan: 5,
            placeholder: "Enter stock quantity",
            required: true,
          },
          {
            name: "is_otc",
            label: "Is Otc?",
            type: "checkbox",
            colSpan: 2,
            required: false,
            options: [
              {
                label: "OTC",
                value: true,
              },
            ],
          },
          {
            name: "limit_quantity",
            label: "Otc limit quantity",
            type: "number",
            colSpan: 5,
            placeholder: "Enter limit quantity",
            required: true,
            visibleIf: (formValues: any, fieldIndex: number) => {
              const medicineItem = formValues?.medicine?.[fieldIndex];
              // CheckboxGroup returns array
              return (
                Array.isArray(medicineItem?.is_otc) &&
                medicineItem.is_otc.includes(true)
              );
            },
          },
        ],
      },
    ],
  },
  {
    tabKey: "2",
    title: "Contraceptive Batches",
    fields: [
      {
        type: "formList",
        name: "contraceptive", // changed name to avoid conflict
        colSpan: 24,
        label: "Medicine",
        required: true,
        initialValue: [newBatchRow()],
        newRow: newBatchRow,
        fields: [
          {
            name: "medicineName",
            label: "Name of Contraceptive",
            type: "select",
            required: true,
            colSpan: 5,
            placeholder: "Select medicine",
            options:
              paginatedContraceptiveOptions ||
              allMedicineOptions?.filter((m) => {
                return m.contraceptive === true;
              }),
            fetchMore: contraceptivePaginationProps?.fetchMore,
            isLoadingMore: contraceptivePaginationProps?.isLoadingMore,
            onSearch: contraceptivePaginationProps?.onSearch,
          },
          {
            name: "batch_number",
            label: "Batch Number",
            type: "input",
            inputType: TextFieldType.Text,
            colSpan: 5,
            placeholder: "Batch number",
            required: true,
          },
          {
            name: "purchase_date",
            label: "Purchase Date",
            type: "date",
            colSpan: 5,
            placeholder: "Purchase date",
            required: true,
          },
          {
            name: "expiry_date",
            label: "Expiry Date",
            type: "date",
            allowFutureDates: true,
            disablePastDates: true,
            colSpan: 5,
            placeholder: "Expiry date",
            required: true,
          },
          {
            name: "stock_quantitys",
            label: "Stock Quantity",
            type: "number",
            colSpan: 5,
            placeholder: "Enter stock quantity",
            required: true,
          },
          {
            name: "is_otc",
            label: "Is Otc?",
            type: "checkbox",
            colSpan: 2,
            required: false,
            options: [
              {
                label: "OTC",
                value: true,
              },
            ],
          },
          {
            name: "limit_quantity",
            label: "Otc limit quantity",
            type: "number",
            colSpan: 5,
            placeholder: "Enter limit quantity",
            required: true,
            visibleIf: (formValues: any, fieldIndex: number) => {
              const medicineItem = formValues?.contraceptive?.[fieldIndex];
              // CheckboxGroup returns array
              return (
                Array.isArray(medicineItem?.is_otc) &&
                medicineItem.is_otc.includes(true)
              );
            },
          },
          {
            type: "label",
            label: "cycle(s)",
            colSpan: 4,
            marginBottom: 0,
            marginTop: 10,
            visibleIf: (values: any, fieldIndex: number) => {
              const contraceptives = values?.contraceptive || [];
              const currentId = contraceptives?.[fieldIndex]?.medicineName;
              const selectedOption = allMedicineOptions.find(
                (option) => option.id === currentId,
              );

              return selectedOption?.variants[0]?.unit === "Pill";
            },
          },
          {
            type: "label",
            label: "unit(s)",
            colSpan: 4,
            marginTop: 10,
            marginBottom: 0,
            visibleIf: (values: any, fieldIndex: number) => {
              const contraceptives = values?.contraceptive || [];
              const currentId = contraceptives?.[fieldIndex]?.medicineName;
              const selectedOption = allMedicineOptions.find(
                (option) => option.id === currentId,
              );

              return selectedOption?.variants[0]?.unit !== "Pill";
            },
          },
        ],
      },
    ],
  },
];
