import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";

type PostAttendance = {
  longitude?: number;
  latitude?: number;
};

export const attendanceApiService = createApi({
  reducerPath: "attendanceApiService",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    markAttendance: builder.mutation<any, PostAttendance>({
      query: (payload) => ({
        url: `/attendance`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined,
      ) => {
        return {
          ...response,
          httpStatus: meta?.response?.status,
        };
      },
    }),

    getAttendanceRecords: builder.query<
      any,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: `/attendance`,
        method: "GET",
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      }),
    }),

    checkoutAttendance: builder.mutation<any, void>({
      query: () => ({
        url: `/attendance/checkout`,
        method: "PATCH",
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined,
      ) => {
        return {
          ...response,
          httpStatus: meta?.response?.status,
        };
      },
    }),
  }),
});

export const {
  useMarkAttendanceMutation,
  useGetAttendanceRecordsQuery,
  useCheckoutAttendanceMutation,
} = attendanceApiService;
