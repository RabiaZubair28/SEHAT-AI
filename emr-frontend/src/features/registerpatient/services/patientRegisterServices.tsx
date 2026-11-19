import { createApi } from "@reduxjs/toolkit/query/react";

import { Patient, PatientQueryParams, ApiSuccessResponse, PatientSearchResult } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { PATIENT_API } from "./apis";

export interface PatientListResponse {
  success: boolean;
  status: number;
  data: PatientSearchResult[];
  message: string;
  page: string;
  limit: string;
  count: number;
  lastPage: number;
}

export const patientApiService = createApi({
  reducerPath: "patientApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["Patient"],
  endpoints: (builder) => ({
    // GET /patients with query params
    getAllPatients: builder.query<PatientListResponse, PatientQueryParams>({
      query: (params = {}) => {
        const queryParams = {
          page: 1,
          limit: 4,
          ...params,
        };

        return {
          url: `${PATIENT_API}`,
          method: "GET",
          params: queryParams,
        };
      },
      providesTags: ["Patient"],
    }),

    // GET /patients/:id
    getPatientById: builder.query<Patient, number>({
      query: (id) => `${PATIENT_API}${id}`,
      providesTags: (_result, _error, id) => [{ type: "Patient", id }],
    }),

    // POST /patients
    addPatient: builder.mutation<
      ApiSuccessResponse<Patient>,
      Omit<Patient, "id" | "mr_no">
    >({
      query: (data) => ({
        url: `${PATIENT_API}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Patient"],
    }),

    // PUT /patients/:id
    updatePatient: builder.mutation<Patient, { id: number } & Partial<Patient>>(
      {
        query: ({ id, ...data }) => ({
          url: `${PATIENT_API}/${id}`,
          method: "PUT",
          body: data,
        }),
        invalidatesTags: (_result, _error, { id }) => [{ type: "Patient", id }],
      }
    ),

    // DELETE /patients/:id
    deletePatient: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `${PATIENT_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Patient", id }],
    }),
  }),
});

export const {
  useGetAllPatientsQuery,
  useLazyGetAllPatientsQuery,
  useGetPatientByIdQuery,
  useAddPatientMutation,
  useUpdatePatientMutation,
  useDeletePatientMutation,
} = patientApiService;
