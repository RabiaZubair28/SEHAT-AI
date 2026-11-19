import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

/* =========================
   Types / Schemas
========================= */

/** ---- Base Inventory ---- */
export interface BaseInventoryItem {
  medicineId: number;
  medicineName: string;
  variantId?: number;
  variantName?: string;
  totalStock: number;
  availableStock: number;
  expiryDate?: string;
}

/** ---- Contraceptive Inventory ---- */
export interface ContraceptiveInventoryItem extends BaseInventoryItem {
  contraceptiveType: string;
  cycleDuration?: number;
  isEmergency: boolean;
}

/** ---- Non-Contraceptive Medicine Inventory ---- */
export interface MedicineInventoryItem extends BaseInventoryItem {
  dosageForm?: string;
  strength?: string;
}

/** ---- Pagination ---- */
export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  medicineId?: number;
  facilityId?: number;
}

export interface InventoryResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* =========================
   API Slice
========================= */

export const medicineInventoryApiService = createApi({
  reducerPath: "medicineInventoryApiService",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["MedicineInventory", "ContraceptiveInventory"],
  endpoints: (builder) => ({
    /* --------- GET: All Inventory (Mixed) --------- */
    getAllMedicineInventory: builder.query<
      InventoryResponse<BaseInventoryItem>,
      InventoryQueryParams | void
    >({
      query: (params) => ({
        url: "/commodity-requests/inventory/all",
        params,
      }),
      providesTags: ["MedicineInventory"],
    }),

    /* --------- GET: Contraceptive Inventory --------- */
    getContraceptiveInventory: builder.query<
      InventoryResponse<ContraceptiveInventoryItem>,
      InventoryQueryParams | void
    >({
      query: (params) => ({
        url: "/commodity-requests/inventory/contraceptives",
        params,
      }),
      providesTags: ["ContraceptiveInventory"],
    }),

    /* --------- GET: Non-Contraceptive Medicines --------- */
    getNonContraceptiveInventory: builder.query<
      InventoryResponse<MedicineInventoryItem>,
      InventoryQueryParams | void
    >({
      query: (params) => ({
        url: "/commodity-requests/inventory/medicines",
        params,
      }),
      providesTags: ["MedicineInventory"],
    }),
  }),
});

/* =========================
   Hooks
========================= */

export const {
  useGetAllMedicineInventoryQuery,
  useGetContraceptiveInventoryQuery,
  useGetNonContraceptiveInventoryQuery,
} = medicineInventoryApiService;
