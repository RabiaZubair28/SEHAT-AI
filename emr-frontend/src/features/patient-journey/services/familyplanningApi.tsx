import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { FAMILY_PLANNING } from "./apis";

export const familyPlanningApiService = createApi({
  reducerPath: "familyPlanningApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["familyPlanning"],

  endpoints: (builder) => ({
    getFamilyPlanningRecordByPatientId: builder.query<any, any>({
      query: (patientId) => `${FAMILY_PLANNING}/patient/${patientId}`,
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status, // ✅ Correctly pulled from meta
          ...response,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "familyPlanning", id }],
    }),

    postFamilyPlanningRecord: builder.mutation<any, any>({
      query: (body) => ({
        url: `${FAMILY_PLANNING}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status, // ✅ 201 should appear here
          ...response,
        };
      },
      invalidatesTags: [{ type: "familyPlanning" }],
    }),
    updateFamilyPlanningRecord: builder.mutation({
      query: ({ appointment_service_id, data }) => ({
        url: `${FAMILY_PLANNING}/${appointment_service_id}`,
        method: "PUT", // ✅ use PUT for full update
        body: data,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status, // ✅ 200 or 204
          ...response,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "familyPlanning", id },
      ],
    }),
  }),
});

export const {
  useGetFamilyPlanningRecordByPatientIdQuery,
  usePostFamilyPlanningRecordMutation,
  useUpdateFamilyPlanningRecordMutation,
} = familyPlanningApiService;
