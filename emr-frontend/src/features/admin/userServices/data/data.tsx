import { FieldConfig } from "@/components/shared/AdvanceSearch";

export const advanceSearchData: FieldConfig[] = [
  {
    type: "input",
    label: "First Name",
    name: "first_name",
    placeholder: "Search by first name",
  },
  {
    type: "input",
    label: "Last Name",
    name: "last_name",
    placeholder: "Search by last name",
  },
  {
    type: "input",
    label: "Email",
    name: "email",
    placeholder: "Search by email",
  },

];
