import { CreateEmergencyPatientRequest } from "../services/emergencyApi";

/*
 * Transform Emergency form values to API payload format
 */
export const buildEmergencyRequestBody = (
  values: any,
  _medicineOptions: any[] = [],
  facilityId?: number,
): CreateEmergencyPatientRequest => {
  const prescriptions = (values.medicinesAdministered || [])
    .filter((item: any) => item != null)
    .map((item: any) => {
      if (!item) return null;

      return {
        medicine_variant_id: item?.variant_id ?? null,
        quantity: Number(item.quantity) || 0,
      };
    })
    .filter(
      (item: any): item is { medicine_variant_id: number; quantity: number } =>
        Boolean(item) && item.medicine_variant_id != null,
    );

  return {
    patient: {
      first_name: values.firstName,
      last_name: values.lastName,
      identity_provider: values.identityProvider || undefined,
      other_identity_provider: values.otherIdentityProvider,
      nationality_status: values.nationalityStatus || undefined,
      cnic: values.cnic?.replace(/\D/g, "") || undefined,
      international_id: values.internationalId || undefined,
      mobile_no: values.mobileNo,
      gender: values.sex,
      blood_group: values.bloodGroup || undefined,
      service_required: values.serviceRequired,
      other_service: values.otherServiceRequired || undefined,
      presenting_complaint: values.presentingComplaint,
      past_medical_history: values.pastHistory || undefined,
      facility_id: facilityId,
      medicine_administered: values.administeredMedicines,
      age: values.age || undefined,
    },
    vitals: {
      temperature: values.temperature ? Number(values.temperature) : undefined,
      pulse: values.pulse ? Number(values.pulse) : undefined,
      systolic_bp: values.systolicBp ? Number(values.systolicBp) : undefined,
      diastolic_bp: values.diastolicBp ? Number(values.diastolicBp) : undefined,
      respiratory_rate: values.respiratoryRate
        ? Number(values.respiratoryRate)
        : undefined,
      spo2: values.spo2 ? Number(values.spo2) : undefined,
    },
    medicines_administered:
      prescriptions.length > 0 ? prescriptions : undefined,
    outcome: values.outcome
      ? {
          outcome: values.outcome,
          district_id: values.district || undefined,
          level_of_care: values.levelOfCare || undefined,
          facility_id: values.facility ? Number(values.facility) : undefined,
          type_of_service: values.serviceType,
          other_service: values.otherServiceType || undefined,
          reason_of_referral: values.referralReason,
        }
      : undefined,
  };
};
