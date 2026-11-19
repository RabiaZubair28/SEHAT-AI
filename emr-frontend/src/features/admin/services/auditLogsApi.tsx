import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

/* =========================
   Types
========================= */

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  facilityId?: number;
  email?: string;
}

interface AuditLogResponse {
  data: AuditLogData[];
  isLoading: boolean;
  count: number;
  isError: boolean;
}

export interface AuditLogData {
  id: number;
  userId: number;
  user: any;
  facilityId: number;
  facility: any;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  route: string;
  body: any;
  params: Record<string, any>;
  query: Record<string, any>;
  ip: string;
  statusCode: number;
  executionTimeMs: number;
  createdAt: string;
}

/* =========================
   API Slice
========================= */

export const auditLogsApiService = createApi({
  reducerPath: "auditLogsApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["AuditLogs"],
  endpoints: (builder) => ({
    /* --------- GET: Medicine Batch List --------- */
    getAuditLogs: builder.query<AuditLogResponse, GetAuditLogsParams>({
      query: ({ page = 1, limit = 10, facilityId, email }) => ({
        url: "/super-admin/audit-logs",
        params: {
          page,
          limit,
          ...(facilityId && { facilityId }),
          ...(email && { email }),
        },
      }),
      providesTags: ["AuditLogs"],
    }),
  }),
});

/* =========================
   Hooks
========================= */

export const { useGetAuditLogsQuery } = auditLogsApiService;
