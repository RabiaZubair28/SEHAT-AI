import { getOtherCategoryMedicineVariantIds } from "../data/moduleHelpers";

export const transformFamilyPlanningFormDataToApi = (
  formData: any,
  appointmentId: number,
  larcContraceptiveOptions: any[],
  shortTermContraceptiveOptions: any[],
) => {
  // Combine short-term + LARC prescriptions

  // Family Planning prescriptions
  const fpPrescriptionsShortTerm =
    (formData?.family_planning_prescriptions_short_term || []).map(
      (item: any) => ({
        medicine_variant_id: getOtherCategoryMedicineVariantIds(
          item.selected_family_planning_method_short_term,
          shortTermContraceptiveOptions,
        ),
        quantity: item.quantity_short_term,
      }),
    ) || [];

  console.log("fpPrescriptionsShortTerm", fpPrescriptionsShortTerm);

  const fpPrescriptionsLarc =
    (formData?.family_planning_prescriptions_larc || []).map((item: any) => ({
      medicine_variant_id: getOtherCategoryMedicineVariantIds(
        item.selected_family_planning_method_larc,
        larcContraceptiveOptions,
      ),
      quantity: item.quantity_larc,
    })) || [];

  const fpPrescriptions = [...fpPrescriptionsShortTerm, ...fpPrescriptionsLarc];

  return {
    appointment_id: appointmentId,
    client_type: formData?.client_type,
    years_of_marriage: formData?.years_of_marriage || null, // you can update
    total_pregnancy_since_last_period:
      formData?.total_pregnancy_since_last_period,
    new_user: formData?.new_user,
    previous_method_in_use: formData?.previous_method_in_use,
    previous_fp_methods_used: formData?.previous_fp_methods_used,
    service_category: formData?.service_category,
    client_category: formData?.client_category,
    prescriptions: fpPrescriptions,
    insertion_period: formData?.insertion_period || null,
    removal_reason: formData?.removal_reason || null,
    client_counseling_done: formData?.client_counseling_done,
  };
};

export const transformFamilyPlanningUpdateApi = (
  formData: any,
  appointmentId: number,
) => {
  return {
    appointment_id: appointmentId,
    client_type: formData?.client_type,
    years_of_marriage: formData?.years_of_marriage || null,
    total_pregnancy_since_last_period:
      formData?.total_pregnancy_since_last_period,
    new_user: formData?.new_user,
    previous_method_in_use: formData?.previous_method_in_use || null,
    previous_fp_methods_used: formData?.previous_fp_methods_used || null,
    insertion_period: formData?.insertion_period || null,
    removal_reason: formData?.removal_reason || null,
    client_counseling_done: formData?.client_counseling_done,
  };
};

export const transformFamilyPlanningApiToFormData = (apiData: any) => {
  if (!apiData) return;

  // Extract nested FP block
  const fp = apiData?.familyPlanning || {};
  const prescriptions = apiData?.prescriptions || [];

  // ---- Short term prescriptions (category based) ----
  const shortTermPrescriptions = prescriptions
    .filter(
      (item: any) => item?.medicineVariant?.medicine?.category === "Short term",
    )
    .map((p: any) => ({
      selected_family_planning_method_short_term:
        p.medicineVariant.medicine.name,
      quantity_short_term: p.quantity,
    }));

  // ---- LARC prescriptions ----
  const larcPrescriptions = prescriptions
    .filter((item: any) => item?.medicineVariant?.medicine?.category === "LARC")
    .map((p: any) => ({
      selected_family_planning_method_larc: p.medicineVariant.medicine.id,
      quantity_larc: p.quantity,
    }));

  // ---- Detect contraception type ----
  let type_of_contraception: string | null = null;

  if (shortTermPrescriptions.length > 0) {
    type_of_contraception = "Short term";
  } else if (larcPrescriptions.length > 0) {
    type_of_contraception = "LARC";
  }

  // ---- Return final form data ----
  return {
    client_type: fp?.client_type || null,
    years_of_marriage: fp?.years_of_marriage || null,
    total_pregnancy_since_last_period:
      fp?.total_pregnancy_since_last_period || null,

    new_user: fp?.new_user ?? null,
    previous_method_in_use: fp?.previous_method_in_use ?? null,
    previous_fp_methods_used: fp?.previous_fp_methods_used || [],

    service_category: fp?.service_category || null,
    client_category: fp?.client_category || null,

    insertion_period: fp?.insertion_period || null,
    removal_reason: fp?.removal_reason || null,

    type_of_contraception,

    family_planning_prescriptions_short_term: shortTermPrescriptions,
    family_planning_prescriptions_larc: larcPrescriptions,

    client_counseling_done: fp?.client_counseling_done ?? null,
  };
};
