import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { PermissionPayloadItemSlim, Route as RouteItem } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface CreateRolePermissionRequest {
  roleId: number;
  payload: RouteItem[];
}

export interface CreateUserPermissionRequest {
  userId: number;
  payload: RouteItem[];
  status: string;
}

export const rolePermissionApiService = createApi({
  reducerPath: "rolePermissionApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    createRolePermission: builder.mutation<void, CreateRolePermissionRequest>({
      query: (data) => ({
        url: "role-permissions",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const userPermissionApiService = createApi({
  reducerPath: "userPermissionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createUserPermission: builder.mutation<void, CreateUserPermissionRequest>({
      query: (data) => ({
        url: "user-permissions",
        method: "POST",
        body: data,
      }),
    }),
    getUserPermissionDefaults: builder.query<PermissionPayloadItemSlim[], string>({
      query: (roleName) => `user-permissions/defaults/${roleName}`,
    }),
  }),
});

export const { useCreateRolePermissionMutation } = rolePermissionApiService;
export const {
  useCreateUserPermissionMutation,
  useLazyGetUserPermissionDefaultsQuery,
} = userPermissionApiService;
