import { TextFieldType } from "@/data/types";
import {
  LEVEL_OF_CARE,
  PLACE_OF_DELIVERY_OPTIONS,
  PlaceOfDelivery,
  YES_NO_OPTIONS,
} from "./constants";

const isPrivateOrInformal = (v: any) =>
  v?.place === PlaceOfDelivery.PRIVATE_FACILITY ||
  v?.place === PlaceOfDelivery.INFORMAL_DELIVERY_CENTER;

// ES-775: If any of them are empty, we do not disable so the form does not get stuck in an unsubmittable state.
export const LOCATION_FIELDS = [
  "place",
  "levelOfCare",
  "district",
  "taluka",
  "facility",
  "otherPlace",
  "otherFacility",
];

const IMMUNISATION_RECORD_FIELDS = [
  {
    label: "Vaccine name",
    type: "input",
    disabled: true,
    name: "vaccine",
    colSpan: 6,
    required: true,
    style: { color: "#000" },
  },
  {
    label: "Due Date",
    type: "input",
    disabled: true,
    name: "dueDate",
    colSpan: 5,
    placeholder: "Due Date",
    style: { color: "#000" },
  },

  {
    label: "Date of vaccine administration",
    name: "administration_date",
    type: "date",
    required: (values: any, index: number) => {
      // ES-804: date should be required when vaccine is administered checkbox is true
      const record = values?.immunization_records?.[index];
      return !!record?.immunization_status;
    },
    colSpan: 5,
    placeholder: "Select due date",
    allowFutureDates: false,
    disabled: (values: any, index: number) => {
      const record = values?.immunization_records?.[index];
      return (
        record?.isAlreadyAdministered || record?.dosageStatus === "Pending" || record?.dosageStatus === "Expired" || record?.dosageStatus === "Not Eligible"
      );
    },
  },

  {
    label: "Administered",
    type: "singleCheckbox",
    name: "immunization_status",
    colSpan: 3,
    required: (values: any, index: number) => {
      const record = values?.immunization_records?.[index];
      return !!record?.administration_date;
    },
    rules: (values: any, index: number) => {
      const record = values?.immunization_records?.[index];
      if (record?.administration_date) {
        return [
          {
            validator: (_: any, value: any) => {
              if (!value) {
                return Promise.reject(
                  new Error('Please check "Administered" when date is entered'),
                );
              }
              return Promise.resolve();
            },
          },
        ];
      }
      return [];
    },
    disabled: (values: any, index: number) => {
      const record = values?.immunization_records?.[index];
      const status = record?.dosageStatus;
      const hasDate = record?.administration_date;
      if (record?.isAlreadyAdministered) return true;
      if (status === "Pending") return true;
      if(status === "Expired") return true;
      if(status === "Not Eligible") return true;
      if ((status === "OverDue" || status === "Scheduled") && !hasDate)
        return true;

      return false;
    },
  },
  {
    type: "statusTag",
    name: "dosageStatus",
    colSpan: 3,
    required: false,
  },
];

