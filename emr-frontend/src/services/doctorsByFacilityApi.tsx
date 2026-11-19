import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { GET_DOCTORS_BY_FACILITY_API } from "./apis";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DoctorsParams {
  page?: number;
  limit?: number;
  facility_id?: number;
}

export interface DoctorRole {
  id: number;
  name: string;
  description: string;
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: DoctorRole;
  status: string;
}

export interface DoctorsResponse {
  data: Doctor[];
  count: number;
  page: number;
  lastPage: number;
}

// ─── API Service ──────────────────────────────────────────────────────────────
export const doctorsApiService = createApi({
  reducerPath: "doctorsApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getDoctorsByFacility: builder.query<DoctorsResponse, DoctorsParams>({
      query: (params) => ({
        url: GET_DOCTORS_BY_FACILITY_API,
        method: "GET",
        params: removeEmpty(params),
      }),
    }),
  }),
});

export const {
  useGetDoctorsByFacilityQuery,
  useLazyGetDoctorsByFacilityQuery,
} = doctorsApiService;

// ─── Helper ───────────────────────────────────────────────────────────────────
function removeEmpty(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}
