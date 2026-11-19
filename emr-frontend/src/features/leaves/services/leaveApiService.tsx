import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface LeaveUser {
  id: number;
  first_name?: string;
  last_name?: string;
}

export interface LeaveFacility {
  id: number;
  name?: string;
}

export interface Leave {
  id: number;
  userId: number;
  user?: LeaveUser;
  facilityId: number;
  facility?: LeaveFacility;
  startDate: string; // "2024-01-01"
  endDate: string;   // "2024-01-05"
  reason: string;
  status: string;    // "Pending" | "Approved" | "Rejected" etc.
}

export const userLeaveApiService = createApi({
  reducerPath: "leaveApiService",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    // GET /api/leave → returns all leaves (we filter by user on the UI)
    getLeaves: builder.query<Leave[], void>({
      query: () => ({
        url: "/leave",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetLeavesQuery } = userLeaveApiService;
export type { Leave as LeaveRecord };
