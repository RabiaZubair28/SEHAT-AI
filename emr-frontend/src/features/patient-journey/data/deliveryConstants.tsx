import { TextFieldType } from "@/data/types";
import { createRowIdGenerator } from "@/utils/helpers/rowId";

const deliveryMedicineRow = createRowIdGenerator();
const deliveryNewbornRow = createRowIdGenerator();
const deliveryNewbornMedicineRow = createRowIdGenerator();

import {
  AMNIOTIC_FLUID_COLOR_OPTIONS,
  AmnioticFluidColor,
  BLOOD_GROUP_OPTIONS,
  C_SECTION_REASON_OPTIONS,
  CAUSE_OF_DEATH_OPTIONS,
  CauseOfDeath,
  CSectionReason,
  DELIVERY_COMPLICATION_OPTIONS,
  DELIVERY_REFERRAL,
  DELIVERY_REFERRAL_CHILD,
  DELIVERY_SYMPTOM_OPTIONS,
  DeliveryComplication,
  DeliveryReferral,
  DeliverySymptom,
  DISCHARGE_CHECKLIST_OPTIONS,
  DischargeChecklistItem,
  FAMILY_PLANNING_METHOD_OPTIONS,
  IMMEDIATE_STEPS_OPTIONS,
  ImmediateStep,
  LEVEL_OF_CARE,
  MEMBRANE_RUPTURE_HOURS_OPTIONS,
  MembraneRuptureHours,
  MOTHER_CONDITION_OPTIONS,
  MotherCondition,
  NEWBORN_CAUSE_OF_DEATH_OPTIONS,
  NEWBORN_CONDITION_OPTIONS,
  NEWBORN_SEX_OPTIONS,
  NEWBORN_SYMPTOM_OPTIONS,
  NewbornCondition,
  NewbornSymptom,
  POST_DELIVERY_SYMPTOM_OPTIONS,
  PostDeliverySymptom,
  REFERRAL_MOTHER_COMPLICATIONS,
  REFERRAL_NEWBORN_COMPLICATIONS,
  REFERRAL_TYPES,
  SERVICE_TYPES_CHILD,
  SERVICE_TYPES_MOTHER,
  SIGNS_OF_HIGH_RISK_PREGNANCY,
  TrimesterOptions,
  TYPE_OF_DELIVERY_OPTIONS,
  TypeOfDelivery,
  VALIDATION_RANGES,
  YES_NO_OPTIONS,
} from "./constants";
import {
  validateAncHaemoglobin,
  validateDistolicBloodPressure,
  validateSystolicBloodPressure,
  validatePulse,
  validateSpO2,
  validateTemperature,
  validatePulseDelivery,
  validateRespiratoryRate,
  validateBloodSugar,
  validateSpO2Delivery,
  validateBabyWeight,
  validateBabyTemperature,
  validateMUACNewborn,
} from "../utils/validationHelpers";
import { WARNING_MESSAGES } from "./warningMessages";
import {
  filterFormListOptions,
  getFormOfMedicineByMedicineIdAndStrength,
  getStrengthsByMedicineId,
} from "@/utils/helpers/formHelperMethods";
import { isMedicineOther } from "./moduleHelpers";
import dayjs from "dayjs";

// at top of deliveryConstants.tsx

type DeliveryFormValues = {
  motherCondition?: MotherCondition;
  condition?: NewbornCondition;
};

const isMotherAlive = (v: DeliveryFormValues) =>
  v?.motherCondition === MotherCondition.ALIVE_HEALTHY ||
  v?.motherCondition === MotherCondition.ALIVE_UNHEALTHY;

const isNewbornAlive = (values: any, index?: number) => {
  if (index === undefined) return false;
  const newborn = values?.newbornAssessments?.[index];
  if (!newborn) return false;

  return (
    newborn.condition === NewbornCondition.ALIVE_HEALTHY ||
    newborn.condition === NewbornCondition.ALIVE_UNHEALTHY
  );
};

const withMedicineLabelFallback = (
  options: any[],
  value: any,
  label?: string,
) => {
  if (!value || !label || options.some((o: any) => o.value === value)) {
    return options;
  }

  return [{ value, label }, ...options];
};

// Helper to get newborn medicine options
const getNewbornMedicineOptions = (
  formValues: any,
  medicineFieldIndex: number,
  newbornIndex: number,
  medicineOptions: any[],
  fieldName:
    | "medicineNameNewborn"
    | "strengthNewborn"
    | "formOfMedicineNewborn",
) => {
  const newborns = formValues?.newbornAssessments || [];
  const medicines = newborns[newbornIndex]?.medicinesAdministeredNewborn || [];
  const medicineItem = medicines[medicineFieldIndex];

  if (!medicineItem && fieldName !== "medicineNameNewborn") return [];

  // Return options based on which field is requested
  if (fieldName === "medicineNameNewborn") {
    return withMedicineLabelFallback(
      medicineOptions,
      medicineItem?.medicineNameNewborn,
      medicineItem?.medicine_label,
    );
  }

  if (fieldName === "strengthNewborn") {
    if (!medicineItem?.medicineNameNewborn) return [];
    const allStrengths =
      getStrengthsByMedicineId(
        medicineItem.medicineNameNewborn,
        medicineOptions,
      ) || [];

    const usedStrengths = medicines
      .filter(
        (m: any, i: number) =>
          i !== medicineFieldIndex &&
          m?.medicineNameNewborn === medicineItem.medicineNameNewborn,
      )
      .map((m: any) => m?.strengthNewborn)
      .filter(Boolean);

    return allStrengths.filter(
      (opt: any) =>
        !usedStrengths.includes(opt.value) ||
        medicineItem?.strengthNewborn === opt.value,
    );
  }

  if (fieldName === "formOfMedicineNewborn") {
    if (!medicineItem?.medicineNameNewborn || !medicineItem?.strengthNewborn)
      return [];
    return getFormOfMedicineByMedicineIdAndStrength(
      medicineItem.medicineNameNewborn,
      medicineItem.strengthNewborn,
      medicineOptions,
    );
  }

  return [];
};

