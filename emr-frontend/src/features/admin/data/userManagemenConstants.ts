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
  {
    type: "select",
    label: "Status",
    name: "status",
    placeholder: "Select status",
    options: [
      { label: "Approved", value: "approved" },
      { label: "Pending", value: "pending" },
      { label: "Rejected", value: "rejected" },
    ],
  },
];

export const approvalOptions = [
  { label: "Approve", value: "approved" },
  { label: "Reject", value: "rejected" },
];

export const userModalConfig = {
  addTitle: "Add New User",
  editTitle: "Edit User",
};

export enum UserStatus {
  APPROVED = "approved",
  PENDING = "pending",
  REJECTED = "rejected",
}
