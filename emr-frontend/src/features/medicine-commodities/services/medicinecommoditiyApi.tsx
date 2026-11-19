import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import {
  CommodityRequest,
  CommodityRequestSummary,
  DispensePayload,
  GetCommodityRequestsParams,
  StockRefillPayload,
} from "@/data/types";

export const commodityRequestApiService = createApi({
  reducerPath: "commodityRequestApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["CommodityRequest"],
  endpoints: (builder) => ({
    /* --------- POST: Create Commodity Request --------- */
    createCommodityRequest: builder.mutation<
      { success: boolean; message?: string },
      StockRefillPayload
    >({
      query: (body) => ({
        url: "/commodity-requests",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => ({
        httpStatus: meta?.response?.status,
        ...response,
      }),
      invalidatesTags: ["CommodityRequest"],
    }),

    /* --------- GET: All Commodity Requests --------- */
    getCommodityRequests: builder.query<
      CommodityRequest[],
      GetCommodityRequestsParams
    >({
      query: ({ status }) => ({
        url: "/commodity-requests",
        params: { status },
      }),
      providesTags: ["CommodityRequest"],
    }),

    /* --------- GET: Commodity Request By ID --------- */
    getCommodityRequestById: builder.query<CommodityRequest, number>({
      query: (id) => `/commodity-requests/${id}`,
      providesTags: ["CommodityRequest"],
    }),

    /* --------- GET: Requests By Requester --------- */
    getCommodityRequestsByRequester: builder.query<
      CommodityRequest[],
      number,
      GetCommodityRequestsParams
    >({
      query: (requesterId) => `/commodity-requests/requester/${requesterId}`,
      providesTags: ["CommodityRequest"],
    }),

    /* --------- GET: Statistics Summary --------- */
    getCommodityRequestSummary: builder.query<CommodityRequestSummary, void>({
      query: () => "/commodity-requests/statistics/summary",
    }),

    /* --------- PATCH: Update Request Status --------- */
    updateCommodityRequestStatus: builder.mutation<
      { success: boolean; message?: string },
      { id: number; payload: DispensePayload }
    >({
      query: ({ id, payload }) => ({
        url: `/commodity-requests/${id}/status`,
        method: "PATCH",
        body: payload,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => ({
        httpStatus: meta?.response?.status,
        ...response,
      }),
      invalidatesTags: ["CommodityRequest"],
    }),
  }),
});

/* =========================
   Hooks
========================= */

export const {
  useCreateCommodityRequestMutation,
  useGetCommodityRequestsQuery,
  useGetCommodityRequestByIdQuery,
  useGetCommodityRequestsByRequesterQuery,
  useGetCommodityRequestSummaryQuery,
  useUpdateCommodityRequestStatusMutation,
} = commodityRequestApiService;