export const IMMUNISATION_FORM_FIELDS = [
  {
    tabKey: "1",
    title: "Immunisation",
    fields: [
      {
        label: "Place of delivery",
        name: "place",
        type: "select",
        required: true,
        placeholder: "Select place of delivery",
        options: PLACE_OF_DELIVERY_OPTIONS,
        colSpan: 6,
      },

      {
        type: "select",
        label: "Level of care",
        name: "levelOfCare",
        placeholder: "Select level of care",
        required: true,
        options: LEVEL_OF_CARE,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => {
          return v?.place && v.place == PlaceOfDelivery.PUBLIC_FACILITY;
        },
      },

      {
        type: "select",
        label: "District",
        name: "district",
        placeholder: "Select district",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => {
          return (
            v?.place === PlaceOfDelivery.PUBLIC_FACILITY ||
            isPrivateOrInformal(v)
          );
        },
      },
      {
        type: "select",
        label: "Taluka",
        name: "taluka",
        placeholder: "Select taluka",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: isPrivateOrInformal,
      },
      {
        label: "Private Facility Name / Delivery Center Name",
        type: "input",
        required: true, // ES-811: making otherPlace mandatory when visible to match with backend
        inputType: TextFieldType.Text,
        placeholder: "Enter facility or delivery center name",
        name: "otherPlace",
        colSpan: 8,
        visibleIf: isPrivateOrInformal,
      },
      {
        type: "select",
        label: "Name of facility",
        name: "facility",
        placeholder: "Select CEmONC facility",
        required: true,
        showSearch: true,
        colSpan: 6,
        visibleIf: (v: any) => {
          return v?.place && v.place == PlaceOfDelivery.PUBLIC_FACILITY;
        },
      },
      {
        label: "Other",
        type: "input",
        required: true, // ES-811: making otherFacility mandatory when visible for consistency
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherFacility",
        visibleIf: (v: any) => {
          return v?.facility && v.facility == "Other";
        },
      },
      {
        label: "Immunisation card available",
        type: "radio",
        name: "immunisation_card_available",
        required: true,
        options: YES_NO_OPTIONS,
        colSpan: 6,
        visibleIf: (v: any) => !v?.isImmunisationNumberPrepopulated,
      },
      {
        label: "Have you provided the patient with an Immunisation card?",
        type: "radio",
        name: "cardProvided",
        required: true,
        options: YES_NO_OPTIONS,
        visibleIf: (v: any) => {
          if (v?.isImmunisationNumberPrepopulated) return false;
          return v?.immunisation_card_available == false;
        },
        warningEnableCondition: (v: any) => {
          if (v?.cardProvided === false) {
            return "Please provide the patient with a immunisation card";
          }
          return false;
        },
        colSpan: 8,
      },

      {
        name: "scanImmunisationCard",
        label: "Immunisation card QR",
        type: "label",
        colSpan: 10,
        marginTop: 10,
        underline: true,
        color: "var(--color-green-custom)",
        visibleIf: (v: any) => !v?.isImmunisationNumberPrepopulated,
      },
      {
        name: "immunisationNumber",
        label: "Immunisation QR number",
        type: "input",
        placeholder: "Enter QR number",
        required: true,
        colSpan: 6,
        // disabled: false,
        maxLength: 14,
        minLength: 14,
        disabled: (v: any) => !!v?.isImmunisationNumberPrepopulated,
      },

      {
        type: "formList",
        name: "immunization_records",
        colSpan: 24,
        required: true,
        label: "Immunization Details",
        allowRemove: false,
        allowAdd: false,
        fields: IMMUNISATION_RECORD_FIELDS,
      },
    ],
  },
];

export const WOMEN_IMMUNISATION_FORM_FIELDS = [
  {
    tabKey: "1",
    title: "Women Vaccination",
    fields: [
      {
        type: "formList",
        name: "women_immunization_records",
        colSpan: 24,
        required: true,
        label: "Immunization Details",
        allowRemove: false,
        allowAdd: false,
        fields: IMMUNISATION_RECORD_FIELDS.map((field: any) => ({
          ...field,
          recordsSource:
            field.name === "dosageStatus"
              ? "women_immunization_records"
              : undefined,

          disabled:
            typeof field.disabled === "function"
              ? (values: any, index: number) => {
                  const patchedValues = {
                    ...values,
                    immunization_records: values?.women_immunization_records,
                  };
                  return field.disabled(patchedValues, index);
                }
              : field.disabled,
          required:
            typeof field.required === "function"
              ? (values: any, index: number) => {
                  const patchedValues = {
                    ...values,
                    immunization_records: values?.women_immunization_records,
                  };
                  return field.required(patchedValues, index);
                }
              : field.required,
          rules:
            typeof field.rules === "function"
              ? (values: any, index: number) => {
                  const patchedValues = {
                    ...values,
                    immunization_records: values?.women_immunization_records,
                  };
                  return field.rules(patchedValues, index);
                }
              : field.rules,
        })),
      },
    ],
  },
];