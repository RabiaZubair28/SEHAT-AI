export const PatientFieldNames = {
  NationalityStatus: "nationalityStatus",
  InternationalId: "international_id",
  CNICProvider: "cnic_provider",
  CNIC: "cnic",
  Other: "other_cnic_provider",
  FirstName: "first_name",
  LastName: "last_name",
  DateOfBirth: "dob",
  Gender: "gender",
  PhoneRelation: "phone_provider",
  PhoneNumber: "phone_number",
  Address: "address",
  District: "district_id",
  Division: "division_id",
  Taluka: "taluka_id",
  UC: "uc_id",
  Guardian: "guardian_name",
  Age: "age",
  QR_Number: "qr_number",
  Scan_Immunisation_Card: "scan_immunisation_card",

  // Additional Info
  MaritalStatus: "marital_status",
  BloodGroup: "blood_group",
  MotherTongue: "mother_tongue",
  YearsOfEducation: "years_of_education",
  DwellingType: "dwelling_type",

  // Sociodemographic Info
  OccupationHeadOfHousehold: "occupation_head_of_household",
  HouseholdMembersCount: "household_members_count",
} as const;

export const PatientFieldLabels = {
  InternationalId: "International ID / Passport number",
  NationalityStatus: "Nationality Status",
  CNICProvider: "CNIC/National ID Provider",
  CNIC: "CNIC",
  MRNo: "MR No.",
  FirstName: "First Name",
  Other: "Other's CNIC",
  LastName: "Last Name",
  DateOfBirth: "Date of Birth",
  Gender: "Sex",
  PhoneRelation: "Phone Relation",
  PhoneNumber: "Phone Number",
  Age: "Age",
  QR_Number: "Immunisation QR number",
  Scan_Immunisation_Card: "Immunisation card QR",
  Guardian: "Father's/ Husband's Name",
  Address: "Address",
  District: "District",
  Division: "Division",
  TehsilTown: "Taluka",
  UC: "UC",

  // Additional Info
  MaritalStatus: "Marital Status",
  BloodGroup: "Blood Group",
  MotherTongue: "Mother Tongue",
  YearsOfEducation: "Level of Education",
  Religion: "Religion",

  // Sociodemographic Info
  DwellingType: "Dwelling Type",
  OccupationHeadOfHousehold: "Occupation of Head of Household",
  HouseholdMembersCount: "Household Members Count",
} as const;

export const PatientFieldPlaceholders = {
  InternationalId: "Enter ID",
  NationalityStatus: "Select",
  CNICProvider: "Select Identity provider",
  Other: "Enter Other's",
  CNIC: "XXXXX-XXXXXXX-X",
  MRNo: "Auto-generated",
  FirstName: "Enter first name",
  LastName: "Enter last name",
  DateOfBirth: "Select date of birth",
  Gender: "Select gender",
  PhoneRelation: "Select relation",
  PhoneNumber: "03XX-XXXXXXX",
  QrNumber: "Enter QR number",
  Age: "Age",
  Address: "Enter full address",
  District: "Select district",
  Division: "Select division",
  TehsilTown: "Select taluka",
  UC: "Select UC",
  Guardian: "Enter father's/husband's name",

  // Additional Info
  MaritalStatus: "Select marital status",
  BloodGroup: "Select blood group",
  MotherTongue: "Enter mother tongue",
  YearsOfEducation: "Select education",
  Religion: "Enter religion",

  // Sociodemographic Info
  DwellingType: "Select dwelling type",
  OccupationHeadOfHousehold: "Select occupation",
  HouseholdMembersCount: "Enter number of members",
} as const;

// Dropdown options
export const GenderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

export const NationalityStatusOptions = [
  { label: "Pakistani", value: "Pakistani" },
  { label: "Non-Pakistani", value: "Non-Pakistani" },
];

export const BloodGroupOptions = [
  { label: "A +ve", value: "A +ve" },
  { label: "A -ve", value: "A -ve" },
  { label: "B +ve", value: "B +ve" },
  { label: "B -ve", value: "B -ve" },
  { label: "AB +ve", value: "AB +ve" },
  { label: "AB -ve", value: "AB -ve" },
  { label: "O +ve", value: "O +ve" },
  { label: "O -ve", value: "O -ve" },
];

