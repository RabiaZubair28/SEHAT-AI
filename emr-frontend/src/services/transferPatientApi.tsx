import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { ServiceType } from "@/data/types";

export interface AvailableDoctorsParams {
  serviceType: ServiceType;
  facility_id: number;
}

export interface TransferServiceParams {
  serviceType: ServiceType;
  doctorId: number;
  facility_id?: number;
  appointmentId?: number | null;
}

export interface UnassignPatientParams {
  patient_id: number;
  facility_id: number;
}

export const transferPatientApi = createApi({
  reducerPath: "transferPatientApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getAvailableDoctors: builder.query<any, AvailableDoctorsParams>({
      query: (params) => {
        return {
          url: "doctors/available",
          params: {
            facility_id: params.facility_id,
            service_type: params.serviceType,
          },
        };
      },
    }),

    transferServiceToDoctor: builder.mutation<any, TransferServiceParams>({
      query: ({ serviceType, doctorId, facility_id, appointmentId }) => {
        const queryParams: Record<string, string | number> = {
          service_type: serviceType,
        };

        if (facility_id) {
          queryParams.facility_id = facility_id;
        }

        return {
          url: `doctors/transfer/service/${serviceType}/doctor/${doctorId}/appointment/${appointmentId}`,
          method: "PATCH",
          params: queryParams,
        };
      },
    }),
    unassignPatient: builder.mutation<any, UnassignPatientParams>({
      query: ({ patient_id, facility_id }) => {
        return {
          url: "referrals/unassign",
          method: "POST",
          params: {
            facility_id,
          },
          body: {
            patient_id,
            facility_id,
          },
        };
      },
    }),
  }),
});

export const {
  useGetAvailableDoctorsQuery,
  useTransferServiceToDoctorMutation,
  useUnassignPatientMutation
} = transferPatientApi;
