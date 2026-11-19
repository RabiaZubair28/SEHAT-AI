import { createApi } from "@reduxjs/toolkit/query/react";
import { ReferralIn, ReferralOut, ApiResponse } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const referralApiService = createApi({
  reducerPath: "referralApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["Referral"],
  endpoints: (builder) => ({
    referPatientInside: builder.mutation<ApiResponse, ReferralIn>({
      query: (data) => ({
        url: "/referrals/in",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Referral"],
    }),

    referPatientSelf: builder.mutation<ApiResponse, ReferralIn>({
      query: (data) => ({
        url: "/referrals/self-referral",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Referral"],
    }),

    referPatientOutside: builder.mutation<ApiResponse, ReferralOut>({
      query: (data) => ({
        url: "/referrals/out",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Referral"],
    }),

    unassignPatient: builder.mutation<
      ApiResponse,
      { patient_id: number; facility_id: number }
    >({
      query: (data) => ({
        url: "/referrals/unassign",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Referral"],
    }),

    getServices: builder.query<any, void>({
      query: () => ({
        url: "/referrals/getServiceByRoles",
        method: "GET",
      }),
      providesTags: ["Referral"],
    }),

    getEligibleServices: builder.query<any, number>({
      query: (patientId) => ({
        url: `/referrals/availability/${patientId}`,
        method: "GET",
      }),
      providesTags: ["Referral"],
    }),
  }),
});

export const {
  useReferPatientInsideMutation,
  useReferPatientSelfMutation,
  useReferPatientOutsideMutation,
  useUnassignPatientMutation,
  useGetEligibleServicesQuery,
  useGetServicesQuery,
} = referralApiService;