export const MaritalStatusOptions = [
  { label: "Single", value: "Single" },
  { label: "Married", value: "Married" },
  { label: "Divorced", value: "Divorced" },
  { label: "Widowed", value: "Widowed" },
  { label: "Other", value: "Other" },
];

export const langaugeOptions = [
  { label: "Urdu", value: "Urdu" },
  { label: "Sindhi", value: "Sindhi" },
  { label: "Siraiki", value: "Siraiki" },
  { label: "Punjabi", value: "Punjabi" },
  { label: "Pashto", value: "Pashto" },
  { label: "Balochi", value: "Balochi" },
  { label: "Balti", value: "Balti" },
  { label: "Farsi", value: "Farsi" },
  { label: "Dari", value: "Dari" },
  { label: "Brohi", value: "Brohi" },
  { label: "Dharki", value: "Dharki" },
  { label: "Wakhi", value: "Wakhi" },
  { label: "Others", value: "Others" },
];

export const CnicProviderOptions = [
  { label: "Self", value: "Self" },
  { label: "Mother", value: "Mother" },
  { label: "Father", value: "Father" },
  { label: "Sibling", value: "Sibling" },
  { label: "Spouse", value: "Spouse" },
  {
    label: "Uncle/Aunt (blood-relation)",
    value: "Uncle/Aunt (blood-relation)",
  },
  { label: "Guardian", value: "Guardian" },
  { label: "CNIC Not Available", value: "CNIC Not Available" },
  { label: "Other", value: "Other" },
];

export const PhoneProviderOptions = [
  { label: "Self", value: "Self" },
  { label: "Mother", value: "Mother" },
  { label: "Father", value: "Father" },
  { label: "Sibling", value: "Sibling" },
  { label: "Spouse", value: "Spouse" },
  {
    label: "Uncle/Aunt (blood-relation)",
    value: "Uncle/Aunt (blood-relation)",
  },
  { label: "Guardian", value: "Guardian" },
  { label: "Other", value: "Other" },
];

export const EducationLevelOptions = [
  { label: "No formal education", value: "No formal education" },
  { label: "Primary", value: "Primary" },
  { label: "Secondary", value: "Secondary" },
  { label: "Intermediate", value: "Intermediate" },
  { label: "Diploma", value: "Diploma" },
  { label: "Bachelor or higher", value: "Bachelor or higher" },
];

export const OccupationOptions = [
  { label: "Laborer", value: "Laborer" },
  { label: "Farmer", value: "Farmer" },
  { label: "Government employee", value: "Government employee" },
  { label: "Private employee", value: "Private employee" },
  { label: "Shopkeeper", value: "Shopkeeper" },
  { label: "Business", value: "Business" },
  { label: "Landlord", value: "Landlord" },
  { label: "Others", value: "Others" },
];

export const DwellingTypeOptions = [
  { label: "Pakka home", value: "Pakka home" },
  { label: "Semi-pakka home", value: "Semi-pakka home" },
  { label: "Katcha home", value: "Katcha home" },
];

export const IncomeRangeOptions = [
  { label: "Less than PKR 20,000", value: "Less than PKR 20,000" },
  { label: "PKR 20,000 - 40,000", value: "PKR 20,000 - 40,000" },
  { label: "PKR 40,000 - 60,000", value: "PKR 40,000 - 60,000" },
  { label: "PKR 60,000 - 80,000", value: "PKR 60,000 - 80,000" },
  { label: "PKR 80,000 - 100,000", value: "PKR 80,000 - 100,000" },
  { label: "Above 100,000", value: "Above 100,000" },
];

export const PATIENT_MESSAGES = {
  SUCCESS: {
    type: "success",
    title: "Patient Created",
    description: "The patient has been successfully added.",
  },
  FAILURE: {
    type: "error",
    title: "Patient Creation Failed",
    description: "An error occurred while adding the patient.",
  },
};

export enum NationalityStatus {
  PAKISTANI = "Pakistani",
  NON_PAKISTANI = "Non-Pakistani",
}

export const NationalityOptions = [
  { label: NationalityStatus.PAKISTANI, value: NationalityStatus.PAKISTANI },
  {
    label: NationalityStatus.NON_PAKISTANI,
    value: NationalityStatus.NON_PAKISTANI,
  },
];
