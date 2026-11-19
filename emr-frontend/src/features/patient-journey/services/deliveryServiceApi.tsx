import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { DELIVERY_API } from "./apis";

export const deliveryServiceApi = createApi({
  reducerPath: "deliveryServiceApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["delivery", "visitService"],

  endpoints: (builder) => ({
    postDeliveryVisit: builder.mutation<
      any,
      { progress_status: string; data: any }
    >({
      query: ({ progress_status, data }) => ({
        url: `${DELIVERY_API}?progress_status=${encodeURIComponent(
          progress_status
        )}`,
        method: "POST",
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

      invalidatesTags: [{ type: "delivery" }, { type: "visitService" }],
    }),

    updateDeliveryVisit: builder.mutation<
      any,
      { appointment_service_id: number; progress_status: string; data: any }
    >({
      query: ({ appointment_service_id, progress_status, data }) => ({
        url: `${DELIVERY_API}/${appointment_service_id}?progress_status=${encodeURIComponent(progress_status)}`,
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

      invalidatesTags: [{ type: "delivery" }, { type: "visitService" }],
    }),

    getChildrenByAppointmentService: builder.query<
      any,
      { appointmentServiceId: number }
    >({
      query: ({ appointmentServiceId }) => ({
        url: `${DELIVERY_API}/appointment-service/${appointmentServiceId}/children`,
        method: "GET",
      }),

      providesTags: ({ appointmentServiceId }) => [
        { type: "delivery", id: `children-${appointmentServiceId}` },
      ],
    }),

    getVaccines: builder.query<
      any,
      {
        name?: string;
        dose_number?: number[];
        applies_to?: string;
        page?: number;
        limit?: number;
        patientId?: number;
      }
    >({
      query: (params) => {
        const qs = new URLSearchParams();

        if (params?.name) qs.set("name", params.name);
        if (params?.dose_number?.length)
          params.dose_number.forEach((d) =>
            qs.append("dose_number", String(d))
          );
        if (params?.applies_to) qs.set("applies_to", params.applies_to);
        if (params?.page) qs.set("page", String(params.page));
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.patientId) qs.set("patientId", String(params.patientId));

        return {
          url: `/immunisation/vaccines?${qs.toString()}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const {
  usePostDeliveryVisitMutation,
  useUpdateDeliveryVisitMutation,
  useGetChildrenByAppointmentServiceQuery,
  useGetVaccinesQuery,
} = deliveryServiceApi;
