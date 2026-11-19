import dayjs from "dayjs";
import { calculateAgeByDob } from "@/utils/ageCalculator";
import { TRIMISTER_TYPES, TypeOfContraception } from "./constants";
import { formatCnic } from "@/utils/formats/generalFormatters";

type Height = {
  feet: number;
  inches: number;
};

interface VitalsInput {
  weight?: number;
  height?: Height;
  height_cm?: number;
  body_mass_index?: number;
  family_planning_user?: boolean;
  family_planning_methods?: any[];
}

export type PregnancyDerived = {
  gestationalAge?: number;
  trimester?: string;
};

export const computeVitalsDerivedFields = (
  data: VitalsInput,
  patientAge?: any,
) => {
  let bmi: number | null = null;
  const hasWeight = data?.weight != null;

  // -------------------------

  // Age > 14 → feet + inches
  // -------------------------
  if (
    patientAge != null &&
    patientAge >= 14 &&
    hasWeight &&
    data?.height?.feet != null &&
    data?.height?.inches != null &&
    data?.weight != null
  ) {
    const totalInches = data.height.feet * 12 + data.height.inches;
    const heightMeters = totalInches * 0.0254;

    bmi = Number((data.weight / (heightMeters * heightMeters)).toFixed(1));
  }

  // -------------------------
  // Age ≤ 14 → height in cm
  // -------------------------
  else if (
    patientAge != null &&
    patientAge < 14 &&
    hasWeight &&
    data?.height_cm != null &&
    data?.weight != null
  ) {
    const heightMeters = Number(data.height_cm) / 100;
    bmi = Number((data.weight / (heightMeters * heightMeters)).toFixed(1));
  }

  // -------------------------
  // Family planning logic
  // -------------------------
  const family_planning_methods =
    data.family_planning_user === false ? [] : data.family_planning_methods;

  return {
    body_mass_index: bmi,
    ...(data.family_planning_user !== undefined && {
      family_planning_methods,
    }),
  };
};

export const opdAutoCalculateValues = (data: any, age: any) => {
  if (!data || Object.keys(data).length === 0) return {};

  // -------------------------------
  // 1. BMI
  // -------------------------------
  const { body_mass_index } = computeVitalsDerivedFields(data, age);

  // -------------------------------
  // 2. Weight Change
  // -------------------------------
  const change_in_weight =
    data.weight != null && data.last_weight != null
      ? Number(data.weight - data.last_weight).toFixed(1)
      : 0;

  return {
    ...data,
    body_mass_index,
    change_in_weight,
  };
};

export const AncFormAutoCalculateValues = (data: any, patientAge?: any) => {
  if (!data || Object.keys(data).length === 0) return {};

  const lmpDate = data?.lmp ? dayjs(data.lmp) : null;
  const currentDate = dayjs();

  // -------------------------------
  // 1. Gestational age
  // -------------------------------
  const gestational_age = lmpDate ? currentDate.diff(lmpDate, "week") : null;

  // -------------------------------
  // 2. EDD
  // -------------------------------
  const edd = lmpDate
    ? lmpDate
        .add(1, "year")
        .subtract(3, "month")
        .add(7, "day")
        .format("YYYY-MM-DD")
    : null;

  // -------------------------------
  // 3. Abortion Count
  // -------------------------------
  const abortion =
    data.gravidity != null && data.parity != null
      ? Math.max(0, data.gravidity - data.parity - 1)
      : null;

  // -------------------------------
  // 4. Trimester
  // -------------------------------
  let trimester = null;
  if (gestational_age !== null) {
    if (gestational_age < 13) trimester = TRIMISTER_TYPES.FIRST;
    else if (gestational_age < 28) trimester = TRIMISTER_TYPES.SECOND;
    else trimester = TRIMISTER_TYPES.THIRD;
  }

  // -------------------------------
  // 5. BMI
  // -------------------------------
  const { body_mass_index } = computeVitalsDerivedFields(data, patientAge);

  // -------------------------------
  // 6. Weight Change
  // -------------------------------
  const change_in_weight =
    data.weight != null && data.last_weight != null
      ? Number(data.weight - data.last_weight).toFixed(1)
      : 0;

  return {
    ...data,
    gestational_age,
    edd,
    trimester,
    body_mass_index,
    abortion,
    change_in_weight,
  };
};

interface PatientData {
  dob?: string | dayjs.Dayjs;
  additionalInfo?: Record<string, any>;
  socialDeterminants?: Record<string, any>;
  medicalHistories?: Record<string, any>;
  [key: string]: any;
}

