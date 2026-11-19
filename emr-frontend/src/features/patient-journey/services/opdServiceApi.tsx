import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { OPD } from "./apis";

export const opdServiceApi = createApi({
  reducerPath: "opdProfileApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["opd"],

  endpoints: (builder) => ({
    // -------------------------------
    // GET BY PATIENT ID
    // -------------------------------
    getOpdRecordByPatientId: builder.query<any, any>({
      query: (patientId) => `${OPD}/patient/${patientId}`,
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status,
          ...response,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "opd", id }],
    }),

    // -------------------------------
    // CREATE OPD RECORD
    // -------------------------------
    postOpdRecord: builder.mutation<any, any>({
      query: (body) => ({
        url: `${OPD}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status, // 201
          ...response,
        };
      },
      invalidatesTags: [{ type: "opd" }],
    }),

    // -------------------------------
    // UPDATE OPD RECORD
    // -------------------------------
    updateOpdRecord: builder.mutation<
      any,
      { appointment_service_id: number; data: any }
    >({
      query: ({ appointment_service_id, data }) => ({
        url: `${OPD}/${appointment_service_id}`,
        method: "PATCH",
        body: data,
      }),

      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status,
          ...response,
        };
      },

      invalidatesTags: (_result, _error, { appointment_service_id }) => [
        { type: "opd", id: appointment_service_id },
      ],
    }),
  }),
});

export const {
  useGetOpdRecordByPatientIdQuery,
  usePostOpdRecordMutation,
  useUpdateOpdRecordMutation,
} = opdServiceApi;
