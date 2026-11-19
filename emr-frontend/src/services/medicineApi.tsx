import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  description: string | null;
  category: string;
  strength: string;
  unit: string;
  otc: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicinesResponse {
  success: boolean;
  code: number;
  data: Medicine[];
  message: string;
  page: number;
  limit: number;
  count: number;
  lastPage: number;
}

export const medicineApi = createApi({
  reducerPath: "medicineApi",
  baseQuery: baseQueryWithAuthCheck,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  refetchOnMountOrArgChange: false,

  endpoints: (builder) => ({
    getMedicines: builder.query<
      MedicinesResponse,
      {
        category?: string;
        name?: string;
        except_category?: string;
        contraceptive?: boolean;
        is_otc?: boolean;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => {
        const queryParams: Record<string, any> = {};
        if (params.category !== undefined)
          queryParams.category = params.category;

        if (params.name !== undefined) queryParams.name = params.name;

        if (params.except_category !== undefined)
          queryParams.except_category = params.except_category;

        if (params.is_otc !== undefined) queryParams.is_otc = params.is_otc;

        if (params.contraceptive !== undefined)
          queryParams.contraceptive = params.contraceptive;

        if (params.page !== undefined) queryParams.page = params.page;

        if (params.limit !== undefined) queryParams.limit = params.limit;

        return {
          url: "/medicine",
          params: queryParams,
        };
      },
    }),

    // ✅ NEW QUERY: Get prescription by patient ID
    getPrescriptions: builder.query<
      any, // replace with proper interface once known
      { patient_id: number }
    >({
      query: ({ patient_id }) => ({
        url: "/medicine/prescriptions",
        params: { patient_id },
      }),
    }),
  }),
});

export const { useGetMedicinesQuery, useGetPrescriptionsQuery } = medicineApi;
