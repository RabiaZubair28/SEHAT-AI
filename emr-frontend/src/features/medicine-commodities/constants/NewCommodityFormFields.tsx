import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";
import { createRowIdGenerator } from "@/utils/helpers/rowId";

const commodityMedicineRow = createRowIdGenerator();


interface FormOption {
  id?: number;
  label: string;
  value: string | number;
  category: string;
  contraceptive: boolean;
  rejectionReason?: string | null;
  is_otc: boolean;
  variants: any[];
}

const COMMODITY_PURPOSE = [
  { value: "STAFF ON CALL DUTY", label: "Staff on-call duty" },
  { value: "EMERGENCY USE", label: "Emergency use" },
  { value: "STOCK REFILL", label: "Stock refill" },
];

export const createCommodityMedicineFields = (
  allMedicineOptions: FormOption[],
  paginationProps?: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
  contraceptiveOptions: FormOption[] = [],
  contraceptivePaginationProps?: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
) => [
  {
    tabKey: "1",
    title: "Medicine",
    fields: [
      {
        type: "formList",
        name: "medicine",
        colSpan: 24,
        label: "Medicine",
        required: true,
        initialValue: [commodityMedicineRow()],
        newRow: commodityMedicineRow,
        fields: [
          {
            name: "medicine_purpose",
            label: "Purpose",
            placeholder: "Select purpose",
            type: "select",
            required: true,
            colSpan: 5,
            options: COMMODITY_PURPOSE,
          },
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
                "medicineName",
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
            name: "quantity_requested",
            label: "Quantity Requested",
            type: "number",
            required: true,
            colSpan: 4,
            placeholder: "Enter quantity requested",
          },
        ],
      },
    ],
  },
  {
    tabKey: "2",
    title: "Contraceptive",
    fields: [
      {
        type: "formList",
        name: "contraceptive", // changed name to avoid conflict
        colSpan: 24,
        label: "Medicine",
        required: true,
        fields: [
          {
            name: "medicine_purpose",
            label: "Purpose",
            placeholder: "Select purpose",
            type: "select",
            required: true,
            colSpan: 5,
            options: COMMODITY_PURPOSE,
          },
          {
            name: "medicineName",
            label: "Name of Contraceptive",
            type: "select",
            required: true,
            colSpan: 5,
            placeholder: "Select medicine",
            options: contraceptiveOptions,
            showSearch: true,
            fetchMore: contraceptivePaginationProps?.fetchMore,
            isLoadingMore: contraceptivePaginationProps?.isLoadingMore,
            onSearch: contraceptivePaginationProps?.onSearch,
          },
          {
            name: "quantity_requested",
            label: "Quantity Requested",
            type: "number",
            required: true,
            colSpan: 4,
            placeholder: "Enter quantity requested",
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
              if (!currentId) return false;
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
              if (!currentId) return false;
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
