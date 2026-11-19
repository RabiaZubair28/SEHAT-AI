export type DeliveryFormValues = Record<string, any>;

export type DeliveryProgressStatus =
  | "False labor"
  | "Continue"
  | "Refer to CEmONC facility"
  | "LAMA"
  | "Discharged";

export const toPreDeliveryApi = (v: DeliveryFormValues) => ({
  lmp: v.lmp,
  gestational_age: v.gestationalAge,
  trimester: v.trimester,
  blood_group: v.blood_group,
  high_risk_signs: v.signs_of_high_risk_pregnancy,
  other_high_risk_sign: v.other_high_risk_sign,
  temperature: v.temperature,
  pulse: v.pulse,
  systolicBP: v.systolicBP,
  diastolicBP: v.diastolicBP,
  respiratoryRate: v.respiratoryRate,
  spo2: v.spo2,
  fetalMovement: v.fetalMovement,
  fetalHeartRate: v.fetalHeartRate,
  cervicalDilation: v.cervicalDilation,
  membraneRuptured: v.membraneRuptured,
  hoursSinceRupture: v.hoursSinceRupture,
  amnioticFluidColor: v.amnioticFluidColor,
  symptomsAssessment: v.symptomsAssessment,
});

// referral object for API
export const toReferralApi = (
  v: DeliveryFormValues,
  childrenData: any[] = [],
) => {
  const referrals: any[] = [];
  const referralFor = v.referralFor || [];
  const selectedChildren = v.referralForChild || [];

  if (referralFor.includes("Mother") || referralFor.includes("MOTHER")) {
    referrals.push({
      patient_id: Number(v.patient_id),
      whoRequiresReferral: "Mother",
      typeOfReferral: v.referral_type,
      motherComplications: v.motherComplications || [],
      otherComplication: v.otherMotherComplication || null,
      typeOfService: v.typeOfServiceMother,
      district_id: v.referral_type === "external" ? v.district_id : undefined,
      levelOfCare: v.referral_type === "external" ? v.levelOfCare : undefined,
      facility_id:
        v.referral_type === "external" && v.facility_id
          ? Number(v.facility_id)
          : undefined,
    });
  }

  if (referralFor.includes("Child") || referralFor.includes("CHILD")) {
    if (selectedChildren.includes("FIRST_CHILD")) {
      const child1Data = childrenData[0];
      referrals.push({
        patient_id: child1Data?.id || Number(v.patient_id),
        whoRequiresReferral: "Child",
        whichChildRequiredReferral: "FIRST_CHILD",
        typeOfReferral: v.referral_type,
        childComplications: v.childComplications1 || [],
        otherComplication: v.otherChildComplication1 || null,
        typeOfService: v.typeOfServiceChild1,
        district_id: v.referral_type === "external" ? v.district_id : undefined,
        levelOfCare: v.referral_type === "external" ? v.levelOfCare : undefined,
        facility_id:
          v.referral_type === "external" && v.facility_id
            ? Number(v.facility_id)
            : undefined,
      });
    }

    if (selectedChildren.includes("SECOND_CHILD")) {
      const child2Data = childrenData[1];
      referrals.push({
        patient_id: child2Data?.id || Number(v.patient_id),
        whoRequiresReferral: "Child",
        whichChildRequiredReferral: "SECOND_CHILD",
        typeOfReferral: v.referral_type,
        childComplications: v.childComplications2 || [],
        otherComplication: v.otherChildComplication2 || null,
        typeOfService: v.typeOfServiceChild2,
        district_id: v.referral_type === "external" ? v.district_id : undefined,
        levelOfCare: v.referral_type === "external" ? v.levelOfCare : undefined,
        facility_id:
          v.referral_type === "external" && v.facility_id
            ? Number(v.facility_id)
            : undefined,
      });
    }
    if (selectedChildren.includes("THIRD_CHILD")) {
      const child3Data = childrenData[2];
      referrals.push({
        patient_id: child3Data?.id || Number(v.patient_id),
        whoRequiresReferral: "Child",
        whichChildRequiredReferral: "THIRD_CHILD",
        typeOfReferral: v.referral_type,
        childComplications: v.childComplications3 || [],
        otherComplication: v.otherChildComplication3 || null,
        typeOfService: v.typeOfServiceChild3,
        district_id: v.referral_type === "external" ? v.district_id : undefined,
        levelOfCare: v.referral_type === "external" ? v.levelOfCare : undefined,
        facility_id:
          v.referral_type === "external" && v.facility_id
            ? Number(v.facility_id)
            : undefined,
      });
    }
  }
  return referrals;
};

