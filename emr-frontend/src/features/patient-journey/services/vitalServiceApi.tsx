import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import {  VITALS_API } from "./apis";

export const vitalsServiceApi = createApi({
  reducerPath: "vitalsServiceApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["vitals"],
  endpoints: (builder) => ({
    postVitalsRecord: builder.mutation<any, any>({
      query: (body) => ({
        url: `${VITALS_API}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "vitals" }],
      transformResponse: (response: any) => {
        return response;
      },
    }),
    getVitalsByAppointmentId: builder.query<any, number>({
      query: (visitId) => ({
        url: `${VITALS_API}`,
        method: "GET",
        params: { visitId },
      }),
      providesTags: [{ type: "vitals" }],
    }),
  }),
});

export const {
  usePostVitalsRecordMutation,
  useGetVitalsByAppointmentIdQuery,
  useLazyGetVitalsByAppointmentIdQuery,
} = vitalsServiceApi;