export function formatPatientFormData(
  patientData: PatientData,
  formValues?: any,
): any | null {
  if (patientData && !formValues) {
    const formattedData = {
      ...patientData,
      ...patientData.additionalInfo,
      ...patientData.socialDeterminants,
      ...patientData.medicalHistories,
    };

    const nationalityStatus = patientData.nationalityStatus || "Pakistani";
    formattedData.nationalityStatus = nationalityStatus;

    if (nationalityStatus === "Pakistani") {
      formattedData.cnic = formatCnic(patientData.cnic || "");
      formattedData.cnic_provider = patientData.cnic_provider;
      formattedData.international_id = undefined;
    } else {
      formattedData.international_provider = patientData.cnic_provider;
      formattedData.international_id = patientData.cnic || "";
      formattedData.cnic = undefined;
    }

    const dobValue = formattedData.dob;
    const dobString = dayjs.isDayjs(dobValue)
      ? dobValue.format("DD-MM-YYYY")
      : dobValue;

    (formattedData as any).age = dobString
      ? calculateAgeByDob(dobString)
      : null;

    if (formattedData.dob) {
      formattedData.dob = dayjs(formattedData.dob);
    }

    return formattedData;
  }

  return null;
}

export const computePregnancyFromLmp = (
  lmp?: string | dayjs.Dayjs,
): PregnancyDerived => {
  if (!lmp) return {};

  const lmpDate = dayjs(lmp);
  if (!lmpDate.isValid()) return {};

  const today = dayjs();
  const weeks = today.diff(lmpDate, "week");

  let trimester: string | undefined;
  if (weeks < 13) {
    trimester = TRIMISTER_TYPES.FIRST;
  } else if (weeks < 26) {
    trimester = TRIMISTER_TYPES.SECOND;
  } else {
    trimester = TRIMISTER_TYPES.THIRD;
  }

  // Validation for these two fields is handled downstream in their validators
  // Do not handle here
  return {
    gestationalAge: weeks,
    trimester,
  };
};

export interface FormField {
  name: string;
  warningEnableCondition?: (values: any) => string | null;
}

export interface TabConfig {
  fields: FormField[];
}

interface CheckWarningParams {
  allValues: any;
  changedValues: any;
  previousValues: any;
  currentFormFields: TabConfig[];
}

export const checkFormWarningMessages = ({
  allValues,
  changedValues,
  previousValues,
  currentFormFields,
}: CheckWarningParams) => {
  const changedFieldNames = Object.keys(changedValues);

  // Step 1: Get fields that support warnings
  const warningApplicableFields = currentFormFields
    .flatMap((tab) => tab.fields)
    .filter((field) => changedFieldNames.includes(field.name));

  if (warningApplicableFields.length === 0) return null;

  // Step 2: Normalize changed values (support arrays)
  const normalizedChangedValues = Object.fromEntries(
    changedFieldNames.map((fieldName) => {
      const current = changedValues[fieldName];
      const previous = previousValues?.[fieldName];

      if (Array.isArray(current)) {
        const addedItems = current.filter(
          (item: any) => !previous?.includes(item),
        );
        if (addedItems.length === 0) return [fieldName, null];
        return [fieldName, addedItems[addedItems.length - 1]];
      }

      return [fieldName, current];
    }),
  );

  // Step 3: Remove unchanged/null fields
  const filteredNormalizedValues = Object.fromEntries(
    Object.entries(normalizedChangedValues).filter(([, v]) => v !== null),
  );

  if (Object.keys(filteredNormalizedValues).length === 0) return null;

  // Step 4: Trigger first field's condition
  const message = warningApplicableFields[0]?.warningEnableCondition?.({
    ...allValues,
    ...filteredNormalizedValues,
  });

  return message || null;
};

