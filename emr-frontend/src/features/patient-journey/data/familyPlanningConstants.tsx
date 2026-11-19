import { filterFormListOptions } from "@/utils/helpers/formHelperMethods";
import {
  CLIENT_CATEGORY_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  ClientCategory,
  FAMILY_PLANNING_PILLS_OPTIONS,
  FAMILY_PLANNING_SERVICE_OPTIONS,
  FamilyPlanningService,
  LAST_PREGNANCY_OPTIONS,
  PERIOD_OF_SERVICE_OPTIONS,
  REASON_FOR_REMOVAL_OPTIONS,
  showContratceptivesTypesNonPill,
  showContratceptivesTypesPills,
  TYPE_OF_CONTRACEPTION_OPTIONS,
  TypeOfContraception,
  YES_NO_OPTIONS,
} from "./constants";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
}

export const createFamilyPlanningFormFields = (
  larcContraceptiveOptions: FormOption[],
  shortTermContraceptiveOptions: FormOption[],
  isServiceCompleted: boolean,
) => [
  {
    tabKey: "1",
    title: "Family Planning",
    fields: [
      {
        label: "Client type",
        name: "client_type",
        type: "select",
        required: true,
        placeholder: "Select client type",
        options: CLIENT_TYPE_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Years of marriage",
        name: "years_of_marriage",
        type: "number",
        required: true,
        visibleIf: (values: any) => {
          return values?.martialStatus === "Married";
        },
        placeholder: "Enter years of marriage",
        colSpan: 8,
      },
      {
        label: "Total period since last pregnancy outcome",
        name: "total_pregnancy_since_last_period",
        type: "select",
        required: true,
        placeholder: "Select period",
        options: LAST_PREGNANCY_OPTIONS,
        colSpan: 8,
      },
      {
        label: "New user",
        name: "new_user",
        type: "radio",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Previously family planning method in use",
        name: "previous_method_in_use",
        type: "radio",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
        colSpan: 8,
        visibleIf: (values: any) => values?.new_user === false,
      },
      {
        label: "Previous FP commodities used",
        name: "previous_fp_methods_used",
        type: "multiselect",
        required: true,
        visibleIf: (values: any) =>
          values?.previous_method_in_use === true && values?.new_user === false,
        placeholder: "Select previous FP commodities",
        options: FAMILY_PLANNING_PILLS_OPTIONS,
        colSpan: 8,
      },
      {
        label: "What category of services does the client want to avail?",
        name: "service_category",
        type: "select",
        required: true,
        disabled: isServiceCompleted,
        placeholder: "Select service category",
        options: FAMILY_PLANNING_SERVICE_OPTIONS,
        colSpan: 8,
      },

      {
        label: "Period of insertion",
        name: "insertion_period",
        type: "select",
        required: true,
        visibleIf: (values: any) =>
          values?.service_category === FamilyPlanningService.LARC_REMOVAL,
        placeholder: "Select period of insertion",
        options: PERIOD_OF_SERVICE_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Reason for removal",
        name: "removal_reason",
        type: "select",
        required: true,
        visibleIf: (values: any) =>
          values?.service_category === FamilyPlanningService.LARC_REMOVAL,
        placeholder: "Select reason for removal",
        options: REASON_FOR_REMOVAL_OPTIONS,
        colSpan: 8,
      },

      {
        label: "Category of client",
        name: "client_category",
        type: "select",
        required: true,
        disabled: isServiceCompleted,
        visibleIf: (values: any) => {
          return (
            values?.service_category ===
            FamilyPlanningService.FAMILY_PLANNING_SERVICES
          );
        },
        placeholder: "Select client category",
        options: CLIENT_CATEGORY_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Type of contraception",
        name: "type_of_contraception",
        type: "select",
        required: true,
        disabled: isServiceCompleted,
        visibleIf: (values: any) => {
          return (
            values?.service_category ===
              FamilyPlanningService.FAMILY_PLANNING_SERVICES &&
            values?.client_category === ClientCategory.FAMILY_PLANNING_METHOD
          );
        },
        placeholder: "Select contraception type",
        options: TYPE_OF_CONTRACEPTION_OPTIONS,
        colSpan: 8,
      },
      {
        type: "label",
        label: "Which type of family planning method was provided?",
        colSpan: 24,
        visibleIf: (values: any) =>
          values?.service_category ===
            FamilyPlanningService.FAMILY_PLANNING_SERVICES &&
          values.type_of_contraception &&
          values?.type_of_contraception === true,
        marginBottom: 12,
      },
      {
        type: "formList",
        name: "family_planning_prescriptions_short_term",
        colSpan: 24,
        allowAdd: true,
        allowRemove: true,
        disabled: false,
        label: "Family Planning Prescriptions",
        visibleIf: (values: any) => {
          return (
            values?.service_category ===
              FamilyPlanningService.FAMILY_PLANNING_SERVICES &&
            values?.client_category === ClientCategory.FAMILY_PLANNING_METHOD &&
            values?.type_of_contraception === TypeOfContraception.SHORT_TERM
          );
        },
        // required: true,
        fields: [
          {
            label: "Method selected",
            type: "select",
            name: "selected_family_planning_method_short_term",
            required: true,
            disabled: isServiceCompleted,
            placeholder: "Select Method",
            options: (formValues: any, fieldIndex: any) => {
              return filterFormListOptions(
                shortTermContraceptiveOptions,
                formValues,
                "family_planning_prescriptions_short_term",
                "selected_family_planning_method_short_term",
                fieldIndex,
              );
            },
            colSpan: 6,
          },
          {
            label: "Quantity",
            required: true,
            disabled: isServiceCompleted,
            colSpan: 6,
            type: "number",
            rules: [
              {
                validator: (_: any, value: number) => {
                  if (!value || (value >= 1 && value <= 30)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Quantity must be between 1 and 30"),
                  );
                },
              },
            ],
            placeholder: "Enter quantity",
            name: "quantity_short_term",
          },
          {
            type: "label",
            label: "cycle(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesPills(
                values,
                fieldIndex,
                "selected_family_planning_method_short_term",
                shortTermContraceptiveOptions,
              );
            },
          },
          {
            type: "label",
            label: "unit(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesNonPill(
                values,
                fieldIndex,
                "selected_family_planning_method_short_term",
                shortTermContraceptiveOptions,
              );
            },
          },
        ],
      },
      {
        type: "formList",
        name: "family_planning_prescriptions_larc",
        colSpan: 24,
        disabled: false,
        allowAdd: false,
        allowRemove: false,
        label: "Family Planning Prescriptions",
        visibleIf: (values: any) => {
          return (
            values?.service_category ===
              FamilyPlanningService.FAMILY_PLANNING_SERVICES &&
            values?.client_category === ClientCategory.FAMILY_PLANNING_METHOD &&
            values?.type_of_contraception === TypeOfContraception.LARC
          );
        },
        // required: true,
        fields: [
          {
            label: "Method selected",
            type: "select",
            name: "selected_family_planning_method_larc",
            required: true,
            disabled: isServiceCompleted,
            placeholder: "Select Method",
            options: (formValues: any, fieldIndex: any) => {
              return filterFormListOptions(
                larcContraceptiveOptions,
                formValues,
                "family_planning_prescriptions_larc",
                "selected_family_planning_method_larc",
                fieldIndex,
              );
            },
            colSpan: 6,
          },
          {
            label: "Quantity",
            required: true,
            colSpan: 6,
            disabled: isServiceCompleted,
            type: "number",
            rules: [
              {
                validator: (_: any, value: number) => {
                  if (!value || (value >= 1 && value <= 30)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Quantity must be between 1 and 30"),
                  );
                },
              },
            ],
            placeholder: "Enter quantity",
            name: "quantity_larc",
          },
          {
            type: "label",
            label: "cycle(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesPills(
                values,
                fieldIndex,
                "selected_family_planning_method_larc",
                larcContraceptiveOptions,
              );
            },
          },
          {
            type: "label",
            label: "unit(s)",
            colSpan: 4,
            marginBottom: 5,
            visibleIf: (values: any, fieldIndex: number) => {
              return showContratceptivesTypesNonPill(
                values,
                fieldIndex,
                "selected_family_planning_method_larc",
                larcContraceptiveOptions,
              );
            },
          },
        ],
      },
      {
        label: "Did you counsel the client on family planning?",
        name: "client_counseling_done",
        type: "radio",
        required: true,
        placeholder: "Select option",
        options: YES_NO_OPTIONS,
        colSpan: 8,
      },
    ],
  },
];
