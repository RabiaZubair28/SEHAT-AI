import { Route } from "@/data/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface RolePermission {
  id: number;
  role: Role;
  payload: Route[];
}

interface RolePermissionResponse {
  payload: Route[];  
}

export const getRolePermissionsApiService = createApi({
  reducerPath: "getRolePermissionsApiService",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getRolePermissions: builder.query<RolePermission[], void>({
      query: () => "role-permissions",
    }),
    getRolePermissionsById: builder.query<RolePermissionResponse, number>({
      query: (roleId) => `role-permissions/${roleId}`,
    }),
  }),
});

export const { useGetRolePermissionsQuery,  useLazyGetRolePermissionsByIdQuery, } = getRolePermissionsApiService;
