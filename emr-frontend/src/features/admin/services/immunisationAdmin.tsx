import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface ClosePatientImmunisationRequest {
  patientId: number;
}

export const immunisationAdminApi = createApi({
  reducerPath: "immunisationAdminApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["PatientImmunisations"],
  endpoints: (builder) => ({
    closePatientImmunisation: builder.mutation<
      void,
      ClosePatientImmunisationRequest
    >({
      query: ({ patientId }) => ({
        url: "/immunisation/patient-immunisations/close",
        method: "POST",
        body: { patientId },
      }),
      invalidatesTags: ["PatientImmunisations"], // refresh table automatically
    }),
  }),
});

export const { useClosePatientImmunisationMutation } = immunisationAdminApi;