// discharge
export const transformReferralApiToForm = (api: any[]): DeliveryFormValues => {
  if (!Array.isArray(api) || api.length === 0) return {};

  const referralFor: string[] = [];
  const referralForChild: string[] = [];
  let referral_type: string | undefined;
  let levelOfCare: string | undefined;
  let district_id: number | undefined;
  let facility_id: string | undefined;

  // Form field values for each referral type
  let motherComplications: string[] = [];
  let otherMotherComplication: string | undefined;
  let typeOfServiceMother: string | undefined;

  let childComplications1: string[] = [];
  let otherChildComplication1: string | undefined;
  let typeOfServiceChild1: string | undefined;

  let childComplications2: string[] = [];
  let otherChildComplication2: string | undefined;
  let typeOfServiceChild2: string | undefined;

  let childComplications3: string[] = [];
  let otherChildComplication3: string | undefined;
  let typeOfServiceChild3: string | undefined;

  // Process each referral object
  api.forEach((referral) => {
    if (!referral_type) referral_type = referral.typeOfReferral;
    if (!levelOfCare) levelOfCare = referral.levelOfCare;

    if (!district_id && referral.district) {
      district_id = referral.district.id;
    }
    if (!facility_id && referral.facility) {
      facility_id = String(referral.facility.id);
    }

    const requiresReferral = Array.isArray(referral.whoRequiresReferral)
      ? referral.whoRequiresReferral
      : [referral.whoRequiresReferral];

    if (requiresReferral.includes("Mother")) {
      if (!referralFor.includes("Mother")) {
        referralFor.push("Mother");
      }
      motherComplications = referral.motherComplications || [];
      otherMotherComplication = referral.otherComplication;
      typeOfServiceMother = referral.typeOfService;
    }

    if (requiresReferral.includes("Child")) {
      if (!referralFor.includes("Child")) {
        referralFor.push("Child");
      }

      const childIndex = referralForChild.length;

      if (childIndex === 0) {
        referralForChild.push("FIRST_CHILD");
        childComplications1 = referral.childComplications || [];
        otherChildComplication1 = referral.otherComplication;
        typeOfServiceChild1 = referral.typeOfService;
      } else if (childIndex === 1) {
        referralForChild.push("SECOND_CHILD");
        childComplications2 = referral.childComplications || [];
        otherChildComplication2 = referral.otherComplication;
        typeOfServiceChild2 = referral.typeOfService;
      } else if (childIndex === 2) {
        referralForChild.push("THIRD_CHILD");
        childComplications3 = referral.childComplications || [];
        otherChildComplication3 = referral.otherComplication;
        typeOfServiceChild3 = referral.typeOfService;
      }
    }
  });

  return {
    // Who requires referral
    referralFor,
    referralForChild,

    // Referral type and location
    referral_type,
    levelOfCare,
    district_id,
    facility_id,

    // Mother fields
    motherComplications,
    otherMotherComplication,
    typeOfServiceMother,

    // Child 1 fields
    childComplications1,
    otherChildComplication1,
    typeOfServiceChild1,

    // Child 2 fields
    childComplications2,
    otherChildComplication2,
    typeOfServiceChild2,

    // Child 3 fields
    childComplications3,
    otherChildComplication3,
    typeOfServiceChild3,
  };
};

