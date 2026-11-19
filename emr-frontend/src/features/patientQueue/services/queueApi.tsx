import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const appointmentApiService = createApi({
  reducerPath: "appointmentApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["PatientImmunisations"],
  endpoints: (builder) => ({
    // GET Pending Appointments
    getPendingAppointments: builder.query<
      any,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/doctors/appointment/pending?page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),

    // GET Completed Appointments
    getCompletedAppointments: builder.query<
      any,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/doctors/appointment/completed?page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),
    getAllAppointments: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/doctors/appointment/all?page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),

    getPatientImmunisations: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        facility_id?: number;
        uc_id?: number;
        statuses?: string[];
        has_remarks?: boolean;
      }
    >({
      query: ({ page = 1, limit = 10, facility_id, uc_id, statuses, has_remarks }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (facility_id) params.append("facility_id", String(facility_id));
        if (uc_id) params.append("uc_id", String(uc_id));
        if (statuses && statuses.length > 0) {
          statuses.forEach((status) => params.append("statuses", status));
        }
        if (has_remarks !== undefined) params.append("has_remarks", String(has_remarks))

        return {
          url: `/immunisation/patient-immunisations?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["PatientImmunisations"],
    }),

    //unassign queue
    getUnassignedReferrals: builder.query<
      any,
      { page?: number; limit?: number; facility_id: number }
    >({
      query: ({ page = 1, limit = 10, facility_id }) => ({
        url: `/referrals/unassigned?page=${page}&limit=${limit}&facility_id=${facility_id}`,
        method: "GET",
      }),
    }),

    addPatientImmunisationRemarks: builder.mutation<
      any,
      { patientId: number; remarks: string }
    >({
      query: ({ patientId, remarks }) => ({
        url: `/immunisation/patient-immunisations/remarks`,
        method: "POST",
        body: { patientId, remarks },
      }),
      invalidatesTags: ["PatientImmunisations"],
    }),

    getEmergencyQueueByDoctor: builder.query<
      any,
      {
        doctorId: number;
        page?: number;
        limit?: number;
        facility_id?: string;
        LevelOfCare?: string;
      }
    >({
      query: ({ doctorId, page = 1, limit = 10, facility_id, LevelOfCare }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (facility_id) params.append("facility_id", facility_id);
        if (LevelOfCare) params.append("LevelOfCare", LevelOfCare);

        return {
          url: `/emergency/doctor/${doctorId}?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    getTelehealthQueue: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        service_type?: string;
        specialty?: string;
        availability?: string;
      }
    >({
      query: ({
        page = 1,
        limit = 10,
        service_type,
        specialty,
        availability,
      }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (service_type) params.append("service_type", service_type);
        if (specialty) params.append("specialty", specialty);
        if (availability) params.append("availability", availability);

        return {
          url: `/telehealth/queue?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    createTelehealthRequest: builder.mutation<
      any,
      {
        patient_id: number;
        appointment_service_id: number;
        consultant_doctor_id: number;
        specialty?: string;
        reason?: string;
      }
    >({
      query: (body) => ({
        url: "/telehealth/requests",
        method: "POST",
        body,
      }),
    }),
    getIncomingTelehealthRequests: builder.query<
      any,
      {
        status?: string;
      }
    >({
      query: ({ status } = {}) => {
        const params = new URLSearchParams();

        if (status) {
          params.append("status", status);
        }

        return {
          url: `/telehealth/requests/incoming${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
    }),
    getTelehealthRequestByAppointmentService: builder.query<any, number>({
      query: (appointmentServiceId) => ({
        url: `/telehealth/appointment-services/${appointmentServiceId}/requests`,
        method: "GET",
      }),
    }),
    acceptTelehealthRequest: builder.mutation<any, number>({
      query: (requestId) => ({
        url: `/telehealth/requests/${requestId}/accept`,
        method: "PATCH",
      }),
    }),
    completeTelehealthRequest: builder.mutation<
      any,
      { requestId: number; consultation_note: string }
    >({
      query: ({ requestId, consultation_note }) => ({
        url: `/telehealth/requests/${requestId}/complete`,
        method: "PATCH",
        body: { consultation_note },
      }),
    }),
    rejectTelehealthRequest: builder.mutation<
      any,
      { requestId: number; reason?: string }
    >({
      query: ({ requestId, reason }) => ({
        url: `/telehealth/requests/${requestId}/reject`,
        method: "PATCH",
        body: reason ? { reason } : {},
      }),
    }),
  }),
});

export const {
  useGetPendingAppointmentsQuery,
  useGetCompletedAppointmentsQuery,
  useGetAllAppointmentsQuery,
  useGetPatientImmunisationsQuery,
  useAddPatientImmunisationRemarksMutation,
  useGetEmergencyQueueByDoctorQuery,
  useGetUnassignedReferralsQuery,
  useGetTelehealthQueueQuery,
  useCreateTelehealthRequestMutation,
  useGetIncomingTelehealthRequestsQuery,
  useGetTelehealthRequestByAppointmentServiceQuery,
  useLazyGetTelehealthRequestByAppointmentServiceQuery,
  useAcceptTelehealthRequestMutation,
  useCompleteTelehealthRequestMutation,
  useRejectTelehealthRequestMutation,
} = appointmentApiService;