// Generic helper to transform previous prescriptions into form values
export function mapPrescriptionsToFormValues(
  previousPrescribedMedicine: any[] = [],
) {
  return {
    previousPrescriptions: previousPrescribedMedicine.map((item) => {
      const variant = item?.medicineVariant || {};
      const med = variant?.medicine || {};
      const category = (med.category || "").toLowerCase();

      const isContraceptive =
        med.category === TypeOfContraception.LARC ||
        med.category === TypeOfContraception.SHORT_TERM;

      const required_quantity = item?.desiredQuantity ?? item?.required_qty;

      const quantity_Dispensed = item?.dispensedQuantity ?? item?.dispensed_qty;

      /* ---------- SUPPLEMENT ---------- */
      if (category === "supplement") {
        return {
          category,
          isContraceptive,
          supplementName: med.name || "",
          supplementDosage: item.medicineDosage || "N/A",
          supplementInstruction: item.medicineInstruction || "",
          required_quantity,
          quantity_Dispensed,
          formOfMedicine: variant.unit,
        };
      }

      /* ---------- CONTRACEPTIVE ---------- */
      if (isContraceptive) {
        return {
          category,
          isContraceptive,
          method_name: med.name || "",
          required_quantity,
          quantity_Dispensed,
          formOfMedicine: variant.unit,
        };
      }

      /* ---------- NORMAL MEDICINE ---------- */
      return {
        category,
        isContraceptive,
        medicineName: med.name || "",
        strength: variant.strength || "",
        medicineDosage: item.medicineDosage || "N/A",
        medicineDuration: item.medicineDuration || "N/A",
        formOfMedicine: variant.unit || "",
        medicineInstruction: item.medicineInstruction || "",
        required_quantity,
        quantity_Dispensed,
      };
    }),
  };
}

export const cleanupHiddenFields = (
  formFields: any,
  values: any,
  form?: any,
) => {
  const cleaned: any = { ...values };
  const fieldsToClear: Record<string, any> = {};

  formFields?.forEach((tab: any) => {
    (tab.fields || []).forEach((field: any) => {
      /* ---------------- FORM LIST ---------------- */
      if (field.type === "formList") {
        const isVisible =
          !field.visibleIf ||
          typeof field.visibleIf !== "function" ||
          field.visibleIf(values);

        cleaned[field.name] = isVisible ? values[field.name] : [{}];
        return;
      }

      /* ---------------- TABLE ---------------- */
      if (field.type === "table") {
        const rows = values?.[field.name] || [];
        const groupFields = field.getGroupFields?.(values) || [];

        cleaned[field.name] = rows.map((row: any, idx: number) => {
          const cleanedRow = { ...row };

          groupFields.forEach((tableField: any) => {
            const isVisible =
              !tableField.visibleIf ||
              typeof tableField.visibleIf !== "function" ||
              tableField.visibleIf(values, idx);

            if (!isVisible) {
              cleanedRow[tableField.name] = undefined;
            }
          });

          return cleanedRow;
        });

        return;
      }

      /* ---------------- NORMAL FIELD ---------------- */
      const isVisible =
        !field.visibleIf ||
        typeof field.visibleIf !== "function" ||
        field.visibleIf(values);

      if (isVisible) {
        cleaned[field.name] = values[field.name];
      } else {
        cleaned[field.name] = undefined;
        fieldsToClear[field.name] = undefined;
      }
    });
  });

  if (form && Object.keys(fieldsToClear).length > 0) {
    form.setFieldsValue(fieldsToClear);
  }

  return cleaned;
};

export const isSupplementOther = (
  values: Record<string, any>,
  fieldIndex: number,
  key: string = "supplements",
  nameKey: string = "supplementName",
): boolean => {
  const selectedSupplement = values?.[key] || [];
  const currentSupplement = selectedSupplement?.[fieldIndex]?.[nameKey];
  return currentSupplement === "Other";
};

export const isMedicineOther = (
  values: Record<string, any>,
  fieldIndex: number,
  arrayKey: string,
  nameKey: string,
): boolean => {
  const selectedItems = values?.[arrayKey] || [];
  const currentItem = selectedItems?.[fieldIndex]?.[nameKey];
  return currentItem === "Other";
};

export const getVariantIdMedicine = (
  medicineName: any,
  formOfMedicine: any,
  medicineOptions: any[],
  strength: any,
) => {
  const medicine = medicineOptions.find((m) => m.id === medicineName);
  if (!medicine) {
    return null;
  }

  let variantId = null;
  if (medicine?.contraceptive === false) {
    let foundVariant = medicine?.variants?.find(
      (v: any) =>
        v.unit?.toLowerCase() === formOfMedicine?.toLowerCase() &&
        v.strength?.toLowerCase() === strength?.toLowerCase(),
    );

    variantId = foundVariant?.variant_id;
  } else {
    variantId = getOtherCategoryMedicineVariantIds(
      medicineName,
      medicineOptions,
    );
  }

  return variantId || null;
};

