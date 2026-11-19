import {
  CmToInches,
  FeetToInches,
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import { getOtherCategoryMedicineVariantIds } from "../data/moduleHelpers";

export const transformFormDataToNutritionApi = (
  formValues: any,
  appointmentId: any,
  supplementOptions: any[],
  patientAge: any
) => {
  const mappedSupplements = Array.isArray(formValues?.supplements)
    ? formValues.supplements
        .filter(
          (item: any) => item && (item.supplementName || item.other_supplement)
        )
        .map((item: any) => ({
          medicines: item.supplementName || null,
          medicineDosage: item.supplementDosage || null,
          medicineInstruction: formValues?.supplementsInstruction || null,
          medicineDispensed: false,
          otherName: item?.other_supplement || null,
          variant_id: getOtherCategoryMedicineVariantIds(
            item.supplementName,
            supplementOptions
          ),
        }))
    : [];

  const otherPrescriptions: any[] = [];
  const prescriptions: any[] = [];

  [...mappedSupplements].forEach((item) => {
    if (item.medicines === "Other") {
      otherPrescriptions.push({
        name: item?.otherName,
        medicineDosage: item.medicineDosage,
        medicineInstruction: item.medicineInstruction,
        category: "Supplement",
      });
    } else {
      prescriptions.push({
        medicine_variant_id: item.variant_id,
        medicineDosage: item.medicineDosage,
        medicineInstruction: item.medicineInstruction,
      });
    }
  });

  return {
    appointment_id: appointmentId,

    serviceInfo: {
      patient_coming_from: formValues.patient_reffered_by || null,
      reason_for_admission: formValues.addmission_reason || null,
      counselled_on_nutrition_and_diet: Boolean(formValues.counsling_status),
    },

    vitalAssessment: {
      weight: formValues.weight != null ? Number(formValues.weight) : null,
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      pulse: formValues.pulse != null ? Number(formValues.pulse) : null,
      systolic_bp:
        formValues.systolic_bp != null ? Number(formValues.systolic_bp) : null,
      diastolic_bp:
        formValues.diastolic_bp != null
          ? Number(formValues.diastolic_bp)
          : null,
      temperature:
        formValues.temperature != null ? Number(formValues.temperature) : null,

      muac: formValues.muac != null ? Number(formValues.muac) : null,
      edema: formValues.edema || null,

      is_experiencing_complications: Boolean(formValues.patient_complications),
      complications: formValues.patient_selected_complications || [],
    },

    prescribing_supplements: Boolean(
      formValues.supplements_prescribed && prescriptions.length > 0
    ),
    otherPrescriptions,
    prescriptions,
  };
};

export const transformUpdateFormDataToNutritionApi = (
  formValues: any,
  appointmentId: any,
  patientAge: any
) => {
  return {
    appointment_id: appointmentId,

    serviceInfo: {
      patient_coming_from: formValues.patient_reffered_by || null,
      reason_for_admission: formValues.addmission_reason || null,
      counselled_on_nutrition_and_diet: Boolean(formValues.counsling_status),
    },

    vitalAssessment: {
      weight: formValues.weight != null ? Number(formValues.weight) : null,
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      pulse: formValues.pulse != null ? Number(formValues.pulse) : null,
      systolic_bp:
        formValues.systolic_bp != null ? Number(formValues.systolic_bp) : null,
      diastolic_bp:
        formValues.diastolic_bp != null
          ? Number(formValues.diastolic_bp)
          : null,
      temperature:
        formValues.temperature != null ? Number(formValues.temperature) : null,

      muac: formValues.muac != null ? Number(formValues.muac) : null,
      edema: formValues.edema || null,

      is_experiencing_complications: Boolean(formValues.patient_complications),
      complications: formValues.patient_selected_complications || [],
    },
  };
};

export const transformNutritionApiToFormData = (apiData: any) => {
  if (!apiData) return;

  const vs = apiData.nutritionVitalAssessment || {};
  const si = apiData.nutritionServiceInfo || {};

  const mappedSupplements: any[] = [];
  var supplementsInstrction = "";

  supplementsInstrction =
    apiData?.prescriptions && apiData?.presciptions?.length > 0
      ? apiData?.presciptions?.[0]?.medicineInstruction
      : null;

  (apiData.prescriptions || []).forEach((p: any) => {
    const variant = p.medicineVariant;
    const isSupplement = variant?.medicine.category === "Supplement";
    supplementsInstrction = p.medicineInstruction;
    if (isSupplement) {
      mappedSupplements.push({
        supplementName: variant?.medicine?.name,
        supplementDosage: p.medicineDosage,
        supplementDuration: p.medicineDuration,
        supplementInstruction: p.medicineInstruction,
      });
    }
  });

  const mappedOtherPrescriptions =
    apiData?.otherPrescriptions?.map((item: any) => ({
      supplementName: "Other",
      other_supplement: item?.name,
      supplementDosage: item.medicineDosage,
    })) || [];

  const finalSupplementsMapped = [
    ...mappedSupplements,
    ...mappedOtherPrescriptions,
  ];

  return {
    // ---------- VITALS ----------
    weight: vs.weight != null ? Number(vs.weight) : null,
    height: InchesToFeetInches(vs.height || 0),
    height_cm: InchesToCm(vs.height || 0),
    systolic_bp: vs.systolic_bp ?? null,
    diastolic_bp: vs.diastolic_bp ?? null,
    temperature: vs.temperature ?? null,
    pulse: vs.pulse ?? null,
    muac: vs.muac != null ? Number(vs.muac) : null,
    edema: vs.edema || "Mild",

    spo2: vs.spo2 ?? null,
    respiratory_rate: vs.respiratory_rate ?? null,
    bmi: vs.bmi != null ? String(vs.bmi) : "",
    blood_group: vs.blood_group || "",

    // ---------- SERVICE INFO ----------
    patient_reffered_by: si.patient_coming_from || "",
    addmission_reason: si.reason_for_admission || "",
    counsling_status: si.counselled_on_nutrition_and_diet || false,

    // ---------- COMPLICATIONS ----------
    patient_complications: vs.is_experiencing_complications || false,
    patient_selected_complications: vs.complications || [],

    // ---------- SUPPLEMENTS (from prescriptions) ----------
    supplements_prescribed: finalSupplementsMapped.length > 0,
    supplements: finalSupplementsMapped,
    // 👇 match your form field name exactly
    supplementsInstrction,

    // ---------- OTHER FORM FLAGS ----------
    serviceCompleted: apiData.status === "completed",
  };
};

/**
 * Nutrition form values for the AI Nutrition Advisor. The Advisor only needs
 * supplement names, so a supplement whose variant can no longer be resolved
 * (e.g. not in this facility's current list) is passed by name instead of
 * failing validation. Saving the Nutrition record still uses the normal transform.
 */
export const transformFormDataToAdvisorInput = (
  formValues: any,
  appointmentId: any,
  supplementOptions: any[],
  patientAge: any
) => {
  const input: any = transformFormDataToNutritionApi(formValues, appointmentId, supplementOptions, patientAge);
  // Same order as the transform's prescriptions: named (non-"Other") supplements.
  const names: string[] = (Array.isArray(formValues?.supplements) ? formValues.supplements : [])
    .filter((item: any) => item?.supplementName && item.supplementName !== "Other")
    .map((item: any) => String(item.supplementName));
  const resolved: any[] = [];
  const byName: any[] = [];
  (input.prescriptions ?? []).forEach((p: any, index: number) => {
    if (Number.isInteger(p.medicine_variant_id)) resolved.push(p);
    else byName.push({ name: names[index] ?? "Supplement", medicineDosage: p.medicineDosage,
      medicineInstruction: p.medicineInstruction, category: "Supplement" });
  });
  return {
    ...input,
    prescriptions: resolved,
    otherPrescriptions: [...(input.otherPrescriptions ?? []), ...byName],
    prescribing_supplements: Boolean(formValues?.supplements_prescribed) && resolved.length + byName.length > 0,
  };
};
