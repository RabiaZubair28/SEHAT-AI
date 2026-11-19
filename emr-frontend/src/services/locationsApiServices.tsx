import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import {
  GET_ALL_DIVISIONS,
  GET_DISTRICT_BY_DIVISION_API,
  GET_ALL_UCS,
  GET_TALUKA_BY_DISTRICT_API,
  GET_ALL_DISTRICTS,
} from "./apis";

// Define types
export interface Division {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
}

export interface Taluka {
  id: number;
  name: string;
}

export interface UC {
  id: number;
  name: string;
}

export interface UCResponse {
  data: UC[];
  count: number;
  page: number;
  lastPage: number;
}

export interface UCParams {
  page?: number;
  limit?: number;
  name?: string;
}

// Create API service
export const locationApiService = createApi({
  reducerPath: "locationApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getAllDivisions: builder.query<Division[], void>({
      query: () => GET_ALL_DIVISIONS,
      transformResponse: (response: { data: Division[] }) => response.data,
    }),
    getAllDistricts: builder.query<District[], void>({
      query: () => GET_ALL_DISTRICTS,
      transformResponse: (response: { data: District[] }) => response.data,
    }),
    getDistrictsByDivisionId: builder.query<District[], number>({
      query: (divisionId) => `${GET_DISTRICT_BY_DIVISION_API}/${divisionId}`,
      transformResponse: (response: { data: District[] }) => response.data,
    }),
    getTalukasByDistrictId: builder.query<Taluka[], number>({
      query: (districtId) => `${GET_TALUKA_BY_DISTRICT_API}/${districtId}`,
      transformResponse: (response: { data: Taluka[] }) => response.data,
    }),

    getUCsByTalukaId: builder.query<UCResponse, { talukaId: number }>({
      query: ({ talukaId }) => ({
        url: `${GET_ALL_UCS}/${talukaId}`,
        // params: {},
      }),

      transformResponse: (response: UC[]) => ({
        data: response,
        count: response.length,
        page: 1,
        lastPage: 1,
      }),
    }),

    getUCs: builder.query<UCResponse, UCParams>({
      query: (params) => {
        const queryParams: Record<string, any> = {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
        };

        if (params.name) {
          queryParams.name = params.name;
        }

        return {
          url: GET_ALL_UCS,
          params: queryParams,
        };
      },

      transformResponse: (response: {
        data: UC[];
        count: number;
        page: number;
        lastPage: number;
      }) => ({
        data: response.data,
        count: response.count,
        page: response.page,
        lastPage: response.lastPage,
      }),
    }),
  }),
});

export const {
  useGetDistrictsByDivisionIdQuery,
  useGetTalukasByDistrictIdQuery,
  useGetUCsQuery,
  useGetUCsByTalukaIdQuery,
  useGetAllDivisionsQuery,
  useGetAllDistrictsQuery,
} = locationApiService;
