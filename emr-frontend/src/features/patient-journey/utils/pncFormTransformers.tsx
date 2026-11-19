import {
  CmToInches,
  FeetToInches,
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import {
  buildImmunisationDoses,
  getAdministeredVaccineIds,
  getOtherCategoryMedicineVariantIds,
} from "../data/moduleHelpers";
import {PncVisitResponseDto} from "@/features/patient-journey/pnc/types";

export const transformFormDataToPncApi = (
  formValues: any,
  patientId: any,
  appointmentId: any,
  supplementOptions: any[],
  larcContraceptiveOptions: any[],
  shortTermContraceptiveOptions: any[],
  patientVaccinesInfo: any[],
  patientAge: any,
  tdVaccines: any[] = [],
) => {
  // --- Prescriptions (Supplements + Medicines combined) ---

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

  const administeredVaccineIds = getAdministeredVaccineIds(patientVaccinesInfo);

  const immunisationDoses = buildImmunisationDoses(
    formValues,
    administeredVaccineIds,
    tdVaccines,
  );

  const shouldIncludeImmunisation = immunisationDoses.length > 0;

  // Family Planning prescriptions
  // Short-term FP
  const fpPrescriptionsShortTerm = mapFpPrescriptions(
    formValues?.family_planning_prescriptions_short_term,
    shortTermContraceptiveOptions,
    (item) => item.selected_family_planning_method_short_term,
    (item) => item.quantity_short_term
  );

  // LARC FP
  const fpPrescriptionsLarc = mapFpPrescriptions(
    formValues?.family_planning_prescriptions_larc,
    larcContraceptiveOptions,
    (item) => item.selected_family_planning_method_larc,
    (item) => item.quantity_larc
  );

  // Final merged list
  const fpPrescriptions = [...fpPrescriptionsShortTerm, ...fpPrescriptionsLarc];

  // Updated immunisation structure to match new API format

  return {
    patient_id: patientId,
    appointment_id: appointmentId,
    visitDate: new Date().toISOString().split("T")[0],

    // ----------------- VITALS -----------------
    pncVitalAssessment: {
      weight: Number(formValues.weight),
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      systolic_bp: formValues.systolic_bp,
      diastolic_bp: formValues.diastolic_bp,
      temperature: Number(formValues.temperature),
      pulse: Number(formValues.pulse),
      spo2: Number(formValues.spo2),
      blood_group: formValues.blood_group || null,
    },

    // ----------------- SCREENING -----------------
    screening: {
      haemoglobin: Number(formValues.haemoglobin),
      blood_sugar_random: Number(formValues.blood_sugar_random),
      muac: Number(formValues.muac),
      warning_signs: formValues.warning_signs || [],
      otherWarningSign: formValues.other_warning_signs || null,
    },

    // ---------------- NUTRITION ------------------
    nutrition: {
      counselledOnNutrition: formValues.nutrition_counseling || false,
    },

    // ---------------- IMMUNISATION ----------------
    ...(shouldIncludeImmunisation && {
      immunisation: {
        appointmentId,
        doses: immunisationDoses,
      },
    }),

    // ---------------- SUPPLEMENTS ----------------
    supplementPrescribed: prescriptions.length > 0 ? true : false,
    prescriptions,
    otherPrescriptions,

    // ---------------- FAMILY PLANNING ------------

    familyPlanning: {
      counseledOnFamilyPlanning: formValues.family_planning_counseling || false,
      dispenserFpMethods: formValues.dispensed_family_method || false,
      prescriptions: fpPrescriptions,
    },

    // ---------------- BREASTFEEDING ---------------
    breastfeeding: {
      early_breastfeeding: formValues.early_breastfeeding || false,
      exclusive_breastfeeding: formValues.exclusive_breastfeeding || false,
      reported_issue_with_breastfeeding:
        formValues.breastfeeding_issue || false,
      breastfeeding_issues: formValues.breastfeeding_issue_type || [],
    },
  };
};

export const transformUpdateFormDataToPncApi = (
  formValues: any,
  patientId: any,
  appointmentId: any,
  patientAge: any
) => {
  // --- Prescriptions (Supplements + Medicines combined) ---

  // const immunisation = {
  //   patient_id: patientId,
  //   doses: [
  //     { tt_vaccine_no: "TT1", dateAdministered: formValues?.dateAdministered1 },
  //     { tt_vaccine_no: "TT2", dateAdministered: formValues?.dateAdministered2 },
  //     { tt_vaccine_no: "TT3", dateAdministered: formValues?.dateAdministered3 },
  //     { tt_vaccine_no: "TT4", dateAdministered: formValues?.dateAdministered4 },
  //     { tt_vaccine_no: "TT5", dateAdministered: formValues?.dateAdministered5 },
  //   ].filter((dose) => dose.dateAdministered), // remove entries with no value
  // };

  // // Optionally, if there are **no doses at all**, you can remove the key entirely:
  // if (immunisation.doses.length === 0) {
  //   delete immunisation.doses;
  // }

  return {
    patient_id: patientId,
    appointment_id: appointmentId,
    visitDate: new Date().toISOString().split("T")[0],

    // ----------------- VITALS -----------------
    pncVitalAssessment: {
      weight: Number(formValues.weight),
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      systolic_bp: formValues.systolic_bp,
      diastolic_bp: formValues.diastolic_bp,
      temperature: Number(formValues.temperature),
      pulse: Number(formValues.pulse),
      spo2: Number(formValues.spo2),
      blood_group: formValues.blood_group || null,
    },

    // ----------------- SCREENING -----------------
    screening: {
      haemoglobin: Number(formValues.haemoglobin),
      blood_sugar_random: Number(formValues.blood_sugar_random),
      muac: Number(formValues.muac),
      warning_signs: formValues.warning_signs || [],
      otherWarningSign: formValues.other_warning_signs || null,
    },

    // ---------------- NUTRITION ------------------
    nutrition: {
      counselledOnNutrition: formValues.nutrition_counseling || false,
    },

    // ---------------- IMMUNISATION ----------------
    // immunisation: immunisation,

    // ---------------- SUPPLEMENTS ----------------

    // ---------------- FAMILY PLANNING ------------

    familyPlanning: {
      counseledOnFamilyPlanning: formValues.family_planning_counseling || false,
    },

    // ---------------- BREASTFEEDING ---------------
    breastfeeding: {
      early_breastfeeding: formValues.early_breastfeeding || false,
      exclusive_breastfeeding: formValues.exclusive_breastfeeding || false,
      reported_issue_with_breastfeeding:
        formValues.breastfeeding_issue || false,
      breastfeeding_issues: formValues.breastfeeding_issue_type || [],
    },
  };
};

export const transformPncApiToFormData = (apiData: PncVisitResponseDto | null | undefined) => {
  if (!apiData) return;

  // ---------------- PRESCRIPTIONS ----------------
  const mappedSupplements: any[] = [];

  var supplementsInstruction =
    apiData?.prescriptions && apiData?.prescriptions?.length > 0
      ? apiData?.prescriptions?.[0].medicineInstruction
      : null;

  (apiData.prescriptions || []).forEach((p: any) => {
    const variant = p.medicineVariant;
    const isSupplement = variant?.medicine.category === "Supplement";
    if (isSupplement) {
      mappedSupplements.push({
        supplementName: variant?.medicine?.name,
        supplementDosage: p.medicineDosage,
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

  const prescriptions = apiData?.prescriptions || [];

  // ---- Short term prescriptions (category based) ----
  const shortTermPrescriptions = prescriptions
    .filter(
      (item: any) => item?.medicineVariant?.medicine?.category === "Short term"
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

  // const lmp = apiData?.patient?.immunisations?.[0]?.lmp;

  return {
    // ---------------- VITALS ----------------
    weight: apiData.pncVitalAssessment?.weight != null ? Number(apiData.pncVitalAssessment.weight) : null,
    height: InchesToFeetInches(apiData.pncVitalAssessment?.height ?? 0),
    height_cm: InchesToCm(apiData.pncVitalAssessment?.height),
    systolic_bp: apiData.pncVitalAssessment?.systolic_bp ?? null,
    diastolic_bp: apiData.pncVitalAssessment?.diastolic_bp ?? null,
    temperature: apiData.pncVitalAssessment?.temperature != null ? Number(apiData.pncVitalAssessment.temperature) : null,
    pulse: apiData.pncVitalAssessment?.pulse ?? null,
    spo2: apiData.pncVitalAssessment?.spo2 ?? null,
    blood_group: apiData.pncVitalAssessment?.blood_group || null,
    haemoglobin: apiData.pncVitalAssessment?.haemoglobin ?? null,
    blood_sugar_random: apiData.pncVitalAssessment?.blood_sugar_random ?? null,
    muac: apiData.pncVitalAssessment?.muac ?? null,
    warning_signs: apiData.pncVitalAssessment?.warning_signs || [],
    other_warning_signs: apiData?.pncVitalAssessment?.otherWarningSign || null,

    // ---------------- NUTRITION ----------------
    nutrition_counseling: apiData.pncNutrition?.counselledOnNutrition || false,

    // ---------------- BREASTFEEDING ----------------
    early_breastfeeding: apiData.pncBreastfeeding?.early_breastfeeding || false,
    exclusive_breastfeeding:
      apiData.pncBreastfeeding?.exclusive_breastfeeding || false,
    breastfeeding_issue:
      Number(apiData.pncBreastfeeding?.breastfeeding_issues?.length ?? 0) > 0,
    breastfeeding_issue_type:
      apiData.pncBreastfeeding?.breastfeeding_issues || [],

    // ---------------- FAMILY PLANNING ----------------
    family_planning_counseling:
      apiData.pncFamilyPlanning?.counseledOnFamilyPlanning || false,
    dispensed_family_method:
      apiData.pncFamilyPlanning?.dispenserFpMethods || false,
    // lmp: lmp || null,

    family_planning_prescriptions_short_term: shortTermPrescriptions,
    family_planning_prescriptions_larc: larcPrescriptions,

    // ---------------- SUPPLEMENTS & MEDICINES ----------------
    supplementsInstruction: supplementsInstruction,
    type_of_contraception: type_of_contraception,
    supplements: finalSupplementsMapped,
    supplements_prescribed: finalSupplementsMapped?.length > 0 ? true : false,
  };
};

// Updated helper function to work with vaccine_id instead of tt_vaccine_no

// Legacy helper function (keeping for backward compatibility if needed)
// const getDoseDate = (vaccineNo: string, doses: any[] = []) => {
//   const normalized = vaccineNo.toUpperCase().trim();

//   return (
//     doses.find(
//       (d: any) => String(d?.tt_vaccine_no).toUpperCase().trim() === normalized
//     )?.dateAdministered || ""
//   );
// };

const mapFpPrescriptions = (
  list: any[],
  optionList: any[],
  getMethodKey: (item: any) => any,
  getQuantityKey: (item: any) => any
) => {
  if (!Array.isArray(list)) return [];

  return list
    .filter((item) => item && getMethodKey(item))
    .map((item) => ({
      medicine_variant_id: getOtherCategoryMedicineVariantIds(
        getMethodKey(item),
        optionList
      ),
      quantity: getQuantityKey(item),
    }));
};