export const getMedicineName = (
  medicineId: any,
  formOfMedicine: any,
  medicineOptions: any[],
  strength: any,
) => {
  const medicine = medicineOptions.find((m) => m.id === medicineId);
  if (!medicine) return null;

  let medicineName = null;
  if (medicine?.contraceptive === false) {
    let foundVariant = medicine?.variants?.find(
      (v: any) =>
        v.unit?.toLowerCase() === formOfMedicine?.toLowerCase() &&
        v.strength?.toLowerCase() === strength?.toLowerCase(),
    );

    medicineName = foundVariant?.medicine?.name;
  } else {
  }

  return medicineName || null;
};

export const getOtherCategoryMedicineVariantName = (
  medicineId: any,
  options: any[],
) => {
  const medicine = options?.find((m) => m.id === medicineId);

  if (!medicine) return null;

  // return first available variant_id (or null if empty)
  return medicine?.variants?.[0]?.medicine?.name || null;
};

export const isMedicineVariantOtc = (
  medicineName: any,
  formOfMedicine: any,
  medicineOptions: any[],
  strength: any,
) => {
  if (!medicineName) return;
  const medicine = medicineOptions.find((m) => m.id === medicineName);
  if (!medicine) return null;

  let isOtc = null;
  if (medicine?.contraceptive == false) {
    const foundVariant = medicine?.variants?.find(
      (v: any) =>
        v.unit?.toLowerCase() === formOfMedicine?.toLowerCase() &&
        v.strength?.toLowerCase() === strength?.toLowerCase(),
    );

    isOtc = foundVariant?.is_otc;
  } else {
    const medicine = medicineOptions?.find((m) => m.id === medicineName);

    if (!medicine) return null;

    // return first available variant_id (or null if empty)
    isOtc = medicine?.variants?.[0]?.is_otc || null;
  }

  return isOtc;
};

export const getOtherCategoryMedicineVariantIds = (
  medicineId: any,
  options: any[],
) => {
  const medicine = options?.find((m) => m.id === medicineId);

  if (!medicine) return null;

  // return first available variant_id (or null if empty)
  return medicine?.variants?.[0]?.variant_id || null;
};

export const mergeOtherPrescriptions = (
  mappedSupplements: any[],
  mappedMedicine: any[],
  mappedOtherPrescriptions: any[],
) => {
  const finalMappedSupplements = [...mappedSupplements];
  const finalMappedMedicine = [...mappedMedicine];

  mappedOtherPrescriptions.forEach((item) => {
    if (item?.category === "Supplement") {
      const formattedSupplementOther = {
        supplementName: "Other",
        other_supplement: item?.name,
        supplementDosage: item.medicineDosage,
        medicineDuration: item.medicineDuration,
        medicineInstruction: item.medicineInstruction,
      };
      finalMappedSupplements.push(formattedSupplementOther);
    } else if (item.category === "Medicine") {
      const formattedMedicineOther = {
        medicineName: "Other",
        other_medicine: item?.name,
        medicineDosage: item.medicineDosage,
        medicineDuration: item.medicineDuration,
        medicineInstruction: item.medicineInstruction,
      };
      finalMappedMedicine.push(formattedMedicineOther);
    }
  });

  return {
    finalMappedSupplements,
    finalMappedMedicine,
  };
};

export const categoryIsMedicine = (
  medicineId: number | string,
  options: any[],
): boolean => {
  if (!medicineId || !options?.length) return false;

  const medicine = options.find((m) => Number(m.value) === Number(medicineId));

  const category = medicine?.category;

  return (
    category !== "Supplement" &&
    category !== "LARC" &&
    category !== "Short term"
  );
};

export const getDoseDateByVaccineId = (
  vaccineId: number,
  doses: any[] = [],
) => {
  const dose = doses.find((d: any) => d?.vaccine?.id === vaccineId);
  return dose?.dateAdministered || "";
};

// ---------------- IMMUNISATION HELPERS ----------------

export const getAdministeredVaccineIds = (vaccinesApiData: any[] = []) => {
  return new Set<number>(
    vaccinesApiData
      .filter((v) => v.immunisationDosageStatus === "Administered")
      .map((v) => v.id),
  );
};

export const buildImmunisationDoses = (
  formValues: any,
  administeredVaccineIds: Set<number>,
  tdVaccines: any[] = [],
) => {
  const doseMap = tdVaccines.map((vaccine: any) => ({
    key: `dateAdministered${vaccine.dose_number}`,
    vaccine_id: vaccine.id,
  }));

  return doseMap
    .filter(
      ({ key, vaccine_id }) =>
        formValues?.[key] && !administeredVaccineIds.has(vaccine_id),
    )
    .map(({ key, vaccine_id }) => ({
      vaccine_id,
      dateAdministered: new Date(formValues[key]).toISOString().split("T")[0],
      status: "Administered",
    }));
};

