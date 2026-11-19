// Generic helper to group contraceptives by name
export const groupMedicineVariants = (data: any[], addOther: boolean) => {
  if (!data) return [];

  const grouped: Record<string, any> = {};

  data.forEach((item) => {
    const name = item.medicine.name;
    const medicine_id = item?.medicine?.id;

    if (!grouped[name]) {
      grouped[name] = {
        id: medicine_id,
        label: name,
        value: medicine_id,
        category: item?.medicine?.category,
        contraceptive: item?.medicine?.contraceptive,
        variants: [], // hold unit + quantity
      };
    }

    grouped[name].variants.push({
      variant_id: item.id,
      unit: item.unit,
      strength: item?.strength,
      quantity: item.quantity,
      is_otc: item?.batches?.[0]?.otc || false, // store OTC per variant
    });
  });

  const optionsArray = Object.values(grouped);

  //Optionally append "Other"
  if (addOther && optionsArray.length > 0) {
    optionsArray.push({
      id: 0,
      label: "Other",
      value: "Other",
      variants: [],
    });
  }

  return optionsArray;
};
