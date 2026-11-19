import { RowProps } from "antd";
import { Dayjs } from "dayjs";

export type ServiceType = 
  | "OPD" 
  | "ANC" 
  | "DELIVERY" 
  | "PNC" 
  | "FAMILY_PLANNING" 
  | "IMMUNISATION" 
  | "NUTRITION" 
  | "MEDICINE_DISPENSING";

export const SERVICE_TYPE_OPTIONS: Array<{
  label: string;
  value: ServiceType;
}> = [
  { label: "OPD", value: "OPD" },
  { label: "ANC", value: "ANC" },
  { label: "Delivery", value: "DELIVERY" },
  { label: "PNC", value: "PNC" },
  { label: "Family Planning", value: "FAMILY_PLANNING" },
  { label: "Immunisation", value: "IMMUNISATION" },
  { label: "Nutrition", value: "NUTRITION" },
  { label: "Medicine Dispensing", value: "MEDICINE_DISPENSING" },
];


export enum TextFieldType {
  Text = "text",
  Email = "email",
  Password = "password",
  Number = "number",
}

export type FormElementType =
  | "input"
  | "select"
  | "multiselect"
  | "radio"
  | "date"
  | "time"
  | "checkbox"
  | "singleCheckbox"
  | "formList"
  | "formList_unscrollable"
  | "number"
  | "maskedInput"
  | "label"
  | "table"
  | "compactfield"
  | "decimal"
  | "textarea"
  | "statusTag"
  | "button"
  | "buttonGroup"
  | "statusTagNewborn";

export enum Roles {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  FACILITY_INCHARGE = "facility_incharge",
  FRONT_DESK = "registration_clerk",
  MEDICAL_OFFICER_MALE = "medical_officer_male",
  MEDICAL_OFFICER_FEMALE = "medical_officer_female",
  VACCINATOR = "vaccinator",
  LHV = "lhv",
  DISPENSER = "dispenser",
  SBA = "sba",
  PAEDS = "paeds",
  TELEHEALTH_CONSULTANT = "telehealth_consultant",
  HEAD_OFFICE = "head_office",

}

export type UserRole = `${Roles}`;

export interface PermissionPayload {
  name: string;
  route: string;
  method: string;
  module: string;
  description: string;
}

export interface Permission {
  id: number;
  payload: PermissionPayload[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  id: number;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: number;
  name: string;
  code: number;
  facility_type: string;
  managed_by: string;
  is_24_7: boolean;
  bmu: boolean;
  otp: boolean;
  nsc: boolean;
  lat: number;
  long: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: UserRole;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  facility: Facility;
  personalInfo: any;
  userPermissions: UserPermissions;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  services?: Service[] | null;
}

// src/constants/methods.ts
export enum Methods {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
  // add more HTTP methods if necessary
}

export interface Route {
  route: string;
  name: string;
  method: string;
  description: string;
  module: string;
  guards?: string[];
  hidden?: string[];
}

export type PermissionHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface PermissionPayloadItemSlim {
  route: string;
  method: PermissionHttpMethod;
}

// types.ts

export interface AdditionalInfo {
  guardian_name: string;
  marital_status: string;
  blood_group: string;
}

export interface SocialDeterminants {
  dwelling_type: string;
  occupation_head_of_household: string;
  household_members_count: number;
  years_of_education: string;
  mother_tongue: string;
}

export interface MedicalHistory {
  allergies: string[];
  previous_illness: string[];
  addictions: string[];
}

// src/constants/httpStatus.ts

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  CONFLICT = 409,
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
}

export interface PatientSearchAppointment {
  id: number;
  status: string;
}

export interface PatientSearchResult {
  id: number;
  mr_no: string;
  first_name: string;
  last_name: string;
  cnic: string | null;
  phone_number: string;
  dob: string;
  gender: string;
  appointments: PatientSearchAppointment[];
}

export interface Patient {
  message: string;
  success: any;
  status?: any;
  response?: any;
  data?: any;
  id: number;
  mr_no: string;
  cnic_provider: string;
  cnic: string;
  first_name: string;
  last_name: string;
  dob: string;
  other_cnic_provider: string;
  gender: string;
  phone_number: string;
  address: string;
  epi_number: number;
  division_id: number;
  district_id: number;
  taluka_id: number;
  uc_id: number;
  additional_info: AdditionalInfo;
  social_determinants: SocialDeterminants;
  medical_histories?: MedicalHistory;
  appointments?: any[];
}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  cnic?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  mr_no?: string;
  // search?: string;
  // district_id?: number;
  // facility_id?: number;
  // [key: string]: any;
}

export interface PatientFormValues {
  first_name: string;
  last_name: string;
  cnic: string;
  cnic_provider: string;
  dob: string; // expected in ISO format like "YYYY-MM-DDTHH:mm:ss"
  gender: string;
  phone_provider: string;
  phone_number: string;
  address: string;
  age: number | string;
  other_cnic_provider: string;
  division_id: number;
  district_id: number;
  taluka_id: number;
  uc_id: number;
  guardian_name: string;
  marital_status: string;
  blood_group: string;
  mother_tongue: string;
  occupation_head_of_household: string;
  household_members_count: number;
  years_of_education: string;
  dwelling_type: string;
  qr_number: string | number;
  international_id: string;
  nationalityStatus: string;
  international_provider: string;
}
export interface ApiResponse {
  success: boolean;
  code?: number;
  message?: string;
  error?: string;
  data?: any;
}

export interface ReferralIn {
  patient_id: number;
  service_id: number;
}

export interface ReferralOut {
  patient_id: number;
  district_id: number;
  facility_id: number;
  level_of_care: string;
  refer_out_reason: string;
  type_of_service: string;
  type: "external";
}