export const cleanupHiddenFieldsNewborn = (formFields: any, values: any) => {
  if (!values || !formFields) return values;

  let hasChanges = false;
  const result: any = {};

  formFields?.forEach((tab: any) => {
    (tab.fields || []).forEach((field: any) => {
      const fieldName = field.name;
      const fieldValue = values[fieldName];

      // Check if top-level field is visible
      const isFieldVisible =
        !field.visibleIf ||
        typeof field.visibleIf !== "function" ||
        field.visibleIf(values);

      // If field is hidden, clear it
      if (!isFieldVisible) {
        const clearedValue = Array.isArray(fieldValue) ? [] : undefined;
        if (fieldValue !== clearedValue) hasChanges = true;
        result[fieldName] = clearedValue;
        return;
      }

      // Field is visible - check if it's a formList
      const isFormList =
        field.type === "formList" || field.type === "formList_unscrollable";

      if (isFormList && Array.isArray(fieldValue) && field.fields) {
        // Check if any nested fields have visibleIf
        const hasNestedConditions = field.fields.some(
          (f: any) => typeof f.visibleIf === "function",
        );

        if (!hasNestedConditions) {
          // No conditional fields - use original reference
          result[fieldName] = fieldValue;
          return;
        }

        // Process each item in the formList
        const cleanedArray = fieldValue.map((item: any, itemIndex: number) => {
          if (!item) return item;

          let itemHasChanges = false;
          const cleanedItem: any = {};

          // Process each nested field
          field.fields.forEach((nestedField: any) => {
            const nestedName = nestedField.name;
            const nestedValue = item[nestedName];

            // Check visibility of nested field
            const isNestedVisible =
              !nestedField.visibleIf ||
              typeof nestedField.visibleIf !== "function" ||
              nestedField.visibleIf(values, itemIndex);

            if (!isNestedVisible) {
              // Clear hidden nested field
              const clearedValue = Array.isArray(nestedValue) ? [] : undefined;
              if (nestedValue !== clearedValue) {
                itemHasChanges = true;
                hasChanges = true;
              }
              cleanedItem[nestedName] = clearedValue;
              return;
            }

            // Nested field is visible - check if it's also a formList
            const isNestedFormList =
              nestedField.type === "formList" ||
              nestedField.type === "formList_unscrollable";

            if (
              isNestedFormList &&
              Array.isArray(nestedValue) &&
              nestedField.fields
            ) {
              // Check if double-nested fields have conditions
              const hasDeepConditions = nestedField.fields.some(
                (f: any) => typeof f.visibleIf === "function",
              );

              if (!hasDeepConditions) {
                // No conditions - preserve reference
                cleanedItem[nestedName] = nestedValue;
                return;
              }

              // Handle double-nested formList
              const cleanedSubArray = nestedValue.map((subItem: any) => {
                if (!subItem) return subItem;

                let subItemHasChanges = false;
                const cleanedSubItem: any = {};

                nestedField.fields.forEach((deepField: any) => {
                  const deepName = deepField.name;
                  const deepValue = subItem[deepName];

                  const isDeepVisible =
                    !deepField.visibleIf ||
                    typeof deepField.visibleIf !== "function" ||
                    deepField.visibleIf(values, itemIndex);

                  if (!isDeepVisible) {
                    const clearedValue = Array.isArray(deepValue)
                      ? []
                      : undefined;
                    if (deepValue !== clearedValue) {
                      subItemHasChanges = true;
                      itemHasChanges = true;
                      hasChanges = true;
                    }
                    cleanedSubItem[deepName] = clearedValue;
                  } else {
                    cleanedSubItem[deepName] = deepValue;
                  }
                });

                // If nothing changed in subItem, return original
                return subItemHasChanges ? cleanedSubItem : subItem;
              });

              cleanedItem[nestedName] = cleanedSubArray;
            } else {
              // Regular nested field
              cleanedItem[nestedName] = nestedValue;
            }
          });

          // If nothing changed in item, return original
          return itemHasChanges ? cleanedItem : item;
        });

        result[fieldName] = cleanedArray;
      } else {
        // Regular field - just copy reference
        result[fieldName] = fieldValue;
      }
    });
  });

  // If nothing changed, return original object to preserve reference
  return hasChanges ? result : values;
};
