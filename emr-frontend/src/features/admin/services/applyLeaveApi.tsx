import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface CreateLeaveRequest {
  userId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveResponse {
  id: number;
  userId: number;
  facilityId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

export const leaveApiService = createApi({
  reducerPath: "leaveApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    createLeave: builder.mutation<LeaveResponse, CreateLeaveRequest>({
      query: (body) => ({
        url: "leave",
        method: "POST",
        body,
      }),
    }),
    deleteLeave: builder.mutation({
      query: (id: number) => ({
        url: `leave/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const { useCreateLeaveMutation, useDeleteLeaveMutation } =
  leaveApiService;
