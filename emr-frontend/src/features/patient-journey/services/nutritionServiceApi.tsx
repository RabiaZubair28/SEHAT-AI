import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { NUTRITION_API } from "./apis";

export const nutritionServiceApi = createApi({
  reducerPath: "nutritionProfileApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["nutrition"],

  endpoints: (builder) => ({
    // -------------------------------
    // GET BY PATIENT ID
    // -------------------------------
    getNutritionRecordByPatientId: builder.query<any, any>({
      query: (patientId) => `${NUTRITION_API}/patient/${patientId}`,
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status,
          ...response,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "nutrition", id }],
    }),

    // -------------------------------
    // CREATE NUTRITION RECORD
    // -------------------------------
    postNutritionRecord: builder.mutation<any, any>({
      query: (body) => ({
        url: `${NUTRITION_API}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status,
          ...response,
        };
      },
      invalidatesTags: [{ type: "nutrition" }],
    }),

    // -------------------------------
    // UPDATE NUTRITION RECORD
    // -------------------------------
    updateNutritionRecord: builder.mutation<
      any,
      { appointment_service_id: number; data: any }
    >({
      query: ({ appointment_service_id, data }) => ({
        url: `${NUTRITION_API}/${appointment_service_id}`,
        method: "PATCH",
        body: data,
      }),

      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status,
          ...response,
        };
      },

      invalidatesTags: (_result, _error, { appointment_service_id }) => [
        { type: "nutrition", id: appointment_service_id },
      ],
    }),
  }),
});

export const {
  useGetNutritionRecordByPatientIdQuery,
  usePostNutritionRecordMutation,
  useUpdateNutritionRecordMutation,
} = nutritionServiceApi;
