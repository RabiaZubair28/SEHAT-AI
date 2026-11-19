export const isLastTab = (activeKey: string, formFields: any) => {
  let lastIndex = formFields.length;
  return activeKey === lastIndex.toString();
};

export const groupFieldsByRow = (fields: any[] = []) => {
  if (!fields || fields.length === 0) return [];

  const rows: any[][] = [];
  let currentRow: any[] = [];
  let currentRowSpan = 0;

  fields.forEach((field) => {
    if (!field) return;

    const colSpan = Math.min(field.colSpan || 8, 24);

    if (currentRowSpan + colSpan > 24) {
      rows.push(currentRow);
      currentRow = [field];
      currentRowSpan = colSpan;
    } else {
      currentRow.push(field);
      currentRowSpan += colSpan;
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};

export const FeetToInches = (height: any) => {
  const { feet, inches } = height;
  if (
    feet !== undefined &&
    feet !== null &&
    inches !== undefined &&
    inches !== null
  ) {
    return feet * 12 + inches;
  }

  return null;
};

// export const formatHeight = (height: any, age: number | null) => {
//   if (!height || age == null) return null;

//   if (age >= 14) {
//     // Adult: return { feet, inches }
//     return typeof height === "object" ? height : InchesToFeetInches(height);
//   } else {
//     // Child: return cm
//     if (typeof height === "number") return InchesToCm(height);

//     return null;
//   }
// };

export const InchesToFeetInches = (totalInches: number) => {
  if (!totalInches && totalInches !== 0) return { feet: null, inches: null };

  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return { feet, inches };
};

// Convert cm to total inches
// Convert cm to total inches (rounded to nearest whole number)
export const CmToInches = (heightCm: number | null | undefined) => {
  if (heightCm !== undefined && heightCm !== null) {
    return Math.round(heightCm / 2.54);
  }
  return null;
};

// Convert total inches to cm (rounded to nearest whole number)
export const InchesToCm = (totalInches: number | null | undefined) => {
  if (totalInches !== undefined && totalInches !== null) {
    return Math.round(totalInches * 2.54);
  }
  return null;
};

export const autoFillPrescriptionFields = ({
  changedValues,
  allValues,
  form,
  medicineOptions,
  supplementOptions,
}: {
  changedValues: any;
  allValues: any;
  form: any;
  medicineOptions: any[];
  supplementOptions: any[];
}) => {
  // 1️⃣ Detect whether medicine or supplements changed
  const type = Object.keys(changedValues).find((key) =>
    ["medicine", "supplements"].includes(key),
  );
  if (!type) return;

  // 2️⃣ Find changed index
  const index = changedValues[type].findIndex(
    (item: any) => item !== undefined,
  );
  if (index === -1) return;

  // 3️⃣ ID field name based on type
  const idField = type === "medicine" ? "medicineName" : "supplementName";
  const selectedId = changedValues[type][index]?.[idField];
  if (!selectedId) return;

  // 4️⃣ Choose correct option list
  const options = type === "medicine" ? medicineOptions : supplementOptions;

  // 5️⃣ Find selected medicine/supplement
  const selected = options.find((opt: any) => opt.id === selectedId);
  if (!selected) return;

  // 6️⃣ Apply updates
  const updatedList = allValues[type].map((row: any, i: number) =>
    i === index
      ? {
          ...row,
          strength: selected.strength,
          formOfMedicine: selected.formOfMedicine,
        }
      : row,
  );

  // 7️⃣ Update form
  form.setFieldsValue({
    [type]: updatedList,
  });
};

export const getStrengthsByMedicineId = (
  selectedMedicineId: number,
  medicineOptions: any[],
) => {
  if (!selectedMedicineId || !medicineOptions) return [];
  const medicineRecord = medicineOptions?.find(
    (opt: any) => opt.value === selectedMedicineId,
  );

  const strengthOptions = [
    ...new Set(medicineRecord?.variants.map((v: any) => v.strength)),
  ].map((s) => ({ label: s, value: s }));

  return strengthOptions;
};

export const getFormOfMedicineByMedicineIdAndStrength = (
  selectedMedicineId: number,
  selectedStrength: string | number,
  medicineOptions: any[],
) => {
  if (!selectedMedicineId || !medicineOptions || !selectedStrength) return [];

  const medicineRecord = medicineOptions.find(
    (opt: any) => opt.value === selectedMedicineId,
  );

  if (!medicineRecord?.variants) return [];

  // Filter variants by strength if provided
  const filteredVariants = selectedStrength
    ? medicineRecord.variants.filter(
        (v: any) => v.strength === selectedStrength,
      )
    : medicineRecord.variants;

  const formOptions = [
    ...new Set(filteredVariants.map((v: any) => v.unit)),
  ].map((u) => ({ label: u, value: u }));

  return formOptions;
};

export const filterFormListOptions = (
  options: any[],
  formValues: any,
  formListName: string,
  fieldName: string,
  currentIndex: number,
  groupByField?: string,
) => {
  const currentGroupId = groupByField
    ? formValues?.[formListName]?.[currentIndex]?.[groupByField]
    : null;

  const selectedValues =
    formValues?.[formListName]
      ?.filter((item: any, i: number) => {
        if (i === currentIndex) return false;
        if (groupByField) return item?.[groupByField] === currentGroupId;
        return true;
      })
      ?.map((item: any) => item?.[fieldName]) || [];

  if (selectedValues.length === 0) return options;

  return options.filter(
    (opt: any) =>
      !selectedValues.includes(opt.value) ||
      formValues?.[formListName]?.[currentIndex]?.[fieldName] === opt.value,
  );
};
