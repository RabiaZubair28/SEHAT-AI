import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface Facility {
  id: number;
  name: string;
  code: string;
  facility_type: string;
  managed_by: string;
  is_24_7: boolean;
  level_of_care?: string;
}

export interface FacilityResponse {
  data: Facility[];
  count: number;
  page: number;
  lastPage: number;
}

export interface FacilityParams {
  page?: number;
  limit?: number;
  name?: string;
  code?: string;
  facility_id?: number;
  managedByPPHI?: boolean;
}

export interface FacilityByDistrictParams {
  districtId: number;
  page?: number;
  limit?: number;
  levelOfCare?: string;
  managedByPPHI?: boolean;
}

export interface BulkFacilityRow {
  division?: string;
  facility_code?: string;
  district: string;
  taluka?: string;
  union_council?: string;
  facility_name: string;
  facility_type?: string;
  managed_by?: string;
  is_24_7?: string;
  bmu?: string;
  otp?: string;
  nsc?: string;
  lat?: string;
  long?: string;
  level_of_care?: string;
}

export interface BulkRowError {
  row: number;
  field: string;
  message: string;
}

export interface BulkCreatePayload {
  facilities: BulkFacilityRow[];
}

export interface BulkCreateFacilitiesResponse {
  success: boolean;
  status: number;
  message: string;
  data: { created: number };
}

export const facilitiesApiService = createApi({
  reducerPath: "facilitiesApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["Facilities"],
  endpoints: (builder) => ({
    getFacilities: builder.query<FacilityResponse, FacilityParams>({
      query: (params = {}) => {
        const queryParams: Record<string, string | number | boolean> = {
          page: params.page || 1,
          limit: params.limit || 10,
        };


        if (params.facility_id) queryParams.facility_id = params.facility_id;

        if (params.name) queryParams.name = params.name;
        if (params.code) queryParams.code = params.code;
        if (params.managedByPPHI !== undefined)
          queryParams.managedByPPHI = params.managedByPPHI;

        return {
          url: "facilities",
          params: queryParams,
        };
      },
      providesTags: [{ type: "Facilities", id: "LIST" }],
    }),

    getFacilitiesByDistrictId: builder.query<
      FacilityResponse,
      FacilityByDistrictParams
    >({
      // query: ({ districtId, page = 1, limit = 10, levelOfCare }) => ({
      //   url: `facilities/district/${districtId}`,
      //   params: { page, limit },
      // }),
      query: ({
        districtId,
        page = 1,
        limit = 10,
        levelOfCare,
        managedByPPHI,
      }) => {
        const params: Record<string, string | number | boolean> = {
          page,
          limit,
        };

        // Add levelOfCare to query params if provided
        if (levelOfCare) {
          params.LevelOfCare = levelOfCare;
        }

        if (managedByPPHI !== undefined) {
          params.managedByPPHI = managedByPPHI;
        }

        return {
          url: `facilities/district/${districtId}`,
          params,
        };
      },
      providesTags: [{ type: "Facilities", id: "LIST" }],
    }),

    bulkCreateFacilities: builder.mutation<
      BulkCreateFacilitiesResponse,
      BulkCreatePayload
    >({
      query: (body) => ({
        url: "facilities/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Facilities", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFacilitiesQuery,
  useGetFacilitiesByDistrictIdQuery,
  useBulkCreateFacilitiesMutation,
} = facilitiesApiService;