export const toDischargeApi = (v: DeliveryFormValues) => ({
  dischargeChecklist: v.dischargeChecklist || [],
  familyPlanningCommodity: v.familyPlanningCommodity ?? null,
  followUpDate: v.followUpDate ?? null,
});

export const transformDischargeApiToForm = (api: any): DeliveryFormValues => ({
  dischargeChecklist: api?.dischargeChecklist || [],
  familyPlanningCommodity: api?.familyPlanningCommodity ?? undefined,
  followUpDate: api?.followUpDate ?? undefined,
});

export const transformPreDeliveryApiToForm = (
  api: any,
): DeliveryFormValues => ({
  lmp: api?.lmp,
  gestationalAge: api?.gestational_age,
  trimester: api?.trimester,
  blood_group: api?.blood_group,
  signs_of_high_risk_pregnancy: api?.high_risk_signs,
  other_high_risk_sign: api?.other_high_risk_sign,
  temperature: api?.temperature,
  pulse: api?.pulse,
  systolicBP: api?.systolicBP,
  diastolicBP: api?.diastolicBP,
  respiratoryRate: api?.respiratoryRate,
  spo2: api?.spo2,
  fetalMovement: api?.fetalMovement,
  fetalHeartRate: api?.fetalHeartRate,
  cervicalDilation: api?.cervicalDilation,
  membraneRuptured: api?.membraneRuptured,
  hoursSinceRupture: api?.hoursSinceRupture,
  amnioticFluidColor: api?.amnioticFluidColor,
  symptomsAssessment: api?.symptomsAssessment,
});

// -----------------------------
// Post-delivery: form -> API
// -----------------------------

export const toPostDeliveryApi = (
  v: DeliveryFormValues,
) => {
  const medicinesAdministered = (v.medicinesAdministered || [])
    .filter((it: any) => it != null)
    .map((item: any) => {
      if (!item) return null;

      return {
        medicine_variant_id: item?.variant_id ?? null,
        quantity: Number(item.quantity) || null,
      };
    })
    .filter(Boolean);

  return {
    typeOfDelivery: v.typeOfDelivery,
    reasonForCSection: v.reasonForCSection,
    otherReasonForCSection: v.otherReasonForCSection,

    motherCondition: v.motherCondition,

    symptomsAssessment: v.symptomsAssessmentPostDelivery,
    immediateSteps: v.immediateSteps,

    complications: v.complications,
    otherComplication: v.otherComplication,

    temperature: v.temperaturePostDelivery,
    pulse: v.pulsePostDelivery,
    systolicBP: v.systolicBpPostDelivery,
    diastolicBP: v.diastolicBpPostDelivery,
    respiratoryRate: v.respiratoryRatePostDelivery,
    rbs: v.rbsPostDelivery,
    hb: v.hbPostDelivery,
    spo2: v.spo2PostDelivery,

    medicinesAdministered,

    causeOfDeath: v.causeOfDeath,
    otherPostDelivery: v.otherPostDelivery,
  };
};

// -----------------------------
// Post-delivery: API -> form
// -----------------------------

export const transformPostDeliveryApiToForm = (
  api: any,
): DeliveryFormValues => {
  const medicinesAdministered = (api?.medicinesAdministered || [])
    .map((item: any) => {
      if (!item.medicine_variant_id) {
        console.warn("No variant_id found for medicine:", item);
        return null;
      }

      return {
        medicineName: item.medicine_id,
        // used in options function in deliveryConstants for fallback label, when data loaded from api
        medicine_label: item.medicine_name,
        strength: item.variant_strength,
        formOfMedicine: item.variant_unit,
        quantity: item.quantity,
        variant_id: item.medicine_variant_id,
      };
    })
    .filter(Boolean);

  return {
    typeOfDelivery: api?.typeOfDelivery,
    reasonForCSection: api?.reasonForCSection,
    otherReasonForCSection: api?.otherReasonForCSection,

    motherCondition: api?.motherCondition,

    symptomsAssessmentPostDelivery: api?.symptomsAssessment,
    immediateSteps: api?.immediateSteps,

    complications: api?.complications,
    otherComplication: api?.otherComplication,
    temperaturePostDelivery: api?.temperature,
    pulsePostDelivery: api?.pulse,
    systolicBpPostDelivery: api?.systolicBP,
    diastolicBpPostDelivery: api?.diastolicBP,
    respiratoryRatePostDelivery: api?.respiratoryRate,
    spo2PostDelivery: api?.spo2,

    rbsPostDelivery: api?.rbs,
    hbPostDelivery: api?.hb,

    medicinesAdministered,

    causeOfDeath: api?.causeOfDeath,
    otherPostDelivery: api?.otherPostDelivery,
  };
};

