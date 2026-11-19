import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import type { EditBatchFormValues } from "../stockmanagement/constants/editBatchFieldsConstants";

/* =========================
   Types
========================= */

export interface MedicineBatchRequest {
  variantId: number;
  batchNumber?: string;
  expiryDate: string;
  purchaseDate: string;
  stockQuantity: number;
  limitQuantity?: number | null;
  otc: boolean;
  medicineId: number;
}

export interface MedicineBatchRaw {
  id: number;
  batch_number: string;
  expiry_date: string;
  purchase_date: string | null;
  stock_quantity: number;
  status: string;
  createdAt: string;
  isEditable: boolean;
  isDeletable: boolean;
  variant: {
    id: number;
    unit: string;
    strength: string;
    medicineCount?: Array<{
      otc: boolean;
      limit_quantity: number | null;
    }>;
  };
  facility: { id: number; name: string };
  medicine: { id: number; name: string };
}

export interface MedicineBatch {
  id: number;
  batchNumber: string;
  expiryDate: string | null;
  purchaseDate: string | null;
  stockQuantity: number;
  status: string;
  otc: boolean;
  limitQuantity: number | undefined;
  createdAt: string;
  isEditable: boolean;
  isDeletable: boolean;
  variant: { id: number; unit: string; strength: string };
  facility: { id: number; name: string };
  medicine: { id: number; name: string };
}

export interface GetMedicineBatchParams {
  page?: number;
  limit?: number;
  facilityId?: number;
  medicineId?: number;
  contraceptive?: boolean;
}

export interface GetMedicineBatchResponse {
  data: MedicineBatch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* =========================
   API Slice
========================= */

export const medicineBatchApiService = createApi({
  reducerPath: "medicineBatchApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["MedicineBatch"],
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    /* --------- POST: Add Medicine Batch --------- */
    addMedicineBatch: builder.mutation<
      { success: boolean; message?: string },
      MedicineBatchRequest[]
    >({
      query: (body) => ({
        url: "/medicine-batch",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined,
      ) => ({
        status: meta?.response?.status,
        ...response,
      }),
      invalidatesTags: ["MedicineBatch"],
    }),

    /* --------- GET: Medicine Batch List --------- */
    getMedicineBatches: builder.query<
      GetMedicineBatchResponse,
      GetMedicineBatchParams
    >({
      query: ({
        page = 1,
        limit = 10,
        facilityId,
        medicineId,
        contraceptive,
      }) => ({
        url: "/medicine-batch",
        params: {
          page,
          limit,
          ...(facilityId && { facilityId }),
          ...(medicineId && { medicineId }),
          ...(contraceptive !== undefined && { contraceptive }),
        },
      }),
      providesTags: ["MedicineBatch"],
    }),

    /* --------- GET: Single Medicine Batch --------- */
    getMedicineBatchById: builder.query<MedicineBatch, number>({
      query: (id) => `/medicine-batch/${id}`,
      transformResponse: (res: MedicineBatchRaw): MedicineBatch => ({
        id: res.id,
        batchNumber: res.batch_number,
        expiryDate: res.expiry_date ?? null,
        purchaseDate: res.purchase_date ?? null,
        stockQuantity: res.stock_quantity,
        status: res.status,
        createdAt: res.createdAt,
        isEditable: res.isEditable ?? false,
        isDeletable: res.isDeletable ?? false,
        otc: res.variant.medicineCount?.[0]?.otc ?? false,
        limitQuantity:
          res.variant.medicineCount?.[0]?.limit_quantity ?? undefined,
        variant: {
          id: res.variant.id,
          unit: res.variant.unit,
          strength: res.variant.strength,
        },
        facility: {
          id: res.facility.id,
          name: res.facility.name,
        },
        medicine: {
          id: res.medicine.id,
          name: res.medicine.name,
        },
      }),
      providesTags: (_result, _error, id) => [{ type: "MedicineBatch", id }],
    }),

    /* --------- PUT: Update Medicine Batch --------- */
    updateMedicineBatch: builder.mutation<
      MedicineBatch,
      { id: number; body: EditBatchFormValues }
    >({
      query: ({ id, body }) => ({
        url: `/medicine-batch/${id}`,
        method: "PUT",
        body: {
          ...body,
          purchaseDate: body.purchaseDate,
          expiryDate: body.expiryDate,
          limitQuantity: body.limitQuantity ?? undefined,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "MedicineBatch", id },
        "MedicineBatch",
      ],
    }),

    /* --------- DELETE: Delete Medicine Batch --------- */
    deleteMedicineBatch: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/medicine-batch/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MedicineBatch"],
    }),
  }),
});

/* =========================
   Hooks
========================= */

export const {
  useAddMedicineBatchMutation,
  useGetMedicineBatchesQuery,
  useGetMedicineBatchByIdQuery,
  useUpdateMedicineBatchMutation,
  useDeleteMedicineBatchMutation,
} = medicineBatchApiService;
