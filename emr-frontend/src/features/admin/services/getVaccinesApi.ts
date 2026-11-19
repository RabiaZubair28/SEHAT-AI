import { createApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export type GetVaccinesParams = {
  name?: string;
  dose_number?: number[];
  applies_to?: string;
  page?: number;
  limit?: number;
  patientId?: number;
};

export const getVaccinesApi = createApi({
  reducerPath: "getVaccinesApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["immunisationVaccines", "immunisationRecords"],

  endpoints: (builder) => ({
    getVaccines: builder.query<any, GetVaccinesParams>({
      query: (params) => ({
        url: `/immunisation/vaccines`,
        method: "GET",
        params,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined,
      ) => {
        return {
          httpStatus: meta?.response?.status,
          ...response,
        };
      },
      providesTags: (_result) => [{ type: "immunisationVaccines" }],
    }),
  }),
});

export const { useGetVaccinesQuery } = getVaccinesApi;