export type DeliveryTabKey = "1" | "2" | "3" | "4" | "5";

export const buildDeliveryRequestBody = (
  v: DeliveryFormValues,
  tabKey: DeliveryTabKey,
  isUpdate: boolean = false,
  childrenData: any[] = [],
) => {
  const body: any = {
    appointment_id: v.appointment_id,
  };

  // ---------- include section based on tab ----------
  if (tabKey === "1") {
    body.preDelivery = toPreDeliveryApi(v);
  }

  if (tabKey === "2") {
    body.postDelivery = toPostDeliveryApi(v);
    if (
      body.postDelivery &&
      Array.isArray(body.postDelivery.medicinesAdministered) &&
      body.postDelivery.medicinesAdministered.length === 0
    ) {
      delete body.postDelivery.medicinesAdministered;
    }
    if (
      isUpdate &&
      body.postDelivery &&
      body.postDelivery.medicinesAdministered
    ) {
      delete body.postDelivery.medicinesAdministered;
    }
  }

  if (tabKey === "3") {
    body.newbornAssessments = toNewbornApi(v);

    if (Array.isArray(body.newbornAssessments)) {
      body.newbornAssessments = body.newbornAssessments.slice(0, 3);
    }

    // -------- UPDATE MODE CLEANUP --------
    if (isUpdate && Array.isArray(body.newbornAssessments)) {
      body.newbornAssessments.forEach((newborn: any) => {
        delete newborn.medicinesAdministered;
        delete newborn.vaccinesAdministered;
        delete newborn.medicineProvided;
      });
    }

    // -------- CREATE MODE CLEANUP --------
    if (!isUpdate && Array.isArray(body.newbornAssessments)) {
      body.newbornAssessments.forEach((newborn: any) => {
        if (
          Array.isArray(newborn.medicinesAdministered) &&
          newborn.medicinesAdministered.length === 0
        ) {
          delete newborn.medicinesAdministered;
        }
      });
    }
  }

  if (tabKey === "4") {
    body.dischargeDetails = toDischargeApi(v);
  }

  if (tabKey === "5") {
    body.referralDetails = toReferralApi(v, childrenData);
  }

  return body;
};

// -----------------------------
// Newborn: form -> API
// -----------------------------

