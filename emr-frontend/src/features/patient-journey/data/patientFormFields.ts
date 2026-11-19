import { TextFieldType } from "@/data/types";
import {
  PatientFieldNames,
  PatientFieldLabels,
  PatientFieldPlaceholders,
  NationalityStatusOptions,
  PhoneProviderOptions,
} from "./patrientProfileconstants";
import {
  GenderOptions,
  CnicProviderOptions,
  MaritalStatusOptions,
  BloodGroupOptions,
  EducationLevelOptions,
  DwellingTypeOptions,
  OccupationOptions,
  AddictionsOptions,
} from "./patrientProfileconstants";
import { langaugeOptions } from "@/features/registerpatient/data/constants";
import { getAgeInYears } from "@/utils/ageCalculator";
import { ALLERGY_TYPE_OPTIONS, PREVIOUS_ILLNESS_OPTIONS } from "./constants";

export const getPersonalDetailsFields = (options: {
  divisions: any[];
  districtsData: any[];
  talukasData: any[];
  ucOptions: any[];
  ucPagination: any;
  handleOnClickQRCode: () => void;
  onDivisionChange?: (value: number) => void;
  onDistrictChange?: (value: number) => void;
  onTalukaChange?: (value: number) => void;
}) => {
  const {
    divisions,
    districtsData,
    talukasData,
    ucOptions,
    handleOnClickQRCode,
    onDivisionChange,
    onDistrictChange,
    onTalukaChange,
  } = options;

  return [
    {
      name: PatientFieldNames.FirstName,
      label: PatientFieldLabels.FirstName,
      type: "input",
      inputType: TextFieldType.Text,
      placeholder: PatientFieldPlaceholders.FirstName,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.LastName,
      label: PatientFieldLabels.LastName,
      type: "input",
      inputType: TextFieldType.Text,
      placeholder: PatientFieldPlaceholders.LastName,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.Guardian,
      label: PatientFieldLabels.Guardian,
      type: "input",
      inputType: TextFieldType.Text,
      placeholder: PatientFieldPlaceholders.Guardian,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.NationalityStatus,
      label: PatientFieldLabels.NationalityStatus,
      type: "radio",
      options: NationalityStatusOptions,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.CNICProvider,
      label: PatientFieldLabels.CNICProvider,
      type: "select",
      placeholder: PatientFieldPlaceholders.CNICProvider,
      options: (values: any) => {
        if (values?.[PatientFieldNames.NationalityStatus] === "Pakistani") {
          return CnicProviderOptions;
        }

        return CnicProviderOptions.filter(
          (opt) => opt.value !== "CNIC Not Available",
        );
      },
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.CNIC,
      label: PatientFieldLabels.CNIC,
      type: "maskedInput",
      placeholder: PatientFieldPlaceholders.CNIC,
      maxLength: 13,
      required: true,
      pattern: PatientFieldPlaceholders.CNIC,
      visibleIf: (values: any) =>
        values?.nationalityStatus === "Pakistani" &&
        values?.[PatientFieldNames.CNICProvider] !== "CNIC Not Available",
      colSpan: 8,
      rules: [
        {
          validator: (_: any, value: string) => {
            if (!value) {
              return Promise.resolve();
            }

            const digitsOnly = value.replace(/\D/g, "");

            if (digitsOnly.length === 13) {
              return Promise.resolve();
            }

            return Promise.reject(new Error("CNIC must be exactly 13 digits"));
          },
        },
      ],
    },
    {
      name: PatientFieldNames.InternationalId,
      label: PatientFieldLabels.InternationalId,
      type: "input",
      placeholder: PatientFieldPlaceholders.InternationalId,
      maxLength: 20,
      minLength: 6,
      required: false,
      visibleIf: (values: any) => values?.nationalityStatus === "Non-Pakistani",
      colSpan: 8,
    },
    {
      name: PatientFieldNames.PhoneRelation,
      label: PatientFieldLabels.PhoneProvider,
      type: "select",
      placeholder: PatientFieldPlaceholders.PhoneRelation,
      options: PhoneProviderOptions,
      required: true,
      colSpan: 8,
    },

    {
      name: PatientFieldNames.PhoneNumber,
      label: PatientFieldLabels.PhoneNumber,
      type: "maskedInput",
      maxLength: 11,
      placeholder: PatientFieldPlaceholders.PhoneNumber,
      pattern: PatientFieldPlaceholders.PhoneNumber,
      required: true,
      prefix: "03",
      colSpan: 8,
      rules: [
        {
          validator: (_: any, value: string) => {
            if (!value) {
              return Promise.resolve(); // allow empty if optional, or reject if required
            }

            // Remove non-digit characters (like '-') before validating
            const digitsOnly = value.replace(/\D/g, "");

            // Phone number must start with '03' and have 11 digits
            if (/^03\d{9}$/.test(digitsOnly)) {
              return Promise.resolve();
            }

            return Promise.reject(
              new Error("Phone number must be exactly 11 digits"),
            );
          },
        },
      ],
    },

    {
      name: PatientFieldNames.DateOfBirth,
      label: PatientFieldLabels.DateOfBirth,
      type: "date",
      placeholder: PatientFieldPlaceholders.DateOfBirth,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.Age,
      label: PatientFieldLabels.Age,
      type: "input",
      inputType: TextFieldType.Text,
      placeholder: PatientFieldPlaceholders.Age,
      required: true,
      colSpan: 8,
      disabled: true,
    },
    {
      name: PatientFieldNames.QR_Number,
      label: PatientFieldLabels.QR_Number,
      type: "input",
      minLength: 14,
      maxLength: 14,
      placeholder: PatientFieldPlaceholders.QrNumber,
      required: false,
      visibleIf: (values: any) => {
        if (!values?.dob) return false;
        const ageInYears = getAgeInYears(values?.dob);
        if (ageInYears === null || ageInYears === undefined) return false;
        return ageInYears < 5;
      },
      colSpan: 8,
      disabled: false,
    },
    {
      name: PatientFieldNames.Scan_Immunisation_Card,
      label: PatientFieldLabels.Scan_Immunisation_Card,
      type: "label",

      visibleIf: (values: any) => {
        if (!values?.dob) return false;
        const ageInYears = getAgeInYears(values?.dob);
        if (ageInYears === null || ageInYears === undefined) return false;
        return ageInYears && ageInYears < 5;
      },
      colSpan: 10,
      marginTop: 10,
      underline: true,
      onClick: handleOnClickQRCode,
      color: "var(--color-green-custom)",
    },
    {
      name: PatientFieldNames.Gender,
      label: PatientFieldLabels.Gender,
      type: "radio",
      options: GenderOptions,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.MaritalStatus,
      label: PatientFieldLabels.MaritalStatus,
      type: "select",
      placeholder: PatientFieldPlaceholders.MaritalStatus,
      options: MaritalStatusOptions,
      required: true,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.BloodGroup,
      label: PatientFieldLabels.BloodGroup,
      type: "select",
      placeholder: PatientFieldPlaceholders.BloodGroup,
      options: BloodGroupOptions,
      required: false,
      colSpan: 8,
    },
    {
      name: PatientFieldNames.Address,
      label: PatientFieldLabels.Address,
      type: "input",
      inputType: TextFieldType.Text,
      placeholder: PatientFieldPlaceholders.Address,
      required: true,
      colSpan: 24,
    },
    {
      name: PatientFieldNames.Division,
      label: PatientFieldLabels.Division,
      type: "select",
      placeholder: PatientFieldPlaceholders.Division,
      options: divisions,
      required: true,
      colSpan: 8,
      showSearch: true,
      onChange: onDivisionChange,
    },
    {
      name: PatientFieldNames.District,
      label: PatientFieldLabels.District,
      type: "select",
      placeholder: PatientFieldPlaceholders.District,
      options: districtsData,
      required: true,
      colSpan: 8,
      showSearch: true,
      onChange: onDistrictChange,
    },
    {
      name: PatientFieldNames.Taluka,
      label: PatientFieldLabels.TehsilTown,
      type: "select",
      placeholder: PatientFieldPlaceholders.TehsilTown,
      options: talukasData,
      colSpan: 8,
      requried: true,
      showSearch: true,
      onChange: onTalukaChange,
    },
    {
      name: PatientFieldNames.UC,
      label: PatientFieldLabels.UC,
      type: "select",
      placeholder: PatientFieldPlaceholders.UC,
      options: ucOptions,
      required: true,
      colSpan: 8,
      showSearch: true,
    },
  ].filter(Boolean);
};

