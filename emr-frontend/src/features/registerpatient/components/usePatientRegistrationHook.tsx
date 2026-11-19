import { useState, useEffect } from "react";
import { TextFieldType } from "@/data/types";
import {
  PatientFieldNames,
  PatientFieldLabels,
  PatientFieldPlaceholders,
  CnicProviderOptions,
  MaritalStatusOptions,
  BloodGroupOptions,
  EducationLevelOptions,
  OccupationOptions,
  DwellingTypeOptions,
  GenderOptions,
  langaugeOptions,
  NationalityStatusOptions,
  PhoneProviderOptions,
} from "@/features/registerpatient/data/constants";
import { FormSection } from "@/data/types";
import { useLocationCascade } from "@/hooks/useLocationCascade";
import { getAgeInYears } from "@/utils/ageCalculator";

const usePatientRegistration = () => {
  const [formFields, setFormFields] = useState<FormSection[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);

  const {
    locationOptions,
    isLocationLoading,
    handlers: { onDivisionChange, onDistrictChange, onTalukaChange },
  } = useLocationCascade();

  const onQRTextClick = () => {
    setShowQRModal(true);
  };

  useEffect(() => {
    setFormFields([
      {
        key: "1",
        title: "Personal Details",
        fields: [
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
              if (
                values?.[PatientFieldNames.NationalityStatus] === "Pakistani"
              ) {
                return CnicProviderOptions;
              }

              return CnicProviderOptions.filter(
                (opt) => opt.value !== "CNIC Not Available",
              );
            },
            required: true,
            colSpan: 8,
            showSearch: true,
          },
          {
            name: PatientFieldNames.CNIC,
            label: PatientFieldLabels.CNIC,
            type: "maskedInput",
            placeholder: PatientFieldPlaceholders.CNIC,
            maxLength: 13,
            required: true,
            pattern: PatientFieldPlaceholders.CNIC,
            colSpan: 8,
            visibleIf: (values: any) =>
              values?.[PatientFieldNames.NationalityStatus] === "Pakistani" &&
              values?.[PatientFieldNames.CNICProvider] !== "CNIC Not Available",
            rules: [
              {
                validator: (_: any, value: string) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  // Remove all non-digit characters (like '-') before counting
                  const digitsOnly = value.replace(/\D/g, "");

                  if (digitsOnly.length === 13) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("CNIC must be exactly 13 digits"),
                  );
                },
              },
            ],
          },
          {
            name: PatientFieldNames.InternationalId,
            label: PatientFieldLabels.InternationalId,
            type: "input",
            placeholder: PatientFieldPlaceholders.InternationalId,
            minLength: 6,
            maxLength: 20,
            required: false,
            visibleIf: (values: any) =>
              values?.nationalityStatus === "Non-Pakistani",
            colSpan: 8,
          },
          {
            name: PatientFieldNames.PhoneRelation,
            label: PatientFieldLabels.PhoneRelation,
            type: "select",
            placeholder: PatientFieldPlaceholders.PhoneRelation,
            options: PhoneProviderOptions,
            required: true,
            colSpan: 8,
            showSearch: true,
          },
          {
            name: PatientFieldNames.PhoneNumber,
            label: PatientFieldLabels.PhoneNumber,
            type: "maskedInput",
            maxLength: 11,
            placeholder: PatientFieldPlaceholders.PhoneNumber,
            pattern: PatientFieldPlaceholders.PhoneNumber,
            required: true,
            colSpan: 8,
            prefix: "03",
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
                    new Error(
                      "Phone number must be 11 digits (e.g., 03XX-XXXXXXX)",
                    ),
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
            type: "number",
            inputType: TextFieldType.Text,
            placeholder: PatientFieldPlaceholders.Age,
            required: false,
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
              return ageInYears < 5;
            },
            colSpan: 10,
            marginTop: 10,
            underline: true,
            onClick: onQRTextClick,
            color: "var(--color-green-custom)",
          },
          {
            name: PatientFieldNames.Gender,
            label: PatientFieldLabels.Gender,
            type: "radio",
            options: GenderOptions,
            required: true,
            colSpan: 10,
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
            required: false,
            type: "select",
            placeholder: PatientFieldPlaceholders.BloodGroup,
            options: BloodGroupOptions,
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
            onChange: onDivisionChange,
            options: locationOptions.divisions,
            required: true,
            colSpan: 8,
            showSearch: true,
          },
          {
            name: PatientFieldNames.District,
            label: PatientFieldLabels.District,
            type: "select",
            placeholder: PatientFieldPlaceholders.District,
            onChange: onDistrictChange,
            options: locationOptions.districts,
            required: true,
            colSpan: 8,
            showSearch: true,
          },
          {
            name: PatientFieldNames.Taluka,
            label: PatientFieldLabels.TehsilTown,
            type: "select",
            placeholder: PatientFieldPlaceholders.TehsilTown,
            onChange: onTalukaChange,
            options: locationOptions.talukas,
            required: true,
            colSpan: 8,
            showSearch: true,
          },
          {
            name: PatientFieldNames.UC,
            label: PatientFieldLabels.UC,
            type: "select",
            placeholder: PatientFieldPlaceholders.UC,
            options: locationOptions.ucs,
            required: true,
            colSpan: 8,
            showSearch: true,
          },
        ],
      },
      {
        key: "2",
        title: "Sociodemographic Details",
        fields: [
          {
            name: PatientFieldNames.MotherTongue,
            label: PatientFieldLabels.MotherTongue,
            type: "select",
            options: langaugeOptions,
            required: false,
            placeholder: PatientFieldPlaceholders.MotherTongue,
            colSpan: 8,
          },
          {
            name: PatientFieldNames.YearsOfEducation,
            label: PatientFieldLabels.YearsOfEducation,
            type: "select",
            placeholder: PatientFieldPlaceholders.YearsOfEducation,
            options: EducationLevelOptions,
            required: false,
            colSpan: 8,
          },
          {
            name: PatientFieldNames.DwellingType,
            label: PatientFieldLabels.DwellingType,
            type: "select",
            placeholder: PatientFieldPlaceholders.DwellingType,
            options: DwellingTypeOptions,
            required: false,
            colSpan: 8,
          },
          {
            name: PatientFieldNames.OccupationHeadOfHousehold,
            label: PatientFieldLabels.OccupationHeadOfHousehold,
            type: "select",
            placeholder: PatientFieldPlaceholders.OccupationHeadOfHousehold,
            options: OccupationOptions,
            required: false,
            colSpan: 8,
          },
          {
            name: PatientFieldNames.HouseholdMembersCount,
            label: PatientFieldLabels.HouseholdMembersCount,
            type: "number",
            placeholder: PatientFieldPlaceholders.HouseholdMembersCount,
            required: false,
            rules: [
              {
                validator: async (_: number, value: number) => {
                  // assuming 'value' contains number of household members
                  if (value && Number(value) > 30) {
                    return Promise.reject(
                      new Error(
                        "Household members should not exceed more than 30",
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ],
            colSpan: 8,
          },
        ],
      },
    ]);
  }, [locationOptions]);

  return {
    formFields,
    isLocationLoading,
    showQRModal,
    setShowQRModal,
  };
};

export default usePatientRegistration;