export const toNewbornApi = (v: DeliveryFormValues) => {
  const newborns = v.newbornAssessments || [];

  return newborns.map((n: any) => {
    const medicinesAdministered = (n.medicinesAdministeredNewborn || [])
      .filter(Boolean)
      .map((item: any) => ({
        medicine_variant_id: item?.variant_id ?? null,
        quantity: Number(item.quantityNewborn),
      }));

    const immunizationRecords = n.immunization_records;
    const administeredDoses = immunizationRecords
      .filter((rec: any) => rec.immunization_status === true)
      .map((rec: any) => ({
        vaccine_id: rec.vaccineId,
        dateAdministered: rec.dateAdministered,
        status: rec.status || "Administered",
      }));

    const vaccinesAdministered =
      administeredDoses.length > 0
        ? {
            appointmentId: v.appointment_id,
            doses: administeredDoses,
            immunisationCard: {
              immunisationCardProvided: n.cardProvided,
              immunisationNumber: n.immunisationNumber
                ? String(n.immunisationNumber)
                : null,
            },
          }
        : null;

    const newbornData: any = {
      sex: n.sex,
      condition: n.condition,
      weight: Number(n.weightNewborn),
      temperature: Number(n.temperatureNewborn),
      headCircumference: Number(n.headCircumference),
      apgarScore: Number(n.apgarScore),
      symptomsAssessment: n.symptomsAssessmentNewborn,
      otherSymptom: n.otherSymptomNewborn,
      kmcAdministered: n.kmcAdministered,
      breastfeedingInitiated: n.breastfeedingInitiated,
      medicineProvided: n.medicineProvided,
      medicinesAdministered,
      congenitalAnomaly: n.oxygenGiven,
      causeOfDeath: n.causeOfDeathNewborn,
    };

    if (
      n.muacNewborn !== null &&
      n.muacNewborn !== undefined &&
      n.muacNewborn !== ""
    ) {
      newbornData.muac = Number(n.muacNewborn);
    }

    if (vaccinesAdministered) {
      newbornData.vaccinesAdministered = vaccinesAdministered;
    }

    return newbornData;
  });
};

// -----------------------------
// Newborn: API -> form
// -----------------------------

// -----------------------------
// Newborn: API -> form (1 or 2 newborns)
// -----------------------------
export const transformNewbornApiToForm = (
  api: any[],
  childrenData?: any[],
): DeliveryFormValues => {
  if (!Array.isArray(api)) return {};

  const newbornAssessments = api.slice(0, 3).map((n: any, index: number) => {
    const medicinesAdministeredNewborn = (n.medicinesAdministered || [])
      .map((item: any) => {
        if (!item.medicine_variant_id) return null;

        return {
          medicineNameNewborn: item.medicine_id,
          // used in options function in deliveryConstants for fallback label, when data loaded from api
          medicine_label: item.medicine_name,
          strengthNewborn: item.variant_strength,
          formOfMedicineNewborn: item.variant_unit,
          quantityNewborn: item.quantity,
          variant_id: item.medicine_variant_id,
        };
      })
      .filter(Boolean);

    let immunization_records: any[] = [];
    if (childrenData && childrenData[index]?.child?.immunisationsDoses) {
      immunization_records = childrenData[index].child.immunisationsDoses.map(
        (dose: any) => ({
          vaccineId: dose.vaccine?.id || dose.vaccine_id,
          vaccine: dose.vaccine?.display_name || dose.vaccine_name || "",
          dateAdministered: dose.dateAdministered,
          immunization_status: dose.status === "Administered",
          status: dose.status,
        }),
      );
    }

    const immunisationCard =
      childrenData?.[index]?.child?.immunisationCard || {};

    const immunisationNumber =
      childrenData?.[index]?.child?.immunisation_number;

    const newbornFormData: any = {
      sex: n.sex,
      condition: n.condition,
      weightNewborn: n.weight,
      temperatureNewborn: n.temperature,
      headCircumference: n.headCircumference,
      apgarScore: n.apgarScore,
      symptomsAssessmentNewborn: n.symptomsAssessment,
      otherSymptomNewborn: n.otherSymptom,
      kmcAdministered: n.kmcAdministered,
      breastfeedingInitiated: n.breastfeedingInitiated,
      immunization_records,
      medicineProvided: n.medicineProvided,
      medicinesAdministeredNewborn,
      oxygenGiven: n.congenitalAnomaly,
      causeOfDeathNewborn: n.causeOfDeath,
      cardProvided: immunisationCard.immunisationCardProvided ?? false,
      immunisationNumber: immunisationNumber ?? null,
    };

    if (n.muac !== null && n.muac !== undefined) {
      newbornFormData.muacNewborn = n.muac;
    }

    return newbornFormData;
  });

  return { newbornAssessments };
};