export interface FormFieldConfig {
  fields?: any;
  name?: string;
  subFields?: any;
  titlePrefix?: string;
  justifyContent?: string;
  justifyItems?: string;
  marginBottom?: number;
  tableTitle?: string;
  showSummary?: boolean;
  getGroupFields?: (index: number, formValues?: any) => FormFieldConfig[];
  prefix?: string;
  index?: number;
  color?: any;
  dataCount?: (formValues?: any) => number;
  textAlign?: any;
  justify?: RowProps["justify"];
  initialValue?: any;
  /** formList: builds the value for a row created by the Add button. */
  newRow?: () => any;
  marginTop?: number;
  flex?: string;
  fontSize?: number;
  onClick?: (index?: any, itemId?: any) => void;
  label?: string;
  type?: FormElementType;
  minItems?: number;
  inputType?: TextFieldType;
  underline?: any;
  formValues?: any;
  buttons?: any;
  step?: any;
  precision?: number;
  placeholder?: string;
  // required?: boolean;
  showSearch?: boolean;
  rows?: any;
  isLoadingMore?: boolean;
  allowFutureDates?: boolean;
  disablePastDates?: boolean;
  maxLength?: number;
  allowAdd?: boolean;
  allowRemove?: boolean;
  minLength?: number;
  colSpan?: number;
  pattern?: string;
  onChange?: (index?: any, value?: any) => void;
  // rules?: Rule[];
  fetchMore?: () => void;
  options?:
    | any[]
    | ((formValues?: any, index?: number, parentIndex?: number) => any[]);
  disabled?: boolean;
  filterOption?: boolean | ((input: string, option: any) => boolean);
  onSearch?: (value: string) => void;
  searchLoading?: boolean;
  visibleIf?: (formValues: any) => boolean;
  buttonType?: "link" | "text" | "default" | "primary" | "dashed";
  danger?: boolean;
  itemId?: any;
  size?: "small" | "middle" | "large";
  style?: React.CSSProperties;
  parentIndex?: number;
  addButtonText?: string;
  showItemTitle?: boolean;
  itemTitlePrefix?: string;
  recordsSource?: string;
  disabledDate?: (date: Dayjs) => boolean;
  rules?:
    | Rule[]
    | ((formValues?: any, index?: number, parentIndex?: number) => Rule[]);
  required?:
    | boolean
    | ((formValues?: any, index?: number, parentIndex?: number) => boolean);
}

type Rule = {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  validator?: (rule: any, value: any) => Promise<void>;
  // ... other rule properties
};

export type PatientRouteContext = {
  patientId: string;
};

// warningRules.ts
export interface WarningRule {
  fieldName: string;
  getMessage: (values: any) => any; // null if no warning
  level: "high" | "medium" | "info";
}

export interface ApiErrorResponse {
  data?: {
    error?: string;
    message?: string | string[];
    statusCode?: number;
  };
  status?: number;
}

export interface ApiSuccessResponse<T = any> {
  success: boolean;
  code: number;
  data: T;
  status: number;
  message: string;
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  inputType?: string;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
  colSpan?: number;
  options?:
  | Array<{ label: string; value: string | number }>
  | ((formValues: any) => Array<{ label: string; value: string | number }>);
  // options?: Array<{ label: string; value: string | number }>;
  onChange?: (value: any) => void;
  rules?: any[];
  pattern?: string;
  maxLength?: number;
  marginBottom?: number;
  marginTop?: number;
  visibleIf?: (formValues: any) => boolean;
  disabled?: boolean;
  showSearch?: boolean;
  fetchMore?: () => void;
  isLoadingMore?: boolean;
  onSearch?: (value: string) => void;
  filterOption?: boolean;
  underline?: boolean;
  onClick?: () => void;
  color?: string;
  minLength?: number;
}

export interface FormSection {
  key: string;
  title: string;
  fields: FormField[];
}

interface StockRefillItem {
  medicineVariantId: number;
  quantityRequested: number;
  purpose: string;
}

export interface StockRefillPayload {
  notes: string | undefined;
  items: StockRefillItem[];
}

export interface UpdateCommodityRequestStatusPayload {
  status: string;
  notes?: string;
  items?: {
    itemId: number;
    status: string;
    quantityDispensed: number;
  }[];
  rejectionReason?: string;
}

export interface DispenseItem {
  itemId: number;
  quantityDispensed: number | null;
  notes: string;
  status?: string;
}

export interface DispensePayload {
  status: string;
  items: DispenseItem[];
  rejectionReason?: string; // Add this to the interface
}

/** ---- Core Entity ---- */

export interface MedicineVariant {
  id: number;
  medicineName: string;
  genericName: string;
  strength: string;
  category: string;
  isContraceptive: boolean;
  unit?: string;
}

export interface CommodityItem {
  id: number;
  medicineVariant: MedicineVariant;
  purpose?: string;
  quantityRequested: number;
  quantityDispensed: number | null;
  status: string;
  notes: string | null;
}

export interface CommodityRequest {
  id: number;
  initiatorRole: string;
  requesterId: number;
  requesterName: string;
  issuedTo: string | null;
  issueFrom?: string | null;
  issuedToStaffId: number | null;
  purpose: string;
  items: CommodityItem[];
  status: string;
  createdAt: string;
  rejectionReason?: string | null;
  totalItems: number;
  totalQuantityRequested: number;
  totalQuantityDispensed: number;
  approvedBy?: string | null;
  rejectedBy?: string | null;
}

/** ---- List / Pagination ---- */
export interface GetCommodityRequestsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CommodityRequestListResponse {
  data: CommodityRequest[];
  // total: number;
  // page: number;
  // limit: number;
  // totalPages: number;
}

/** ---- Statistics ---- */
export interface CommodityRequestSummary {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  fulfilled: number;
}