type FormOption = { label: string; value: string | number; id?: number };

export const createDeliveryFormFields = (
  medicineOptions: FormOption[] = [],
  paginationProps?: {
    fetchMore: () => void;
    isLoadingMore: boolean;
    onSearch: (val: string) => void;
  },
) => [
  {
    tabKey: "1",
    title: "Pre-Delivery assessment",
    fields: [
      {
        label: "Last Menstrual Period (LMP)",
        name: "lmp",
        type: "date",
        required: true,
        colSpan: 8,
        placeholder: "(LMP) date",
        disabledDate: (current: any) => {
          if (!current) return false;
          const fortyTwoWeeksAgo = dayjs().subtract(
            VALIDATION_RANGES.PREGNANCY_WEEK.possible.max,
            "weeks",
          );
          return (
            current.isBefore(fortyTwoWeeksAgo, "day") ||
            current.isAfter(dayjs().subtract(1, "week"), "day") // ES-789: To match with backend validation
          );
        },
        rules: [
          {
            validator: (_: any, value: any) => {
              if (!value) return Promise.resolve();
              if (
                dayjs().diff(dayjs(value), "week") >
                VALIDATION_RANGES.PREGNANCY_WEEK.possible.max
              ) {
                return Promise.reject(
                  new Error(
                    `LMP cannot be older than ${VALIDATION_RANGES.PREGNANCY_WEEK.possible.max} weeks`,
                  ),
                );
              }
              return Promise.resolve();
            },
          },
        ],
      },
      {
        label: "Gestational age",
        name: "gestationalAge",
        type: "number",
        required: true,
        colSpan: 8,
        placeholder: "Gestational age",
        disabled: true,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PREGNANCY_WEEK.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pregnancy week must be from ${min} to ${max}`),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) => {
          const { max } = VALIDATION_RANGES.PREGNANCY_WEEK.normal;
          if (v.gestationalAge && v.gestationalAge < max)
            return WARNING_MESSAGES.HIGH_RISK_REFER_CEMONC;
        },
      },
      {
        label: "Trimester",
        type: "select",
        name: "trimester",
        options: TrimesterOptions,
        required: true,
        disabled: true,
        colSpan: 8,
        placeholder: "Select trimester",
      },
      {
        label: "Blood group",
        type: "select",
        name: "blood_group",
        required: false,
        colspan: 8,
        placeholder: "Select blood group",
        options: BLOOD_GROUP_OPTIONS,
      },
      {
        label: "Signs of high risk pregnancy",
        type: "multiselect",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Select signs of high risk pregnancy",
        name: "signs_of_high_risk_pregnancy",
        options: SIGNS_OF_HIGH_RISK_PREGNANCY,
      },
      {
        label: "Other",
        type: "input",
        required: true,
        placeholder: "Other signs of high risk pregnancy",
        name: "other_high_risk_sign",
        visibleIf: (v: any) => {
          return (
            v?.signs_of_high_risk_pregnancy &&
            v.signs_of_high_risk_pregnancy == "Other"
          );
        },
      },
      {
        label: "Temperature (°F)",
        name: "temperature",
        type: "number",
        required: true,
        placeholder: "Enter temperature",
        colspan: 8,
        warningEnableCondition: (v: any) => validateTemperature(v.temperature),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.TEMPERATURE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Temperature must be from ${min} to ${max} °F`),
              );
            },
          },
        ],
      },
      {
        label: "Pulse (BPM)",
        required: true,
        colSpan: 8,
        type: "number",
        placeholder: "Enter pulse (BPM)",
        name: "pulse",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PULSE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pulse must be from ${min} to ${max}`),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) => validatePulse(v.pulse),
      },
      {
        label: "Systolic BP",
        name: "systolicBP",
        placeholder: "Enter systolic BP",
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v.systolicBP),
        colspan: 8,
        type: "number",
        required: true,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.systolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Systolic BP must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Diastolic BP",
        placeholder: "Enter diastolic BP",
        name: "diastolicBP",
        colspan: 8,
        required: true,
        type: "number",
        warningEnableCondition: (v: any) =>
          validateDistolicBloodPressure(v.diastolicBP),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.diastolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Diastolic BP must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Respiratory Rate",
        placeholder: "Enter respiratory rate",
        name: "respiratoryRate",
        colspan: 8,
        required: true,
        type: "number",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.RESPIRATORY_RATE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("Respiratory should be between 5–60 breaths/min"),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateRespiratoryRate(v.respiratoryRate),
      },
      {
        label: "SpO₂ (%)",
        required: true,
        colSpan: 8,
        type: "number",
        placeholder: "Enter SpO₂ (%)",
        name: "spo2",
        warningEnableCondition: (v: any) => validateSpO2(v.spo2),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.SPO2.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`SpO2 must be from ${min}% to ${max}%`),
              );
            },
          },
        ],
      },
      {
        label: "Fetal Movement",
        type: "radio",
        name: "fetalMovement",
        required: true,
        placeholder: "Select any",
        options: YES_NO_OPTIONS,
        warningEnableCondition: (v: any) => {
          if (v?.fetalMovement == false) {
            return WARNING_MESSAGES.NO_FETAL_MOVEMENT;
          }
        },
      },
      {
        label: "Fetal heart rate (bpm)",
        type: "number",
        placeholder: "Enter Fetal heart rate (bpm)",
        warningEnableCondition: (v: any) => {
          const { min, max } =
            VALIDATION_RANGES.FETAL_HEART_RATE_DELIVERY.normal;
          if (
            (v.fetalHeartRate && v.fetalHeartRate < min) ||
            v.fetalHeartRate > max
          )
            return WARNING_MESSAGES.ABNORMAL_FETAL_HEART_RATE;
        },
        name: "fetalHeartRate",
        required: true,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.FETAL_HEART_RATE_DELIVERY.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Fetal heart rate must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Cervical Dilation (cm)",
        name: "cervicalDilation",
        type: "number",
        required: true,
        placeholder: "Enter cervical dilation (cm)",
        colspan: 8,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.CERVICAL_DILATION;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Cervical dilation must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Membrane ruptured",
        type: "radio",
        name: "membraneRuptured",
        required: true,
        options: YES_NO_OPTIONS,
      },

      {
        label: "Hours passes since rupture of membrane",
        type: "select",
        name: "hoursSinceRupture",
        required: true,
        placeholder: "Select hours passed",
        options: MEMBRANE_RUPTURE_HOURS_OPTIONS,
        visibleIf: (values: any) => values?.membraneRuptured === true,
        warningEnableCondition: (v: any) => {
          if (
            v.hoursSinceRupture &&
            v.hoursSinceRupture == MembraneRuptureHours.MORE_THAN_EIGHTEEN
          )
            return WARNING_MESSAGES.HIGH_RISK_REFER_CEMONC_DELIVERY;
        },
      },

      {
        label: "Amniotic fluid color",
        type: "select",
        name: "amnioticFluidColor",
        required: true,
        placeholder: "Select amniotic fluid color",
        options: AMNIOTIC_FLUID_COLOR_OPTIONS,
        warningEnableCondition: (v: any) => {
          if (
            v.amnioticFluidColor &&
            v.amnioticFluidColor == AmnioticFluidColor.GREEN
          )
            return "This is a high risk delivery due to abnormal amniotic fluid color, please refer the patient to the nearest CEmONC facility";
        },
      },
      {
        label: "Symptoms assessment",
        type: "multiselect",
        name: "symptomsAssessment",
        required: true,
        placeholder: "Select symptoms",
        options: DELIVERY_SYMPTOM_OPTIONS,
        warningEnableCondition: (v: any) => {
          if (
            (v.symptomsAssessment &&
              v.symptomsAssessment ==
                DeliverySymptom.SEVERE_VAGINAL_BLEEDING) ||
            v.symptomsAssessment == DeliverySymptom.MECONIUM_FLUID
          )
            return WARNING_MESSAGES.HIGH_RISK_SYMPTOM;
        },
        colSpan: 8,
      },
    ],
  },
  {
    tabKey: "2",
    title: "Post-Delivery Assessment",
    fields: [
      {
        label: "Type of delivery conducted",
        type: "select",
        name: "typeOfDelivery",
        required: true,
        placeholder: "Select type of delivery",
        options: TYPE_OF_DELIVERY_OPTIONS,
      },
      {
        label: "Reason for C-Section",
        type: "select",
        name: "reasonForCSection",
        required: true,
        placeholder: "Select reason",
        options: C_SECTION_REASON_OPTIONS,
        visibleIf: (v: any) => {
          return (
            v?.typeOfDelivery && v.typeOfDelivery === TypeOfDelivery.C_SECTION
          );
        },
      },
      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherReasonForCSection",
        visibleIf: (v: any) => {
          return (
            v?.reasonForCSection && v.reasonForCSection == CSectionReason.OTHER
          );
        },
      },
      {
        label: "Condition of mother",
        type: "select",
        name: "motherCondition",
        required: true,
        placeholder: "Select condition",
        options: MOTHER_CONDITION_OPTIONS,
      },
      {
        label: "Symptoms assessment",
        type: "multiselect",
        name: "symptomsAssessmentPostDelivery",
        required: true,
        placeholder: "Select symptoms",
        visibleIf: isMotherAlive,
        options: POST_DELIVERY_SYMPTOM_OPTIONS,
        warningEnableCondition: (v: any) => {
          if (
            v.symptomsAssessmentPostDelivery &&
            v.symptomsAssessmentPostDelivery ==
              PostDeliverySymptom.FOUL_DISCHARGE
          )
            return WARNING_MESSAGES.FOUL_DISCHARGE_POST_DELIVERY;
          if (
            v.symptomsAssessmentPostDelivery &&
            v.symptomsAssessmentPostDelivery ==
              PostDeliverySymptom.SEVERE_BLEEDING
          )
            return WARNING_MESSAGES.SEVERE_BLEEDING_POST_DELIVERY;
          if (
            v.symptomsAssessmentPostDelivery &&
            v.symptomsAssessmentPostDelivery ==
              PostDeliverySymptom.THIRD_DEGREE_TEAR
          )
            return WARNING_MESSAGES.THIRD_DEGREE_TEAR;
          if (
            v.symptomsAssessmentPostDelivery &&
            v.symptomsAssessmentPostDelivery ==
              PostDeliverySymptom.FOURTH_DEGREE_TEAR
          )
            return WARNING_MESSAGES.FOURTH_DEGREE_TEAR;
        },

        colSpan: 8,
      },
      {
        label: "Immediate steps",
        type: "multiselect",
        name: "immediateSteps",
        required: true,
        placeholder: "Select immediate steps taken",
        visibleIf: isMotherAlive,
        options: IMMEDIATE_STEPS_OPTIONS,
        warningEnableCondition: (v: any) => {
          const selected = v?.immediateSteps || [];
          const warnings: string[] = [];

          if (!selected.includes(ImmediateStep.PLACENTA)) {
            warnings.push(
              "Please take action to manually deliver the patient's placenta",
            );
          }

          if (!selected.includes(ImmediateStep.WELL_CONTRACTED)) {
            warnings.push(
              "Please massage the patient's uterus to ensure contraction",
            );
          }

          if (!selected.includes(ImmediateStep.EARLY_INITIATION)) {
            warnings.push(
              "Please assist the patient in initiating the breastfeeding process",
            );
          }

          if (!selected.includes(ImmediateStep.OXYTOCIN)) {
            warnings.push("Please administer Oxytocin to the patient");
          }

          return warnings.length
            ? warnings.map((msg, index) => `${index + 1}. ${msg}`)
            : null;
        },

        colSpan: 8,
      },
      {
        label: "Complications during or after labour",
        type: "multiselect",
        name: "complications",
        required: true,
        placeholder: "Select complications",
        visibleIf: isMotherAlive,
        options: DELIVERY_COMPLICATION_OPTIONS,
        colSpan: 8,
      },
      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other complications",
        name: "otherComplication",
        visibleIf: (v: any) => {
          return (
            v?.complications && v.complications == DeliveryComplication.OTHER
          );
        },
      },
      {
        label: "Temperature (°F)",
        name: "temperaturePostDelivery",
        type: "number",
        required: true,
        placeholder: "Enter temperature",
        colspan: 8,
        warningEnableCondition: (v: any) =>
          validateTemperature(v.temperaturePostDelivery),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.TEMPERATURE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Temperature must be from ${min} to ${max} °F`),
              );
            },
          },
        ],
        visibleIf: isMotherAlive,
      },
      {
        label: "Pulse (BPM)",
        required: true,
        colSpan: 8,
        type: "number",
        placeholder: "Enter pulse (BPM)",
        name: "pulsePostDelivery",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.PULSE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Pulse must be from ${min} to ${max}`),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validatePulseDelivery(v.pulsePostDelivery),
        visibleIf: isMotherAlive,
      },
      {
        label: "Systolic BP",
        name: "systolicBpPostDelivery",
        placeholder: "Enter systolic BP",
        warningEnableCondition: (v: any) =>
          validateSystolicBloodPressure(v?.systolicBpPostDelivery),
        colspan: 8,
        type: "number",
        required: true,
        visibleIf: isMotherAlive,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.systolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Systolic BP must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Diastolic BP",
        placeholder: "Enter diastolic BP",
        name: "diastolicBpPostDelivery",
        colspan: 8,
        required: true,
        type: "number",
        warningEnableCondition: (v: any) =>
          validateDistolicBloodPressure(v.diastolicBpPostDelivery),
        visibleIf: isMotherAlive,
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.BLOOD_PRESSURE.diastolic_possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Diastolic BP must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },
      {
        label: "Respiratory Rate",
        placeholder: "Enter respiratory rate",
        name: "respiratoryRatePostDelivery",
        colspan: 8,
        required: true,
        type: "number",
        visibleIf: isMotherAlive,
        warningEnableCondition: (v: any) =>
          validateRespiratoryRate(v.respiratoryRatePostDelivery),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.RESPIRATORY_RATE.possible;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`Respiratory rate must be from ${min} to ${max}`),
              );
            },
          },
        ],
      },

      {
        label: "Blood Sugar (Random) mg/dL",
        type: "number",
        required: true,
        placeholder: "Enter RBS",
        colSpan: 8,
        name: "rbsPostDelivery",
        visibleIf: isMotherAlive,
        warningEnableCondition: (v: any) =>
          validateBloodSugar(v.rbsPostDelivery),
      },
      {
        label: "Haemoglobin (g/dL)",
        placeholder: "Enter haemoglobin",
        type: "number",
        colSpan: 8,
        required: true,
        name: "hbPostDelivery",
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } =
                VALIDATION_RANGES.HAEMOGLOBIN_ANC.possible_delivery;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`HB must be from ${min} to ${max}`),
              );
            },
          },
        ],
        warningEnableCondition: (v: any) =>
          validateAncHaemoglobin(v.hbPostDelivery, v.trimester),
        visibleIf: isMotherAlive,
      },
      {
        label: "SpO₂ (%)",
        required: true,
        colSpan: 8,
        type: "number",
        placeholder: "Enter SpO\u2082 (%)",
        name: "spo2PostDelivery",
        warningEnableCondition: (v: any) =>
          validateSpO2Delivery(v.spo2PostDelivery),
        rules: [
          {
            validator: (_: any, value: number) => {
              const { min, max } = VALIDATION_RANGES.SPO2.possible_delivery;
              if (!value || (value >= min && value <= max)) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(`SpO2 must be from ${min} to ${max}`),
              );
            },
          },
        ],
        visibleIf: isMotherAlive,
      },
      {
        label: "Medicines administered",
        type: "formList",
        name: "medicinesAdministered",
        colSpan: 24,
        allowAdd: true,
        allowRemove: true,
        visibleIf: isMotherAlive,
        initialValue: [deliveryMedicineRow()],
        newRow: deliveryMedicineRow,
        fields: [
          {
            label: "Medicine name",
            type: "select",
            name: "medicineName",
            colSpan: 6,
            required: true,
            placeholder: "Select medicine",
            showSearch: true,
            fetchMore: paginationProps?.fetchMore,
            isLoadingMore: paginationProps?.isLoadingMore,
            onSearch: paginationProps?.onSearch,
            options: (formValues: any, fieldIndex: any) => {
              const med = formValues?.medicinesAdministered?.[fieldIndex];
              return withMedicineLabelFallback(
                medicineOptions,
                med?.medicineName,
                med?.medicine_label,
              );
            },
          },
          {
            label: "Strength",
            type: "select",
            name: "strength",
            placeholder: "Select strength",
            colSpan: 4,
            required: true,
            options: (formValues: any, fieldIndex: any) => {
              const medicineItem =
                formValues?.medicinesAdministered?.[fieldIndex];
              if (!medicineItem) return [];
              const strengthOptions =
                getStrengthsByMedicineId(
                  medicineItem.medicineName,
                  medicineOptions,
                ) || [];
              return filterFormListOptions(
                strengthOptions,
                formValues,
                "medicinesAdministered",
                "strength",
                fieldIndex,
                "medicineName",
              );
            },
          },

          {
            label: "Form of medicine",
            type: "select",
            name: "formOfMedicine",
            placeholder: "Select form of medicine",
            colSpan: 4,
            required: true,
            visibleIf: (values: any, idx: number) =>
              !isMedicineOther(
                values,
                idx,
                "medicinesAdministered",
                "medicineName",
              ),
            options: (formValues: any, idx: any) => {
              const item = formValues?.medicinesAdministered?.[idx];
              if (!item) return [];
              return getFormOfMedicineByMedicineIdAndStrength(
                item.medicineName,
                item?.strength,
                medicineOptions,
              );
            },
          },

          {
            label: "Quantity",
            type: "number",
            name: "quantity",
            placeholder: "Enter quantity",
            colSpan: 3,
            required: true,
          },
        ],
      },
      {
        label: "Cause of death",
        type: "multiselect",
        name: "causeOfDeath",
        required: true,
        placeholder: "Select causes",
        options: CAUSE_OF_DEATH_OPTIONS,
        visibleIf: (v: any) => {
          return (
            v?.motherCondition && v.motherCondition == MotherCondition.DEAD
          );
        },
        colSpan: 8,
      },
      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherPostDelivery",
        visibleIf: (v: { causeOfDeath?: string | string[] }) => {
          const cause = v?.causeOfDeath;
          return [
            CauseOfDeath.OTHER_OBSTETRIC,
            CauseOfDeath.OTHER_NON_OBSTETRIC,
          ].some((c) =>
            Array.isArray(cause) ? cause.includes(c) : cause === c,
          );
        },
      },
    ],
  },
  {
    tabKey: "3",
    title: "Newborn Assessment",
    fields: [
      {
        type: "formList_unscrollable",
        name: "newbornAssessments",
        label: "Newborn",
        colSpan: 24,
        allowAdd: true,
        allowRemove: true,
        showItemTitle: true,
        itemTitlePrefix: "Newborn",
        minItems: 1,
        initialValue: [deliveryNewbornRow()],
        newRow: deliveryNewbornRow,
        fields: [
          {
            label: "Sex",
            type: "select",
            name: "sex",
            options: NEWBORN_SEX_OPTIONS,
            placeholder: "Select sex",
            required: true,
            colSpan: 8,
          },
          {
            label: "Condition of baby",
            type: "select",
            name: "condition",
            required: true,
            placeholder: "Select condition",
            options: NEWBORN_CONDITION_OPTIONS,
            colSpan: 8,
          },
          {
            label: "Weight (kg)",
            type: "number",
            name: "weightNewborn",
            placeholder: "Enter weight (Kg)",
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 8,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];
              return validateBabyWeight(newborn?.weightNewborn);
            },
            rules: [
              {
                validator: (_: any, value: number) => {
                  const { min, max } = VALIDATION_RANGES.BABY_WEIGHT.possible;
                  if (!value || (value >= min && value <= max)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(`Baby weight must be from ${min} to ${max} kgs`),
                  );
                },
              },
            ],
          },
          {
            label: "Temperature (°F)",
            name: "temperatureNewborn",
            type: "number",
            placeholder: "Enter temperature",
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 8,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];
              return validateBabyTemperature(newborn?.temperatureNewborn);
            },
            rules: [
              {
                validator: (_: any, value: number) => {
                  const { min, max } = VALIDATION_RANGES.TEMPERATURE.possible;
                  if (!value || (value >= min && value <= max)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(`Temperature must be from ${min} to ${max} °F`),
                  );
                },
              },
            ],
          },
          {
            label: "MUAC (cm)",
            name: "muacNewborn",
            type: "number",
            placeholder: "Enter MUAC (cm)",
            required: false,
            visibleIf: isNewbornAlive,
            colSpan: 8,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];
              return validateMUACNewborn(newborn?.muacNewborn);
            },
            rules: [
              {
                validator: (_: any, value: number) => {
                  const { min, max } = VALIDATION_RANGES.MUAC_NEWBORN.possible;
                  if (!value || (value >= min && value <= max)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(`MUAC must be from ${min} to ${max}`),
                  );
                },
              },
            ],
          },
          {
            label: "Head circumference (cm)",
            name: "headCircumference",
            type: "number",
            required: true,
            placeholder: "Enter head circumference (cm)",
            visibleIf: isNewbornAlive,
            colSpan: 8,
            rules: [
              {
                validator: (_: any, value: number) => {
                  const { min, max } = VALIDATION_RANGES.HEAD_CIRCUMFERENCE;
                  if (!value || (value >= min && value <= max)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(`Circumference must be from ${min} to ${max} cm`),
                  );
                },
              },
            ],
          },
          {
            label: "APGAR score",
            name: "apgarScore",
            type: "number",
            required: true,
            visibleIf: isNewbornAlive,
            placeholder: "Enter APGAR score",
            colSpan: 8,
          },
          {
            label: "Symptoms assessment",
            type: "multiselect",
            name: "symptomsAssessmentNewborn",
            required: true,
            placeholder: "Select symptoms",
            options: NEWBORN_SYMPTOM_OPTIONS,
            visibleIf: isNewbornAlive,
            colSpan: 8,
          },
          {
            label: "Other",
            type: "input",
            name: "otherSymptomNewborn",
            required: true,
            placeholder: "Other symptoms",
            colSpan: 8,
            visibleIf: (values: any, index?: number) => {
              if (index === undefined) return false;

              const newborn = values?.newbornAssessments?.[index];
              return (
                Array.isArray(newborn?.symptomsAssessmentNewborn) &&
                newborn.symptomsAssessmentNewborn.includes(NewbornSymptom.OTHER)
              );
            },
          },
          {
            label: "Has KMC been administered?",
            type: "radio",
            name: "kmcAdministered",
            options: YES_NO_OPTIONS,
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 8,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];

              if (newborn?.kmcAdministered == false) {
                return WARNING_MESSAGES.KMC_ADMINISTER;
              }

              return null;
            },
          },
          {
            label: "Has breastfeeding been initiated?",
            type: "radio",
            name: "breastfeedingInitiated",
            options: YES_NO_OPTIONS,
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 8,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];

              if (newborn?.breastfeedingInitiated == false) {
                return WARNING_MESSAGES.BREASTFEEDING_INITIATED;
              }

              return null;
            },
          },

          {
            type: "formList",
            name: "immunization_records",
            colSpan: 24,
            required: true,
            label: "Immunization Details",
            allowRemove: false,
            allowAdd: false,
            visibleIf: isNewbornAlive,
            fields: [
              {
                type: "input",
                name: "vaccineId",
                colSpan: 0,
                disabled: true,
                style: { display: "none" },
              },
              {
                label: "Vaccine name",
                type: "input",
                disabled: true,
                name: "vaccine",
                colSpan: 6,
                required: true,
              },
              {
                label: "Date of vaccine administration",
                name: "dateAdministered",
                type: "date",
                // ES-831
                required: (
                  values: any,
                  index: number,
                  parentIndex?: number,
                ) => {
                  const record =
                    values?.newbornAssessments?.[parentIndex ?? 0]
                      ?.immunization_records?.[index];
                  return !!record?.immunization_status;
                },
                colSpan: 6,
                placeholder: "Select due date",
                allowFutureDates: false,
              },
              {
                label: "Administered",
                type: "singleCheckbox",
                name: "immunization_status",
                colSpan: 5,
                // ES-831
                required: (
                  values: any,
                  index: number,
                  parentIndex?: number,
                ) => {
                  const record =
                    values?.newbornAssessments?.[parentIndex ?? 0]
                      ?.immunization_records?.[index];

                  return !!record?.dateAdministered;
                },
                rules: (values: any, index: number, parentIndex?: number) => {
                  const record =
                    values?.newbornAssessments?.[parentIndex ?? 0]
                      ?.immunization_records?.[index];

                  return [
                    {
                      validator: (_: any, value: any) => {
                        if (!!record.dateAdministered && !value) {
                          return Promise.reject(
                            new Error(
                              'Please check "Administered" when date is entered',
                            ),
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ];
                },
              },
              {
                type: "statusTagNewborn",
                name: "status",
                colSpan: 1,
                required: false,
              },
            ],
          },

          {
            label: "Medicines provided?",
            type: "radio",
            name: "medicineProvided",
            options: YES_NO_OPTIONS,
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 8,
          },
          {
            type: "formList",
            name: "medicinesAdministeredNewborn",
            colSpan: 24,
            allowAdd: true,
            allowRemove: true,
            visibleIf: (values: any, index: any) => {
              const newborn = values?.newbornAssessments?.[index];
              return newborn?.medicineProvided === true;
            },
            initialValue: [deliveryNewbornMedicineRow()],
            newRow: deliveryNewbornMedicineRow,
            fields: [
              {
                label: "Medicine name",
                type: "select",
                name: "medicineNameNewborn",
                required: true,
                showSearch: true,
                placeholder: "Select medicine",
                fetchMore: paginationProps?.fetchMore,
                isLoadingMore: paginationProps?.isLoadingMore,
                onSearch: paginationProps?.onSearch,
                colSpan: 5,
                options: (
                  formValues: any,
                  fieldIndex: number,
                  parentIndex: number,
                ) => {
                  return getNewbornMedicineOptions(
                    formValues,
                    fieldIndex,
                    parentIndex,
                    medicineOptions,
                    "medicineNameNewborn",
                  );
                },
              },
              {
                label: "Strength",
                type: "select",
                name: "strengthNewborn",
                placeholder: "Select strength",
                required: true,
                colSpan: 4,
                options: (
                  formValues: any,
                  fieldIndex: number,
                  parentIndex: number,
                ) => {
                  return getNewbornMedicineOptions(
                    formValues,
                    fieldIndex,
                    parentIndex,
                    medicineOptions,
                    "strengthNewborn",
                  );
                },
              },
              {
                label: "Form of medicine",
                type: "select",
                name: "formOfMedicineNewborn",
                placeholder: "Select form of medicine",
                required: true,
                colSpan: 4,
                options: (
                  formValues: any,
                  fieldIndex: number,
                  parentIndex: number,
                ) => {
                  return getNewbornMedicineOptions(
                    formValues,
                    fieldIndex,
                    parentIndex,
                    medicineOptions,
                    "formOfMedicineNewborn",
                  );
                },
              },
              {
                label: "Quantity",
                type: "number",
                name: "quantityNewborn",
                placeholder: "Enter quantity",
                required: true,
                colSpan: 4,
              },
            ],
          },
          {
            label: "Have you provided the patient with an Immunisation card?",
            type: "radio",
            name: "cardProvided",
            visibleIf: isNewbornAlive,
            required: true,
            options: YES_NO_OPTIONS,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];

              if (newborn?.cardProvided === false) {
                return "Please provide the patient with an immunisation card";
              }

              return null;
            },
            colSpan: 8,
          },
          {
            name: "scanImmunisationCard",
            label: "Immunisation card QR",
            type: "label",
            colSpan: 6,
            marginTop: 10,
            underline: true,
            visibleIf: (values: any, index: any) => {
              const newborn = values?.newbornAssessments?.[index];
              return newborn?.cardProvided === true;
            },
            color: "var(--color-green-custom)",
          },
          {
            name: "immunisationNumber",
            label: "Immunisation QR number",
            type: "input",
            maxLength: 14,
            minLength: 14,
            placeholder: "Enter QR number",
            required: true,
            colSpan: 6,
            disabled: false,
            visibleIf: (values: any, index: any) => {
              const newborn = values?.newbornAssessments?.[index];
              return newborn?.cardProvided === true;
            },
          },
          {
            label: "Does the child have any congenital anomaly",
            type: "radio",
            name: "oxygenGiven",
            options: YES_NO_OPTIONS,
            required: true,
            visibleIf: isNewbornAlive,
            colSpan: 6,
            warningEnableCondition: (v: any, index?: number) => {
              if (index === undefined) return null;
              const newborn = v?.newbornAssessments?.[index];

              if (newborn?.oxygenGiven === true) {
                return WARNING_MESSAGES.CONGENITAL_ANOMALY;
              }

              return null;
            },
          },
          {
            label: "Cause of death",
            type: "multiselect",
            name: "causeOfDeathNewborn",
            required: true,
            options: NEWBORN_CAUSE_OF_DEATH_OPTIONS,
            colSpan: 8,
            visibleIf: (values: any, index: any) => {
              const newborn = values?.newbornAssessments?.[index];
              return (
                newborn?.condition === NewbornCondition.DEAD_AFTER_DELIVERY
              );
            },
          },
        ],
      },
    ],
  },
  {
    tabKey: "4",
    title: "Discharge",
    fields: [
      {
        label: "Discharge checklist",
        type: "multiselect",
        name: "dischargeChecklist",
        required: true,
        placeholder: "Select discharge checklist items",
        options: DISCHARGE_CHECKLIST_OPTIONS,
      },
      {
        label: "Family planning commoditites provided",
        type: "select",
        placeholder: "Select commodity",
        name: "familyPlanningCommodity",
        options: FAMILY_PLANNING_METHOD_OPTIONS,
        required: true,
        visibleIf: (v: any) =>
          v.dischargeChecklist &&
          v.dischargeChecklist.includes(DischargeChecklistItem.PROVIDED),
      },
      {
        label: "Date for follow up visit (if required)",
        type: "date",
        name: "followUpDate",
        placeholder: "Select date",
        required: false,
        colSpan: 12,
        allowFutureDates: true,
      },
    ],
  },
  {
    tabKey: "5",
    title: "Delivery Referral",
    fields: [
      {
        label: "Who requires a referral?",
        type: "multiselect",
        name: "referralFor",
        required: true,
        placeholder: "Select who requires referral",
        options: DELIVERY_REFERRAL,
        colSpan: 8,
      },
      {
        label: "Which child requires a referral?",
        type: "multiselect",
        name: "referralForChild",
        required: true,
        placeholder: "Select baby",
        options: DELIVERY_REFERRAL_CHILD,
        colSpan: 8,
        visibleIf: (v: any) => v.referralFor?.includes(DeliveryReferral.CHILD),
      },
      {
        label: "What kind of complication is the mother experiencing?",
        type: "multiselect",
        name: "motherComplications",
        required: true,
        placeholder: "Select complications",
        options: REFERRAL_MOTHER_COMPLICATIONS,
        colSpan: 12,
        visibleIf: (v: any) => v.referralFor?.includes(DeliveryReferral.MOTHER),
      },
      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherMotherComplication",
        visibleIf: (v: any) => {
          return (
            v?.motherComplications && v.motherComplications.includes("Other")
          );
        },
      },
      {
        label: "What kind of complication is the child 1 experiencing?",
        type: "multiselect",
        name: "childComplications1",
        required: true,
        placeholder: "Select complications",
        options: REFERRAL_NEWBORN_COMPLICATIONS,
        colSpan: 12,
        visibleIf: (v: any) => v.referralForChild?.includes("FIRST_CHILD"),
      },
      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherChildComplication1",
        visibleIf: (v: any) => {
          return (
            v?.childComplications1 && v.childComplications1.includes("Other")
          );
        },
      },

      {
        label: "What kind of complication is the child 2 experiencing?",
        type: "multiselect",
        name: "childComplications2",
        required: true,
        placeholder: "Select complications",
        options: REFERRAL_NEWBORN_COMPLICATIONS,
        colSpan: 12,
        visibleIf: (v: any) => v.referralForChild?.includes("SECOND_CHILD"),
      },

      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherChildComplication2",
        visibleIf: (v: any) => {
          return (
            v?.childComplications2 && v.childComplications2.includes("Other")
          );
        },
      },

      {
        label: "What kind of complication is the child 3 experiencing?",
        type: "multiselect",
        name: "childComplications3",
        required: true,
        placeholder: "Select complications",
        options: REFERRAL_NEWBORN_COMPLICATIONS,
        colSpan: 12,
        visibleIf: (v: any) => v.referralForChild?.includes("THIRD_CHILD"),
      },

      {
        label: "Other",
        type: "input",
        required: true,
        inputType: TextFieldType.Text,
        placeholder: "Other",
        name: "otherChildComplication3",
        visibleIf: (v: any) => {
          return (
            v?.childComplications3 && v.childComplications3.includes("Other")
          );
        },
      },
      {
        label: "Type of referral",
        type: "radio",
        name: "referral_type",
        required: true,
        placeholder: "Select any",
        options: REFERRAL_TYPES,
        colSpan: 12,
      },

      {
        type: "select",
        label: "Type of Service for mother",
        name: "typeOfServiceMother",
        placeholder: "Select type of service for mother",
        required: true,
        options: (formValues: any) => {
          if (formValues?.referral_type === "internal") {
            return SERVICE_TYPES_MOTHER.filter(
              (opt: any) => opt.value !== "Other",
            );
          }
          return SERVICE_TYPES_MOTHER;
        },
        showSearch: true,
        visibleIf: (v: any) =>
          ["internal", "external"].includes(v.referral_type) &&
          v.referralFor?.includes(DeliveryReferral.MOTHER),
      },

      {
        type: "select",
        label: "Type of Service for baby 1",
        name: "typeOfServiceChild1",
        placeholder: "Select type of service for baby 1",
        required: true,
        options: (formValues: any) => {
          if (formValues?.referral_type === "internal") {
            return SERVICE_TYPES_CHILD.filter(
              (opt: any) => opt.value !== "Other",
            );
          }
          return SERVICE_TYPES_CHILD;
        },
        showSearch: true,
        visibleIf: (v: any) =>
          ["internal", "external"].includes(v.referral_type) &&
          v.referralForChild?.includes("FIRST_CHILD"),
      },

      {
        type: "select",
        label: "Type of Service for baby 2",
        name: "typeOfServiceChild2",
        placeholder: "Select type of service for baby 2",
        required: true,
        options: (formValues: any) => {
          if (formValues?.referral_type === "internal") {
            return SERVICE_TYPES_CHILD.filter(
              (opt: any) => opt.value !== "Other",
            );
          }
          return SERVICE_TYPES_CHILD;
        },
        showSearch: true,
        visibleIf: (v: any) =>
          ["internal", "external"].includes(v.referral_type) &&
          v.referralForChild?.includes("SECOND_CHILD"),
      },
      {
        type: "select",
        label: "Type of Service for baby 3",
        name: "typeOfServiceChild3",
        placeholder: "Select type of service for baby 3",
        required: true,
        options: (formValues: any) => {
          if (formValues?.referral_type === "internal") {
            return SERVICE_TYPES_CHILD.filter(
              (opt: any) => opt.value !== "Other",
            );
          }
          return SERVICE_TYPES_CHILD;
        },
        showSearch: true,
        visibleIf: (v: any) =>
          ["internal", "external"].includes(v.referral_type) &&
          v.referralForChild?.includes("THIRD_CHILD"),
      },
      {
        label: "Reason to refer out patient(s)",
        type: "input",
        name: "refer_out_reason",
        required: true,
        placeholder: "Enter reason for external referral",
        colSpan: 8,
        visibleIf: (v: any) => v.referral_type === "external",
      },

      {
        type: "select",
        label: "Level of care",
        name: "levelOfCare",
        placeholder: "Select level of care",
        required: true,
        options: LEVEL_OF_CARE,
        showSearch: true,
        visibleIf: (v: any) => v.referral_type == "external",
      },
      {
        type: "select",
        label: "District Name",
        name: "district_id",
        placeholder: "Select district",
        required: true,
        showSearch: true,
        visibleIf: (v: any) => v.referral_type == "external",
      },
      {
        type: "select",
        label: "Facility Name",
        name: "facility_id",
        placeholder: "Select CEmONC facility",
        required: true,
        showSearch: true,
        visibleIf: (v: any) => v.referral_type == "external",
      },
    ],
  },
];
