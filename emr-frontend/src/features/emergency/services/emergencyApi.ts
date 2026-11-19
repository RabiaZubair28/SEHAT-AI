import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const emergencyApiService = createApi({
  reducerPath: "emergencyApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["EmergencyPatients"],
  endpoints: (builder) => ({
    // POST Create Emergency Patient Record
    createEmergencyPatient: builder.mutation<
      any,
      CreateEmergencyPatientRequest
    >({
      query: (body) => ({
        url: `/emergency`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmergencyPatients"],
    }),
  }),
});

// Types matching the exact API structure
export interface CreateEmergencyPatientRequest {
  patient: {
    first_name: string;
    last_name: string;
    identity_provider: string;
    other_identity_provider?: string;
    nationality_status: string;
    cnic?: string;
    international_id?: string;
    mobile_no: string;
    gender: string;
    blood_group?: string;
    service_required: string;
    other_service?: string;
    presenting_complaint: string;
    past_medical_history?: string;
    facility_id?: number;
    medicine_administered?: boolean;
    age?: string;
  };
  vitals: {
    temperature?: number;
    pulse?: number;
    systolic_bp?: number;
    diastolic_bp?: number;
    respiratory_rate?: number;
    spo2?: number;
  };
  medicines_administered?: Array<{
    medicine_variant_id: number;
    quantity: number;
  }>;
  outcome?: {
    outcome: string;
    district_id?: number;
    level_of_care?: string;
    facility_id?: number;
    type_of_service?: string;
    other_service?: string;
    reason_of_referral?: string;
  };
}

export const { useCreateEmergencyPatientMutation } = emergencyApiService;
