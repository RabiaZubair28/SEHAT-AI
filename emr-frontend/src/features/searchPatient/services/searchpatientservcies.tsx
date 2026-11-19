import { createApi } from "@reduxjs/toolkit/query/react";
import { SEARCH_PATIENT_API } from "./apis";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const searchPatientService = createApi({
  reducerPath: "patientSearchApi",
  baseQuery: baseQueryWithAuthCheck, 
  endpoints: (builder) => ({
    searchPatients: builder.query<
      any[],
      { mrNumber?: string; phone?: string; cnic?: string; name?: string }
    >({
      query: (params) => ({
        url: SEARCH_PATIENT_API, 
        method: "GET",
        params, 
      }),
    }),
  }),
});

export const { useSearchPatientsQuery } = searchPatientService;
