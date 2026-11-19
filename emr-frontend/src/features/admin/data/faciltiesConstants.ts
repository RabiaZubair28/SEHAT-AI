import { TextFieldType, FormElementType } from "@/data/types";
import { FieldConfig } from "@/components/shared/AdvanceSearch";

export const facilitiesData = [
  {
    id: 1,
    division: "North Division",
    code: "FAC001",
    district: "District A",
    facilityName: "Sunrise Clinic",
  },
  {
    id: 2,
    division: "South Division",
    code: "FAC002",
    district: "District B",
    facilityName: "Greenfield Hospital",
  },
  {
    id: 3,
    division: "East Division",
    code: "FAC003",
    district: "District C",
    facilityName: "Wellness Center",
  },
  {
    id: 4,
    division: "West Division",
    code: "FAC004",
    district: "District D",
    facilityName: "Riverbend Facility",
  },
];

export const facilityFormFields: {
  name: string;
  label: string;
  type: FormElementType;
  inputType?: TextFieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[] | string[];
  disabled?: boolean;
}[] = [
    {
      name: "division",
      label: "Division",
      type: "select",
      options: [
        { label: "Karachi", value: "Karachi" },
        { label: "Sukkur", value: "Sukkur" },
        { label: "Larkana", value: "Larkana" },
        { label: "Badin", value: "Badin" },
      ],
      required: true,

    },
    {
      name: "code",
      label: "Facility Code",
      type: "input",
      inputType: TextFieldType.Text,
      required: true,

    },
    {
      name: "district",
      label: "District",
      type: "select",
      required: true,
      options: [
        { label: "Karachi", value: "Karachi" },
        { label: "Sukkur", value: "Sukkur" },
        { label: "Larkana", value: "Larkana" },
        { label: "Badin", value: "Badin" },
      ],
    },
    {
      name: "facilityName",
      label: "Facility Name",
      type: "input",
      inputType: TextFieldType.Text,
      required: true,
    },
  ];

export const advanceSearchData: FieldConfig[] = [
  {
    type: "input",
    label: "Facility Name",
    name: "name",
    placeholder: "Search by facility name",
  },
  {
    type: "input",
    label: "Facility Code",
    name: "code",
    placeholder: "Search by facility code",
  },
];
