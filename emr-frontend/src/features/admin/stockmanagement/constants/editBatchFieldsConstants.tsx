import { FormFieldConfig, TextFieldType } from "@/data/types";
import type { Dayjs } from "dayjs";

export interface EditBatchFormValues {
  batchNumber: string;
  purchaseDate: Dayjs | null;
  expiryDate: Dayjs | null;
  stockQuantity: number;
  otc: boolean;
  limitQuantity: number | null;
}

export const editBatchFields: FormFieldConfig[] = [
  {
    name: "batchNumber",
    label: "Batch Number",
    type: "input",
    inputType: TextFieldType.Text,
    colSpan: 12,
    required: true,
    placeholder: "Enter batch number",
  },
  {
    name: "purchaseDate",
    label: "Purchase Date",
    type: "date",
    colSpan: 12,
    required: true,
    placeholder: "Select purchase date",
  },
  {
    name: "expiryDate",
    label: "Expiry Date",
    type: "date",
    allowFutureDates: true,
    disablePastDates: true,
    colSpan: 12,
    required: true,
    placeholder: "Select expiry date",
  },
  {
    name: "stockQuantity",
    label: "Stock Quantity",
    type: "number",
    colSpan: 12,
    required: true,
    placeholder: "Enter stock quantity",
  },
  {
    name: "otc",
    label: "Is OTC?",
    type: "singleCheckbox",
    colSpan: 12,
    required: false,
  },
  {
    name: "limitQuantity",
    label: "OTC Limit Quantity",
    type: "number",
    colSpan: 12,
    placeholder: "Enter limit quantity",
    required: false,
    visibleIf: (formValues: EditBatchFormValues) => {
      return formValues.otc;
    },
  },
];
