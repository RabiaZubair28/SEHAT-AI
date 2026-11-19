import {
  CmToInches,
  FeetToInches,
  InchesToCm,
  InchesToFeetInches,
} from "@/utils/helpers/formHelperMethods";
export const transformFormDataToOpdApi = (
  formValues: any,
  appointmentId: number,
  patientAge: any
) => {
  // Map medicines

  const medicineMapped = Array.isArray(formValues?.medicine)
    ? formValues.medicine
        .filter(
          (item: any) => item && (item.medicineName || item.other_medicine)
        )
        .map((item: any) => ({
          medicines: item.medicineName || null,
          medicineDosage: item.medicineDosage || null,
          medicineDuration: item.medicineDuration || null,
          medicineInstruction: formValues?.special_instructions || null,
          medicineDispensed: false,
          otherName: item?.other_medicine || null,
          medicineStrength: item?.strength || null,
          formOfmedicine: item?.formOfMedicine || null,
          variant_id: item?.variant_id,
        }))
    : [];

  // SPLIT prescriptions + otherPrescriptions WITH CATEGORY
  const prescriptions: any[] = [];
  const otherPrescriptions: any[] = [];

  [...medicineMapped].forEach((item) => {
    if (item.medicines === "Other") {
      otherPrescriptions.push({
        name: item?.otherName,
        medicineDosage: item.medicineDosage,
        medicineDuration: item.medicineDuration,
        medicineInstruction: item.medicineInstruction,
        category: "Medicine",
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
  // Map lab tests
  const labTestMapped = Array.isArray(formValues?.prescribed_lab_tests)
    ? formValues.prescribed_lab_tests
        .filter(
          (item: any) => item && item.lab_test_name && item.lab_test_urgency
        )
        .map((item: any) => ({
          name: item.lab_test_name,
          urgency: item.lab_test_urgency,
        }))
    : [];

  return {
    appointment_id: appointmentId,

    medicalHistory: {
      presentingComplaints: formValues.presenting_complaints || [],
      presentingComplaintsOther: formValues.presenting_complaint_other || null,

      previousIllness: formValues.previous_illness || [],
      otherPreviousIllness: formValues.previous_illness_other || null,

      associatedConditions: formValues.associated_conditions || [],
      otherAssociatedConditions: formValues.other_associated_conditions || null,

      known_allergies: formValues.has_allergies || false,
      allergy: formValues.allergy_details || null,

      previous_medication: formValues.previous_medication || false,
      previous_medication_details:
        formValues.previous_medication_details || null,

      obstetricComplication: formValues.has_obstetric_complication || false,
      obstetricComplicationDetails:
        formValues.past_obstetric_complication || [],

      otherObstetricComplicationDetails:
        formValues.other_past_obstetric_complication || null,

      previousSurgery: formValues.has_previous_surgery || false,
      previousSurgeryDetails: formValues.surgical_history_details || null,
    },

    prescriptions,
    otherPrescriptions,

    // prescribedLabTest: formValues.prescribing_lab_test || false,
    // labTests: labTestMapped,

    vitals: {
      weight: Number(formValues.weight) || null,
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      body_mass_index: Number(formValues.body_mass_index) || null,
      change_in_weight: Number(formValues.change_in_weight),
      pulse: Number(formValues.pulse) || null,
      systolic_bp: Number(formValues.systolic_bp) || null,
      diastolic_bp: Number(formValues.diastolic_bp) || null,
      temperature: Number(formValues.temperature) || null,
      respiratory_rate: Number(formValues.respiratory_rate) || null,
      blood_group: formValues.blood_group || null,
    },

    diagnosis: {
      patientFinalDiagnosis: formValues.patient_diagnosis_status,
      finalDiagnosis:
        formValues?.final_diagnosis?.length > 0
          ? formValues?.final_diagnosis
          : null,
      otherFinalDiagnosis: formValues.other_final_diagnosis || null,
    },

    generalDiagnosis: {
      patientHasLabtests: formValues.patient_lab_results || false,
      resultValue: formValues.result_value || null,
      resultLabDate: formValues.result_lab_date
        ? new Date(formValues.result_lab_date).toISOString().split("T")[0]
        : null,

      prescribedLabTest: formValues.prescribing_lab_test || false,
      labTestsPrescribed: labTestMapped,
    },
  };
};

export const transformUpdateFormDataToOpdApi = (
  formValues: any,
  appointmentId: number,
  patientAge: any
) => {
  // Lab tests now belong to generalDiagnosis

  const labTestsMapped = (formValues?.prescribed_lab_tests || []).map(
    (item: any) => ({
      name: item.lab_test_name,
      urgency: item.lab_test_urgency,
    })
  );

  return {
    appointment_id: appointmentId,

    medicalHistory: {
      presentingComplaints: formValues.presenting_complaints || [],
      presentingComplaintsOther: formValues.presenting_complaint_other || null,

      previousIllness: formValues.previous_illness || [],
      otherPreviousIllness: formValues.previous_illness_other || null,

      associatedConditions: formValues.associated_conditions || [],
      otherAssociatedConditions: formValues.other_associated_conditions || null,

      known_allergies: formValues.has_allergies || false,
      allergy: formValues.allergy_details || null,

      previous_medication: formValues.previous_medication || false,
      previous_medication_details:
        formValues.previous_medication_details || null,

      obstetricComplication: formValues.has_obstetric_complication || false,
      obstetricComplicationDetails:
        formValues.past_obstetric_complication || [],

      otherObstetricComplicationDetails:
        formValues.other_past_obstetric_complication || null,

      previousSurgery: formValues.has_previous_surgery || false,
      previousSurgeryDetails: formValues.surgical_history_details || null,
    },

    vitals: {
      weight: Number(formValues.weight) || null,
      height:
        patientAge >= 14
          ? FeetToInches(formValues?.height)
          : CmToInches(formValues?.height_cm),
      body_mass_index: Number(formValues.body_mass_index) || null,
      change_in_weight: Number(formValues.change_in_weight),
      pulse: Number(formValues.pulse) || null,
      systolic_bp: Number(formValues.systolic_bp) || null,
      diastolic_bp: Number(formValues.diastolic_bp) || null,
      temperature: Number(formValues.temperature) || null,
      respiratory_rate: Number(formValues.respiratory_rate) || null,
      blood_group: formValues.blood_group || null,
    },

    diagnosis: {
      patientFinalDiagnosis: formValues.patient_diagnosis_status,
      finalDiagnosis:
        formValues?.final_diagnosis?.length > 0
          ? formValues?.final_diagnosis
          : null,
      otherFinalDiagnosis: formValues.other_final_diagnosis || null,
    },

    generalDiagnosis: {
      patientHasLabtests: formValues.patient_lab_results || false,
      resultValue: formValues.result_value || null,
      resultLabDate: formValues.result_lab_date
        ? new Date(formValues.result_lab_date).toISOString().split("T")[0]
        : null,

      prescribedLabTest: formValues.prescribing_lab_test || false,
      labTestsPrescribed: labTestsMapped,
    },
  };
};

// Example usage:
// const formValues = transformApiToFormValues(apiResponse);

export const transformOpdApiToFormData = (opdData: any) => {
  if (!opdData) return {};

  // Convert height in inches to feet & inches safely
  const heightObj = InchesToFeetInches(opdData?.opdVitals?.height);

  const mappedMedicine: any[] = [];

  let medicineInstruction = null;
  medicineInstruction =
    opdData?.presciptions && opdData?.presciptions?.length > 0
      ? opdData?.presciptions?.[0]?.medicineInstruction
      : null;

  // -----------------------------
  // PRESCRIPTION MAPPING (MED + SUPPS)
  // -----------------------------
  (opdData.prescriptions || []).forEach((p: any) => {
    const variant = p.medicineVariant;

    medicineInstruction = p.medicineInstruction;
    mappedMedicine.push({
      medicineName: variant?.medicine?.id,
      strength: variant.strength,
      unit: variant.unit,
      medicineDosage: p.medicineDosage,
      medicineDuration: p.medicineDuration,
      formOfMedicine: variant.unit,
      medicineInstruction: p.medicineInstruction,
      variant_id: variant?.id,
    });
  });

  const mappedOtherPrescriptions =
    opdData?.otherPrescriptions?.map((o: any) => ({
      medicineName: "Other",
      other_medicine: o.name,
      medicineDosage: o.medicineDosage,
      medicineDuration: o.medicineDuration,
      medicineInstruction: o.medicineInstruction,
      category: o.category, // "Medicine" OR "Supplement"
    })) || [];

  let finalMappedPrescritpions: any[] = [];

  if (mappedMedicine?.length) {
    finalMappedPrescritpions.push(...mappedMedicine);
  }

  if (mappedOtherPrescriptions?.length) {
    finalMappedPrescritpions.push(...mappedOtherPrescriptions);
  }

  // Map lab tests if available
  const labTestsMapped = (opdData?.diagnosis?.labTestsPrescribed || []).map(
    (item: any) => ({
      lab_test_name: item?.name || "",
      lab_test_urgency: item?.urgency || "",
    })
  );

  return {
    // ---------- Vitals ----------
    weight: opdData?.opdVitals?.weight || null,
    height: heightObj,
    height_cm: InchesToCm(opdData?.opdVitals?.height) || null,
    body_mass_index: opdData?.opdVitals?.body_mass_index || null,
    pulse: opdData?.opdVitals?.pulse || null,
    systolic_bp: opdData?.opdVitals?.systolic_bp || null,
    diastolic_bp: opdData?.opdVitals?.diastolic_bp || null,
    temperature: opdData?.opdVitals?.temperature || null,
    respiratory_rate: opdData?.opdVitals?.respiratory_rate || null,
    blood_group: opdData?.opdVitals?.blood_group || null,
    change_in_weight: opdData?.opdVitals?.change_in_weight || null,

    // ---------- Medical History ----------
    presenting_complaints:
      opdData?.opdMedicalHistory?.presentingComplaints || [],
    presenting_complaint_other:
      opdData?.opdMedicalHistory?.presentingComplaintsOther || null,

    previous_illness: opdData?.opdMedicalHistory?.previousIllness || [],
    previous_illness_other: opdData?.opdMedicalHistory?.otherPreviousIllness, // map if "Other" exists
    has_allergies: opdData?.opdMedicalHistory?.known_allergies || false,
    allergen: opdData?.opdMedicalHistory?.allergy || null,
    previous_medication:
      opdData?.opdMedicalHistory?.previous_medication || false,
    previous_medication_details:
      opdData?.opdMedicalHistory?.previous_medication_details || null,
    has_obstetric_complication:
      opdData?.opdMedicalHistory?.obstetricComplication || false,
    past_obstetric_complication:
      opdData?.opdMedicalHistory?.obstetricComplicationDetails || [],
    other_past_obstetric_complication:
      opdData?.opdMedicalHistory?.otherObstetricComplicationDetails,
    has_previous_surgery: opdData?.opdMedicalHistory?.previousSurgery || false,
    surgical_history_details:
      opdData?.opdMedicalHistory?.previousSurgeryDetails || null,
    associated_conditions:
      opdData?.opdMedicalHistory?.associatedConditions || [],
    other_associated_conditions:
      opdData?.opdMedicalHistory?.otherAssociatedConditions || null, // map if "Other" exists
    allergy_details: opdData?.opdMedicalHistory?.allergy,

    // ---------- Prescriptions ----------
    medicines_prescribed: (opdData?.prescriptions || []).length > 0,
    medicine: finalMappedPrescritpions,
    special_instructions: medicineInstruction,

    // ---------- Diagnosis ----------
    patient_diagnosis_status: opdData?.opdDiagnosis?.patientFinalDiagnosis,
    final_diagnosis: opdData?.opdDiagnosis?.finalDiagnosis || [],
    other_final_diagnosis: opdData?.opdDiagnosis?.otherFinalDiagnosis || null,

    // ---------- Lab Tests ----------
    prescribing_lab_test: labTestsMapped?.length > 0,
    prescribed_lab_tests: labTestsMapped,
    patient_lab_results: opdData?.diagnosis?.patientHasLabtests || false,
    result_value: opdData?.diagnosis?.resultValue || null,
    result_lab_date: opdData?.diagnosis?.resultLabDate || null,
  };
};
