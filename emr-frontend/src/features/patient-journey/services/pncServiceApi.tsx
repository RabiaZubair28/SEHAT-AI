import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { PNC_API } from "./apis";

export interface PncMutateResponse {
  success: boolean;
  status?: number;
  data: {
    appointmentService: { id: number };
  };
  message: string;
}

export const pncServiceApi = createApi({
  reducerPath: "pncProfileApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["pnc"],

  endpoints: (builder) => ({
    // -------------------------------
    // GET BY PATIENT ID
    // -------------------------------
    getPncRecordByPatientId: builder.query<any, any>({
      query: (patientId) => `${PNC_API}/patient/${patientId}`,
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          httpStatus: meta?.response?.status,
          ...response,
        };
      },
      providesTags: (_result, _error, id) => [{ type: "pnc", id }],
    }),

    // -------------------------------
    // CREATE PNC RECORD
    // -------------------------------
    postPncRecord: builder.mutation<PncMutateResponse, any>({
      query: (body) => ({
        url: `${PNC_API}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: PncMutateResponse,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status,
          ...response,
        };
      },
      invalidatesTags: [{ type: "pnc" }],
    }),

    // -------------------------------
    // UPDATE PNC RECORD
    // -------------------------------
    updatePncRecord: builder.mutation<
      PncMutateResponse,
      { appointment_service_id: number; data: any }
    >({
      query: ({ appointment_service_id, data }) => ({
        url: `${PNC_API}/${appointment_service_id}`,
        method: "PATCH", // or PUT, depending on backend
        body: data,
      }),

      transformResponse: (
        response: PncMutateResponse,
        meta: FetchBaseQueryMeta | undefined
      ) => {
        return {
          status: meta?.response?.status,
          ...response,
        };
      },

      invalidatesTags: (_result, _error, { appointment_service_id }) => [
        { type: "pnc", id: appointment_service_id },
      ],
    }),
  }),
});

export const {
  useGetPncRecordByPatientIdQuery,
  usePostPncRecordMutation,
  useUpdatePncRecordMutation,
} = pncServiceApi;
