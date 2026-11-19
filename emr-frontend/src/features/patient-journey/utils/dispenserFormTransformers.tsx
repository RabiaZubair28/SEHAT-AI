import {
  categoryIsMedicine,
  getOtherCategoryMedicineVariantIds,
  getVariantIdMedicine,
} from "../data/moduleHelpers";

export const transformFormDataToDispneserApi = (
  formValues: any,
  selectedPatientPrescibedMedicines: any[],
  appointmentId: number,
  patientId: number,
  medicineOptions: any[]
) => {
  if (!formValues) return null;

  let otc_items = [];
  if (formValues?.otc_required === true) {
    otc_items = formValues?.medicine
      .map((item: any) => {
        const isMedicine = categoryIsMedicine(
          item.medicineName,
          medicineOptions
        );

        const medicine_variant_id = isMedicine
          ? getVariantIdMedicine(
              item.medicineName,
              item.formOfMedicine,
              medicineOptions,
              item.strength
            )
          : getOtherCategoryMedicineVariantIds(
              item.medicineName,
              medicineOptions
            );

        if (!medicine_variant_id || !item.quantity_dispensed_otc) return null;

        return {
          medicine_variant_id,
          quantity: item.quantity_dispensed_otc,
        };
      })
      .filter(Boolean);
  }

  return {
    patient_id: patientId ?? null,
    appointment_id: appointmentId ?? null,

    // Previous prescriptions
    items: selectedPatientPrescibedMedicines?.map((p) => ({
      prescription_id: p.id,
    })),
    otcMedRequired: formValues?.otc_required,
    otc_items,
    visitDate: new Date().toISOString(),
    // OTC Medicines
  };
};
