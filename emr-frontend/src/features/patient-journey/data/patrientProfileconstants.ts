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
  QR_Number: "immunisation_number",
  Scan_Immunisation_Card: "scan_immunisation_card",
  PhoneRelation: "phone_provider",
  PhoneNumber: "phone_number",
  Address: "address",
  District: "district_id",
  Division: "division_id",
  Taluka: "taluka_id",
  UC: "uc_id",
  Guardian: "guardian_name",
  Age: "age",

  // Additional Info
  MaritalStatus: "marital_status",
  BloodGroup: "blood_group",
  MotherTongue: "mother_tongue",
  YearsOfEducation: "years_of_education",
  DwellingType: "dwelling_type",

  // Sociodemographic Info

  OccupationHeadOfHousehold: "occupation_head_of_household",
  HouseholdMembersCount: "household_members_count",

  // medical history
  Allergies: "allergies",
  PreviousIllness: "previous_illness",
  PreviousMedicines: "previous_medicines",
  AnyAddictions: "addictions",
} as const;

// Labels for displaying in UI
export const PatientFieldLabels = {
  NationalityStatus: "Nationality Status",
  InternationalId: "International ID / Passport number",
  CNICProvider: "CNIC/National ID Provider",
  CNIC: "CNIC",
  MRNo: "MR No.",
  FirstName: "First Name",
  Scan_Immunisation_Card: "Immunisation card QR",
  Other: "Other's CNIC",
  LastName: "Last Name",
  DateOfBirth: "Date of Birth",
  Gender: "Sex",
  QR_Number: "Immunisation QR number",
  PhoneProvider: "Phone Relation",
  PhoneNumber: "Phone Number",
  Age: "Age",
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
  YearsOfEducation: "Years of Education",
  Religion: "Religion",

  // Sociodemographic Info
  DwellingType: "Dwelling Type",
  OccupationHeadOfHousehold: "Occupation of Head of Household",
  HouseholdMembersCount: "Household Members Count",

  // Medical History
  Allergies: "Allergies",
  PreviousIllness: "Previous Illness",
  PreviousMedicines: "Previous Medicines",
  AnyAddictions: "Any Addictions",
} as const;

// Placeholders for inputs
export const PatientFieldPlaceholders = {
  NationalityStatus: "Select",
  InternationalId: "Enter ID",
  CNICProvider: "Select identity provider",
  Other: "Enter Other's",
  CNIC: "XXXXX-XXXXXXX-X",
  QrNumber: "Enter QR number",
  MRNo: "Auto-generated",
  FirstName: "Enter first name",
  LastName: "Enter last name",
  DateOfBirth: "Select date of birth",
  Gender: "Select gender",
  PhoneRelation: "Select relation",
  PhoneNumber: "03XX-XXXXXXX",
  Age: "Enter Age",
  Address: "Enter full address",
  District: "Select district",
  Division: "Select Division",
  TehsilTown: "Select Taluka",
  UC: "Select UC",
  Guardian: "Enter father's/husband's name",

  // Additional Info
  MaritalStatus: "Select marital status",
  BloodGroup: "Select blood group",
  MotherTongue: "Enter mother tongue",
  YearsOfEducation: "Select Education",
  Religion: "Enter religion",

  // Sociodemographic Info
  DwellingType: "Select Dwelling Type",
  OccupationHeadOfHousehold: "Select Occupation",
  HouseholdMembersCount: "Enter number of members",

  // Medical History
  Allergies: "Select known allergies",
  PreviousIllness: "Enter previous illnesses",
  PreviousMedicines: "Enter previous medicines",
  AnyAddictions: "Enter any addictions",
} as const;

// Dropdown options

export const GenderOptions = ["Male", "Female", "Other"];

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
  // { label: "Masters or above", value: "Masters or above" },
];

export const AllergiesOptions = [
  { value: "pollen", label: "Pollen" },
  { value: "dust", label: "Dust" },
  { value: "penicillin", label: "Penicillin" },
  { value: "other", label: "Other" },
];

export const AddictionsOptions = [
  { label: "Tobaco", value: "Tobaco" },
  { label: "Alcohal", value: "Alcohal" },
  { label: "Others", value: "Other" },
];

export const PreviousIllnessOptions = [
  { value: "hypertension", label: "Hypertension" },
  { value: "diabetes", label: "Diabetes" },
  { value: "ischemic_heart_disease", label: "Ischemic heart disease/MI" },
  { value: "heart_failure", label: "Heart failure" },
  { value: "stroke", label: "Stroke" },
  { value: "asthma", label: "Asthma" },
  { value: "copd", label: "COPD" },
  { value: "tuberculosis", label: "Tuberculosis" },
  { value: "hepatitis_b", label: "Hepatitis B" },
  { value: "hepatitis_c", label: "Hepatitis C" },
  { value: "chronic_kidney_disease", label: "Chronic kidney disease" },
  { value: "thyroid_disease", label: "Thyroid disease" },
  { value: "dyslipidemia", label: "Dyslipidemia" },
  { value: "anemia", label: "Anemia" },
  { value: "bleeding_clotting_disorder", label: "Bleeding/clotting disorder" },
  { value: "peptic_ulcer", label: "Peptic ulcer" },
  { value: "epilepsy_seizure_disorder", label: "Epilepsy / Seizure disorder" },
  { value: "hiv", label: "HIV" },
  { value: "autoimmune_disease", label: "Autoimmune disease" },
  { value: "cancer", label: "Cancer" },
  { value: "major_surgery", label: "Major surgery" },
  { value: "psychiatric_related", label: "Psychiatric-related" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
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
