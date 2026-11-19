import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { ANC_API } from "./apis";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import { ServiceType } from "../data/constants";

export interface AncMutateResponse {
  success: boolean;
  status?: number;
  data: {
    appointmentService: { id: number };
  };
  message: string;
}

export const ancServiceApi = createApi({
  reducerPath: "ancProfileApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["anc", "visitService"],
  endpoints: (builder) => ({
    getAncRecordByPatientId: builder.query<any, any>({
      query: (patientId) => `${ANC_API}/patient/${patientId}`,
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined,
      ) => ({
        status: meta?.response?.status,
        ...response,
      }),
      providesTags: (_result, _error, id) => [{ type: "anc", id }],
    }),

    postAncRecord: builder.mutation<AncMutateResponse, unknown>({
      query: (body) => ({
        url: `${ANC_API}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: AncMutateResponse,
        meta: FetchBaseQueryMeta | undefined,
      ) => ({
        ...response,
        status: meta?.response?.status,
      }),
      invalidatesTags: [{ type: "anc" }],
    }),

    updateAncRecord: builder.mutation<
      AncMutateResponse,
      { id: number; data: unknown }
    >({
      query: ({ id, data }) => ({
        url: `${ANC_API}/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (
        response: AncMutateResponse,
        meta: FetchBaseQueryMeta | undefined,
      ) => ({
        ...response,
        status: meta?.response?.status,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "anc", id }],
    }),

    getVisitServiceTypeByPatient: builder.query<
      any,
      { patientId: number; visitId: number; serviceType: ServiceType }
    >({
      query: ({ patientId, visitId, serviceType }) =>
        `/patients/${patientId}/visits/${visitId}/${serviceType}`,
      transformResponse: (response: any) => ({
        ...response,
      }),
      providesTags: (_result, _error, { patientId, visitId, serviceType }) => [
        { type: "visitService", id: `${patientId}-${visitId}-${serviceType}` },
      ],
    }),
  }),
});

export const {
  useGetAncRecordByPatientIdQuery,
  usePostAncRecordMutation,
  useUpdateAncRecordMutation,
  useGetVisitServiceTypeByPatientQuery,
  useLazyGetVisitServiceTypeByPatientQuery,
} = ancServiceApi;
