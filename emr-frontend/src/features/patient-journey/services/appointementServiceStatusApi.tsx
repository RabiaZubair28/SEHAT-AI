import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import {
  COMPLETE_APPOINTMENT_API,
  PAUSE_APPOINTMENT_API,
  START_APPOINTMENT_API,
} from "./apis";

export const appointmentServiceStatusApi = createApi({
  reducerPath: "appointmentServiceStatusApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["appointment"],
  endpoints: (builder) => ({
    startAppointment: builder.mutation<
      any,
      { appointmentId: number; serviceId: number }
    >({
      query: (body) => ({
        url: `${START_APPOINTMENT_API}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "appointment" }],
    }),
    pauseAppointment: builder.mutation<
      any,
      { appointmentId: number; serviceId: number }
    >({
      query: (body) => ({
        url: `${PAUSE_APPOINTMENT_API}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "appointment" }],
    }),
    completeAppointmentService: builder.mutation<
      any,
      { appointmentId: number; serviceId: number }
    >({
      query: (body) => ({
        url: `${COMPLETE_APPOINTMENT_API}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "appointment" }],
    }),
    dispatchAppointment: builder.mutation<any, { appointmentId: number }>({
      query: ({ appointmentId }) => ({
        url: `/referrals/dispatch/${appointmentId}`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "appointment" }],
    }),
  }),
});

export const {
  usePauseAppointmentMutation,
  useStartAppointmentMutation,
  useCompleteAppointmentServiceMutation,
  useDispatchAppointmentMutation,
} = appointmentServiceStatusApi;
