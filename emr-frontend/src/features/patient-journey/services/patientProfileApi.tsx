import { createApi } from "@reduxjs/toolkit/query/react";
import { Patient } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { PATIENT_API } from "./apis";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import { ServiceType } from "../data/constants";

interface ApiResponse {
  success: boolean;
  code: number;
  data: Patient;
  message: string;
}

export const patientProfileApi = createApi({
  reducerPath: "patientProfileApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["Patient-Profile", "visitService", "PatientVisits", "VisitDetails"],
  endpoints: (builder) => ({
    // ──────────────────────────────────────────
    // GET PATIENT BY ID
    // ──────────────────────────────────────────
    getPatientById: builder.query<Patient, number>({
      query: (id) => `${PATIENT_API}/${id}`,
      transformResponse: (response: ApiResponse) => {
        const { data, code, message } = response;
        return {
          ...data,
          code,
          message,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "Patient-Profile", id }],
    }),

    // ──────────────────────────────────────────
    // UPDATE PATIENT
    // ──────────────────────────────────────────
    updatePatient: builder.mutation<
      Patient & { httpStatus?: number },
      { id: number; data: Partial<Patient> }
    >({
      query: ({ id, data }) => ({
        url: `${PATIENT_API}/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          ...response,
          httpStatus: meta?.response?.status,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Patient-Profile", id },
      ],
    }),

    // ──────────────────────────────────────────
    // GET PATIENT WITH VISITS LIST (Step 1 - Lightweight)
    // ──────────────────────────────────────────

  getPatientWithVisits: builder.query<any, { patientId: number; page?: number; limit?: number }>({
      query: ({ patientId, page = 1, limit = 10 }) => ({
        url: `/patient/${patientId}/visits?page=${page}&limit=${limit}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        return response;
      },
      providesTags: (_result, _error, { patientId }) => [
        { type: "PatientVisits", id: patientId },
      ],
    }),

    // ──────────────────────────────────────────
    // GET VISIT DETAILS (Step 2 - Detailed)
    // ──────────────────────────────────────────
    getVisitDetails: builder.query<any, number>({
      query: (visitId: number) => ({
        url: `/patient/visits/${visitId}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response.data,
      providesTags: (_result, _error, visitId) => [
        { type: "VisitDetails", id: visitId },
      ],
    }),

    // ──────────────────────────────────────────
    // DEPRECATED: Use getPatientWithVisits instead
    // ──────────────────────────────────────────
    getPatientCompleteDetails: builder.query({
      query: (patientId: number) => ({
        url: `/patients/${patientId}/visits`,
        method: 'GET',
      }),
      transformResponse: (response: any) => response.data,
    }),

    // ──────────────────────────────────────────
    // GET VISIT SERVICE TYPE
    // ──────────────────────────────────────────
    getVisitServiceTypeByPatient: builder.query<
      any,
      { patientId: number; visitId: number; serviceType: ServiceType }
    >({
      query: ({ patientId, visitId, serviceType }) =>
        `/patients/${patientId}/visits/${visitId}/${serviceType}`,
      providesTags: (_result, _error, { patientId, visitId, serviceType }) => [
        { type: "visitService", id: `${patientId}-${visitId}-${serviceType}` },
      ],
    }),

    // ──────────────────────────────────────────
    // GET PREVIOUS VISIT BY ID
    // ──────────────────────────────────────────
    getPreviousVisitById: builder.query<
      any,
      { id: number; serviceType: ServiceType; usedIn?: ServiceType | null }
    >({
      query: ({ id, serviceType, usedIn }) => ({
        url: `${PATIENT_API}/${id}/service/${serviceType}`,
        params: usedIn ? { usedIn } : undefined,
      }),
      providesTags: (_r, _e, { id, serviceType, usedIn }) => [
        {
          type: "Patient-Profile",
          id: `${id}-${serviceType}-${usedIn ?? "default"}`,
        },
      ],
    }),
  }),
});

// ──────────────────────────────────────────
// EXPORTED HOOKS
// ──────────────────────────────────────────
export const {
  useGetPatientByIdQuery,
  useLazyGetPatientByIdQuery,
  useGetPreviousVisitByIdQuery,
  useUpdatePatientMutation,
  useGetVisitServiceTypeByPatientQuery,
  useGetPatientCompleteDetailsQuery,
  useGetPatientWithVisitsQuery,
  useLazyGetVisitDetailsQuery,
  useGetVisitDetailsQuery,
} = patientProfileApi;