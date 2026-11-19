import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

// Types/Interfaces
interface User {
  id: number;
  name: string;
  email: string;
}

interface Facility {
  id: number;
  name: string;
}

interface AttendanceRecord {
  id: number;
  userId: number;
  user: User;
  facilityId: number;
  facility: Facility;
  checkInTime: string;
  checkOutTime: string;
}

interface GetAttendanceRecordsParams {
  facilityId: number;
  page?: number;
  limit?: number;
  search?: string;
}

interface ForceCheckoutParams {
  doctorId: number;
}

export const adminAttendanceApiService = createApi({
  reducerPath: "adminAttendanceApiService",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getFacilityAttendanceRecords: builder.query<
      any,
      GetAttendanceRecordsParams
    >({
      query: ({ facilityId, page = 1, limit = 10, search }) => {
        const params = new URLSearchParams({
          facilityId: facilityId.toString(),
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) {
          params.append("search", search);
        }

        return {
          url: `/attendance?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    forceCheckoutDoctor: builder.mutation<
      AttendanceRecord,
      ForceCheckoutParams
    >({
      query: ({ doctorId }) => ({
        url: `/attendance/force-checkout/${doctorId}`,
        method: "PATCH",
      }),
    }),
  }),
});

export const {
  useGetFacilityAttendanceRecordsQuery,
  useForceCheckoutDoctorMutation,
} = adminAttendanceApiService;