export const getSociodemographicFields = () => [
  {
    name: PatientFieldNames.MotherTongue,
    label: PatientFieldLabels.MotherTongue,
    type: "select",
    required: false,
    options: langaugeOptions,
    placeholder: PatientFieldPlaceholders.MotherTongue,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.YearsOfEducation,
    label: PatientFieldLabels.YearsOfEducation,
    type: "select",
    placeholder: PatientFieldPlaceholders.YearsOfEducation,
    options: EducationLevelOptions,
    required: false,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.DwellingType,
    label: PatientFieldLabels.DwellingType,
    type: "select",
    placeholder: PatientFieldPlaceholders.DwellingType,
    options: DwellingTypeOptions,
    required: false,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.OccupationHeadOfHousehold,
    label: PatientFieldLabels.OccupationHeadOfHousehold,
    type: "select",
    placeholder: PatientFieldPlaceholders.OccupationHeadOfHousehold,
    options: OccupationOptions,
    required: false,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.HouseholdMembersCount,
    label: PatientFieldLabels.HouseholdMembersCount,
    type: "number",
    placeholder: PatientFieldPlaceholders.HouseholdMembersCount,
    required: false,
    rules: [
      {
        validator: (_: any, value: number) => {
          if (value > 30) {
            return Promise.reject(
              new Error("Household members should not exceed more than 30"),
            );
          }
          return Promise.resolve();
        },
      },
    ],
    colSpan: 8,
    disabled: false,
  },
];

export const getMedicalHistoryFields = () => [
  {
    name: PatientFieldNames.Allergies,
    label: PatientFieldLabels.Allergies,
    type: "multiselect",
    placeholder: PatientFieldPlaceholders.Allergies,
    options: ALLERGY_TYPE_OPTIONS,
    required: false,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.PreviousIllness,
    label: PatientFieldLabels.PreviousIllness,
    placeholder: PatientFieldPlaceholders.PreviousIllness,
    type: "multiselect",
    options: PREVIOUS_ILLNESS_OPTIONS,
    inputType: TextFieldType.Text,
    required: false,
    colSpan: 8,
    disabled: false,
  },
  {
    name: PatientFieldNames.AnyAddictions,
    label: PatientFieldLabels.AnyAddictions,
    type: "multiselect",
    options: AddictionsOptions,
    placeholder: PatientFieldPlaceholders.AnyAddictions,
    required: false,
    colSpan: 8,
    disabled: false,
  },
];

export const getVisitHistoryFields = () => [];
