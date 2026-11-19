import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { IMMUNISATION_API } from "./apis";

export type GetVaccinesParams = {
  name?: string;
  dose_number?: number[];
  applies_to?: string;
  page?: number;
  limit?: number;
  patientId?: number;
};

export type PostImmunisationPayload = {
  appointmentId: number;
  immunisationCard?: {
    placeOfDelivery: string;
    otherPlace?: string;
    level_of_care: string;
    districtId: number;
    facility: number;
    otherFacilityName?: string;
    immunisationCardAvailable: boolean;
    epiNumber?: string;
  };
  doses: Array<{
    vaccine_id: number;
    dateAdministered: string;
    status: string;
  }>;
};

export type UpdateImmunisationParams = {
  appointment_service_id: number;
  data: PostImmunisationPayload;
};

export const immunisationServiceApi = createApi({
  reducerPath: "immunisationServiceApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["immunisationVaccines", "immunisationRecords"],

  endpoints: (builder) => ({
    getVaccines: builder.query<any, GetVaccinesParams>({
      query: (params) => ({
        url: `${IMMUNISATION_API}/vaccines`,
        method: "GET",
        params,
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
      providesTags: (_result) => [{ type: "immunisationVaccines" }],
    }),

    postImmunisationRecord: builder.mutation<any, PostImmunisationPayload>({
      query: (data) => ({
        url: `${IMMUNISATION_API}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "immunisationRecords" }],
    }),
  }),
});

export const {
  useGetVaccinesQuery,
  usePostImmunisationRecordMutation,
} = immunisationServiceApi;