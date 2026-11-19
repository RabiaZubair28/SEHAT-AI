import {
  CmToInches,
  FeetToInches,
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
import {
  getOtherCategoryMedicineVariantIds,
  mergeOtherPrescriptions,
  getAdministeredVaccineIds,
  buildImmunisationDoses,
} from "../data/moduleHelpers";
import type { AncVisitResponseDto } from "../anc/types";

export const transformFormDataToAncApi = (
  formValues: any,
  patientId: any,
  appointmentId: any,
  _medicineOptions: any[],
  supplementOptions: any[],
  patientVaccinesInfo: any[],
  patientAge: any,
  tdVaccines: any[] = [],
) => {
  // MAP SUPPLEMENTS
  // Helper to find variant_id

  // MAP SUPPLEMENTS
  const supplementsMapped = Array.isArray(formValues.supplements)
    ? formValues.supplements
        .filter(
          (item: any) => item && (item.supplementName || item.other_supplement),
        )
        .map((item: any) => ({
          medicines: item.supplementName,
          medicineDosage: item.supplementDosage || null,
          medicineDuration: null,
          medicineInstruction: formValues?.supplementInstruction || null,
          otherName: item?.other_supplement || null,
          variant_id: getOtherCategoryMedicineVariantIds(
            item.supplementName,
            supplementOptions,
          ),
          __source: "supplement",
        }))
    : [];

  // MAP MEDICINES
  const medicineMapped = Array.isArray(formValues.medicine)
    ? formValues.medicine
        .filter(
          (item: any) => item && (item.medicineName || item.other_medicine),
        )
        .map((item: any) => ({
          medicines: item.medicineName,
          medicineDosage: item.medicineDosage || null,
          otherName: item?.other_medicine || null,
          medicineDuration: item.medicineDuration || null,
          medicineStrength: item?.strength || null,
          formOfmedicine: item?.formOfMedicine || null,
          medicineInstruction: formValues?.medicineInstruction || null,
          variant_id: item?.variant_id,
          __source: "medicine",
        }))
    : [];

  // SPLIT prescriptions + otherPrescriptions WITH CATEGORY
  const prescriptions: any[] = [];
  const otherPrescriptions: any[] = [];

  [...medicineMapped, ...supplementsMapped].forEach((item) => {
    if (item.medicines === "Other") {
      otherPrescriptions.push({
        name: item?.otherName,
        medicineDosage: item.medicineDosage,
        medicineDuration: item.medicineDuration,
        medicineInstruction: item.medicineInstruction,
        category: item.__source === "supplement" ? "Supplement" : "Medicine",
      });
    } else {
      prescriptions.push({
        medicine_variant_id: item.variant_id,
        medicineDosage: item.medicineDosage,
        medicineDuration: item.medicineDuration,
        medicineInstruction: item.medicineInstruction,
      });
    }
  });

  // MAP LAB TESTS
  const labTestMapped = Array.isArray(formValues.prescribed_lab_tests)
    ? formValues.prescribed_lab_tests
        .filter(
          (item: any) => item && item.lab_test_name && item.lab_test_urgency,
        )
        .map((item: any) => ({
          name: item.lab_test_name,
          urgency: item.lab_test_urgency,
        }))
    : [];

  const administeredVaccineIds = getAdministeredVaccineIds(patientVaccinesInfo);

  const immunisationDoses = buildImmunisationDoses(
    formValues,
    administeredVaccineIds,
    tdVaccines,
  );

  const shouldIncludeImmunisation = immunisationDoses.length > 0;

  return {
    patient_id: patientId,
    appointment_id: appointmentId,
    visitDate: new Date().toISOString().split("T")[0],
    prescriptions,
    otherPrescriptions,
    diagnosis: {
      screenedRubella: formValues.screenedRubella,
      rubellaPositive: formValues.rubellaPositive,
      screenedHepB: formValues.screenedHepB,
      hepBPositive: formValues.hepBPositive,
      screenedThalassemia: formValues.screenedThalassemia,
      thalassemiaPositive: formValues.thalassemiaPositive,
      screenedHiv: formValues?.screenedHiv,
      hivPositive: formValues?.hivPositive,
      screenedHepC: formValues?.screenedHepC,
      hepCPositive: formValues?.hepCPositive,
      prescribedLabTest: formValues.prescribedLabTest,
      labTests: labTestMapped,
    },
    medicines_prescribed: formValues?.medicines_prescribed,
    supplements_prescribed: formValues?.supplements_prescribed,
    pregnancyInfo: {
      gravidity: formValues.gravidity,
      parity: formValues.parity,
      lmp: formValues.lmp,
      abortion: formValues.abortion,
      gestational_age: formValues.gestational_age,
      reason_for_edit: formValues.reason_for_edit,
      expected_date_of_delivery: formValues.edd,
      trimester: formValues.trimester,
      previous_pregnancy: formValues.previousPregnancies,
    },
    medicalSurgicalHistory: {
      previousIllness: formValues.previousIllness || [],
      past_obstetric_complication: formValues.past_obstetric_complication || [],
      previous_surgery: formValues.previous_surgery,
      previous_surgery_details: formValues.previous_surgery_details,
      known_allergies: formValues.known_allergies,
      allergy_details: formValues.allergy_details || [],
      previous_medication: formValues.previous_medication,
      previous_medication_details: formValues.previous_medication_details,
      used_family_planning: formValues.used_family_planning,
      family_planning_methods: formValues.family_planning_methods || [],
      prior_blood_transfusion: formValues.prior_blood_transfusion,
    },
    ultrasound: {
      requiresUltrasound: formValues.ultrasound_require,
      ultrasoundMachineAvailable: formValues.ultrasoundMachineAvailable,
      typeOfPregnancy: formValues.typeOfPregnancy,
      fetalMovement: formValues.fetalMovement || null,
      fetalPresentation: formValues.fetalPresentation || null,
      attitude: formValues.attitude || null,
      placenta: formValues.placentaPosition || null,
      amnioticFluidIndex: formValues.amnioticFluidIndex || null,
      fetalHeartRate: formValues.fetalHeartRate || null,
      fundalHeight: formValues.fundalHeightUltrasound || null,
      ultrasoundReporting: formValues.ultrasoundReporting || [],
      otherUltrasoundReporting: formValues?.other_ultrasound_reporting,
      ultrasoundObservations: formValues.ultrasoundObservations || null,
    },
    ctg: {
      requiresCtg: formValues.requiresCtg || false,
      ctgMachineAvailable: formValues.ctgMachineAvailable || false,
      ctgObservations: formValues?.ctgObservations || null,
      ctgReporting: formValues?.ctgReactivity,
    },
    ...(shouldIncludeImmunisation && {
      immunisation: {
        appointmentId,
        doses: immunisationDoses,
      },
    }),

    ancVitalAssessment: {
      weight: Number(formValues.weight),
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      temperature: Number(formValues.temperature),
      pulse: formValues.pulse,
      body_mass_index: Number(formValues.body_mass_index),
      change_in_weight: Number(formValues.change_in_weight),
      systolic_bp: formValues.systolic_bp,
      diastolic_bp: formValues.diastolic_bp,
      respiratory_rate: formValues.respiratory_rate,
      blood_group: formValues.blood_group || null,
      spo2: Number(formValues.spo2),
    },
    screening: {
      haemoglobin: Number(formValues.haemoglobin),
      fundal_height: formValues.fundal_height || null,
      blood_sugar_random: Number(formValues.blood_sugar_random) || null,
      albumin_urine_dipstick: formValues.albumin_urine_dipstick || null,
      muac: Number(formValues.muac),
      warning_signs: formValues.warning_signs || [],
      otherWarningSign: formValues.other_warning_signs || null,
    },
  };
};

/**
 * ES-781
 *
 * Update payload = create payload minus five keys:
 *   prescriptions, otherPrescriptions, medicines_prescribed,
 *   supplements_prescribed, immunisation
 *
 * These are omitted deliberately, not by oversight. Creating them fired an
 * irreversible downstream side effect: prescriptions were dispensed against
 * facility stock, vaccine doses were recorded as administered history.
 *
 * Note the values are still present in `form.getFieldsValue(true)` — antd `disabled`
 * does not strip them, so this omission is the only thing keeping them out.
 *
 */
export const transformFormUpdateDataToAncApi = (
  formValues: any,
  patientId: any,
  appointmentId: any,
  patientAge: any,
) => {
  // Transform previous pregnancies

  const labTestMapped = Array.isArray(formValues.prescribed_lab_tests)
    ? formValues.prescribed_lab_tests
        .filter(
          (item: any) => item && item.lab_test_name && item.lab_test_urgency,
        )
        .map((item: any) => ({
          name: item.lab_test_name,
          urgency: item.lab_test_urgency,
        }))
    : [];

  return {
    patient_id: patientId,
    appointment_id: appointmentId,
    visitDate: new Date().toISOString().split("T")[0],

    diagnosis: {
      screenedRubella: formValues.screenedRubella,
      rubellaPositive: formValues.rubellaPositive,
      screenedHepB: formValues.screenedHepB,
      hepBPositive: formValues.hepBPositive,
      screenedThalassemia: formValues.screenedThalassemia,
      thalassemiaPositive: formValues.thalassemiaPositive,
      screenedHiv: formValues?.screenedHiv,
      hivPositive: formValues?.hivPositive,
      screenedHepC: formValues?.screenedHepC,
      hepCPositive: formValues?.hepCPositive,
      prescribedLabTest: formValues.prescribedLabTest,
      labTests: labTestMapped,
    },

    pregnancyInfo: {
      gravidity: formValues.gravidity,
      parity: formValues.parity,
      lmp: formValues.lmp,
      abortion: formValues.abortion,
      gestational_age: formValues.gestational_age,
      reason_for_edit: formValues.reason_for_edit,
      expected_date_of_delivery: formValues.edd,
      trimester: formValues.trimester,
      previous_pregnancy: formValues?.previousPregnancies,
    },
    medicalSurgicalHistory: {
      previousIllness: formValues.previousIllness || [],
      past_obstetric_complication: formValues.past_obstetric_complication || [],
      previous_surgery: formValues.previous_surgery,
      previous_surgery_details: formValues.previous_surgery_details,
      known_allergies: formValues.known_allergies,
      allergy_details: formValues.allergy_details || [],
      previous_medication: formValues.previous_medication,
      previous_medication_details: formValues.previous_medication_details,
      used_family_planning: formValues.used_family_planning,
      family_planning_methods: formValues.family_planning_methods || [],
      prior_blood_transfusion: formValues.prior_blood_transfusion,
    },
    ultrasound: {
      requiresUltrasound: formValues.ultrasound_require,
      ultrasoundMachineAvailable: formValues.ultrasoundMachineAvailable,
      typeOfPregnancy: formValues.typeOfPregnancy,
      fetalMovement: formValues.fetalMovement || null,
      fetalPresentation: formValues.fetalPresentation || null,
      attitude: formValues.attitude || null,
      placenta: formValues.placentaPosition || null,
      amnioticFluidIndex: formValues.amnioticFluidIndex || null,
      fetalHeartRate: formValues.fetalHeartRate || null,
      fundalHeight: formValues.fundalHeightUltrasound || null,
      ultrasoundReporting: formValues.ultrasoundReporting || [],
      otherUltrasoundReporting: formValues?.other_ultrasound_reporting,
      ultrasoundObservations: formValues.ultrasoundObservations || null,
    },
    ctg: {
      requiresCtg: formValues.requiresCtg || false,
      ctgMachineAvailable: formValues.ctgMachineAvailable || false,
      ctgObservations: formValues?.ctgObservations,
      ctgReporting: formValues?.ctgReactivity || null,
    },

    ancVitalAssessment: {
      weight: Number(formValues.weight),
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      temperature: Number(formValues.temperature),
      pulse: formValues.pulse,
      body_mass_index: Number(formValues.body_mass_index),
      change_in_weight: Number(formValues.change_in_weight),
      systolic_bp: formValues.systolic_bp,
      diastolic_bp: formValues.diastolic_bp,
      respiratory_rate: formValues.respiratory_rate,
      blood_group: formValues.blood_group || null,
      spo2: Number(formValues.spo2),
    },
    screening: {
      haemoglobin: Number(formValues.haemoglobin),
      fundal_height: formValues.fundal_height || null,
      blood_sugar_random: Number(formValues.blood_sugar_random) || null,
      albumin_urine_dipstick: formValues.albumin_urine_dipstick || null,
      muac: Number(formValues.muac),

      warning_signs: formValues.warning_signs || [],
      otherWarningSign: formValues.other_warning_signs || null,
    },
  };
};

export const transformAncApiToFormData = (
  apiData: AncVisitResponseDto | null | undefined,
) => {
  if (!apiData) return;

  const mappedSupplement: any[] = [];
  const mappedMedicine: any[] = [];

  let supplementInstruction = null;
  let medicineInstruction = null;

  // -----------------------------
  // PRESCRIPTION MAPPING (MED + SUPPS)
  // -----------------------------
  (apiData.prescriptions || []).forEach((p: any) => {
    const variant = p.medicineVariant;
    const isSupplement = variant?.medicine.category === "Supplement";

    if (isSupplement) {
      supplementInstruction = p.medicineInstruction;
      mappedSupplement.push({
        supplementName: variant?.medicine?.name,
        supplementDosage: p.medicineDosage,
        supplementDuration: p.medicineDuration,
        supplementInstruction: p.medicineInstruction,
      });
    } else {
      medicineInstruction = p.medicineInstruction;
      mappedMedicine.push({
        medicineName: variant?.medicine?.name,
        strength: variant.strength,
        unit: variant.unit,
        medicineDosage: p.medicineDosage,
        medicineDuration: p.medicineDuration,
        formOfMedicine: variant.unit,
        medicineInstruction: p.medicineInstruction,
      });
    }
  });

  const mappedOtherPrescriptions =
    apiData?.otherPrescriptions?.map((o: any) => ({
      name: o.name,
      medicineDosage: o.medicineDosage,
      medicineDuration: o.medicineDuration,
      medicineInstruction: o.medicineInstruction,
      category: o.category, // "Medicine" OR "Supplement"
    })) || [];

  const { finalMappedSupplements, finalMappedMedicine } =
    mergeOtherPrescriptions(
      mappedSupplement,
      mappedMedicine,
      mappedOtherPrescriptions,
    );

  // In transformAncApiToFormData
  const previousPregnancies = (
    apiData?.pregnancyInfo?.previous_pregnancies || []
  ).map((pregnancy: any) => {
    // ✅ Destructure only the fields we want, ignoring 'id'
    const {
      place_of_delivery = "",
      outcome = "",
      mode_of_delivery = "",
      complication = [],
      otherComplication = null,
    } = pregnancy;

    return {
      place_of_delivery,
      outcome,
      mode_of_delivery,
      complication,
      otherComplication,
    };
  });

  return {
    // Pregnancy Info
    lmp: apiData.pregnancyInfo?.lmp?.split("T")[0] || "",
    gestational_age: apiData.pregnancyInfo?.gestational_age ?? 0,
    gravidity: apiData.pregnancyInfo?.gravidity ?? 0,
    parity: apiData.pregnancyInfo?.parity ?? 0,
    abortion: apiData.pregnancyInfo?.abortion ?? 0,
    reason_for_edit: apiData.pregnancyInfo?.reason_for_edit,
    edd: apiData.pregnancyInfo?.expected_date_of_delivery?.split("T")[0] || "",
    trimester: apiData.pregnancyInfo?.trimester || 0,

    // Medical & Surgical History  ❗ FIXED
    previousIllness: apiData.ancMedicalSurgicalHistory?.previousIllness || [],
    past_obstetric_complication:
      apiData.ancMedicalSurgicalHistory?.past_obstetric_complication || [],
    previous_surgery:
      apiData.ancMedicalSurgicalHistory?.previous_surgery || false,
    previous_surgery_details:
      apiData.ancMedicalSurgicalHistory?.previous_surgery_details || "",
    known_allergies:
      apiData.ancMedicalSurgicalHistory?.known_allergies || false,
    allergy_details: apiData.ancMedicalSurgicalHistory?.allergy_details || [],
    previous_medication:
      apiData.ancMedicalSurgicalHistory?.previous_medication || false,
    previous_medication_details:
      apiData.ancMedicalSurgicalHistory?.previous_medication_details || "",
    used_family_planning:
      apiData.ancMedicalSurgicalHistory?.used_family_planning || false,
    family_planning_methods:
      apiData.ancMedicalSurgicalHistory?.family_planning_methods || [],
    prior_blood_transfusion:
      apiData.ancMedicalSurgicalHistory?.prior_blood_transfusion || false,

    // Vitals (ANC)  ❗ FIXED
    weight: apiData.ancVitalAssessment?.weight != null ? Number(apiData.ancVitalAssessment.weight) : null,
    height: InchesToFeetInches(apiData?.ancVitalAssessment?.height ?? 0),
    height_cm: InchesToCm(apiData?.ancVitalAssessment?.height ?? 0),
    body_mass_index: apiData.ancVitalAssessment?.body_mass_index != null ? Number(apiData.ancVitalAssessment.body_mass_index) : 0,
    change_in_weight: apiData.ancVitalAssessment?.change_in_weight ?? null,
    systolic_bp: apiData.ancVitalAssessment?.systolic_bp ?? null,
    diastolic_bp: apiData.ancVitalAssessment?.diastolic_bp ?? null,
    temperature: apiData.ancVitalAssessment?.temperature != null ? Number(apiData.ancVitalAssessment.temperature) : null,
    blood_group: apiData.ancVitalAssessment?.blood_group || "",
    haemoglobin: apiData.ancVitalAssessment?.haemoglobin ?? null,
    blood_sugar_random: apiData.ancVitalAssessment?.blood_sugar_random ?? null,
    albumin_urine_dipstick:
      apiData.ancVitalAssessment?.albumin_urine_dipstick || null,
    muac: apiData.ancVitalAssessment?.muac ?? null,
    spo2: apiData.ancVitalAssessment?.spo2 ?? null,
    pulse: apiData.ancVitalAssessment?.pulse ?? null,
    warning_signs: apiData.ancVitalAssessment?.warning_signs || [],
    other_warning_signs: apiData.ancVitalAssessment?.otherWarningSign || null,
    fundal_height: apiData.ancVitalAssessment?.fundal_height,
    respiratory_rate: apiData?.ancVitalAssessment?.respiratory_rate,

    // Diagnosis  ❗ FIXED
    screenedRubella: apiData.diagnosis?.screenedRubella || false,
    rubellaPositive: apiData.diagnosis?.rubellaPositive || false,
    screenedHiv: apiData.diagnosis?.screenedHiv || false,
    hivPositive: apiData.diagnosis?.hivPositive || false,
    screenedHepC: apiData.diagnosis?.screenedHepC || false,
    hepCPositive: apiData.diagnosis?.hepCPositive || false,
    screenedHepB: apiData.diagnosis?.screenedHepB || false,
    hepBPositive: apiData.diagnosis?.hepBPositive || false,
    screenedThalassemia: apiData.diagnosis?.screenedThalassemia || false,
    thalassemiaPositive: apiData.diagnosis?.thalassemiaPositive || false,
    prescribedLabTest: apiData.diagnosis?.prescribedLabTest || false,
    prescribed_lab_tests:
      apiData.diagnosis?.labTestsPrescribed?.map((t: any) => ({
        lab_test_name: t?.name,
        lab_test_urgency: t?.urgency,
      })) || [],

    // Prescriptions  ❗ API returns array of objects with nested medicines
    medicines_prescribed: finalMappedMedicine?.length > 0 ? true : false,
    supplements_prescribed: finalMappedSupplements?.length > 0 ? true : false,
    supplements: finalMappedSupplements,
    medicine: finalMappedMedicine,
    // Ultrasound  ❗ FIXED
    ultrasound_require: apiData.ultrasound?.requiresUltrasound || false,
    ultrasoundMachineAvailable:
      apiData.ultrasound?.ultrasoundMachineAvailable || false,
    typeOfPregnancy: apiData.ultrasound?.typeOfPregnancy || "",
    fetalMovement: apiData.ultrasound?.fetalMovement || null,
    fetalPresentation: apiData.ultrasound?.fetalPresentation || "",
    attitude: apiData.ultrasound?.attitude || "",
    placentaPosition: apiData.ultrasound?.placenta || "",
    amnioticFluidIndex: apiData.ultrasound?.amnioticFluidIndex || null,
    fetalHeartRate: apiData.ultrasound?.fetalHeartRate || null,
    fundalHeightUltrasound: apiData.ultrasound?.fundalHeight || null,
    ultrasoundReporting: apiData.ultrasound?.ultrasoundReporting || [],
    other_ultrasound_reporting: apiData.ultrasound?.otherUltrasoundReporting,
    ultrasoundObservations: apiData.ultrasound?.ultrasoundObservations || "",
    supplementInstruction: supplementInstruction,
    medicineInstruction: medicineInstruction,
    previousPregnancies: previousPregnancies,

    // CTG  ❗ FIXED
    requiresCtg: apiData.ctg?.requiresCtg || false,
    ctgMachineAvailable: apiData.ctg?.ctgMachineAvailable || false,
    ctgReactivity: apiData.ctg?.ctgReporting || "",
    ctgObservations: apiData.ctg?.ctgObservations || "",
    ctgRemarks: apiData.ctg?.ctgRemarks || "",
  };
};
