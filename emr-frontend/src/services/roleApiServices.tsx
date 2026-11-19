// services/roleApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { GET_ROLES_API } from "./apis";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export interface Role {
  id: number;
  name: string;
  description: string;
  guards?: string[];
}

export const roleApiService = createApi({
  reducerPath: "roleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => GET_ROLES_API,
    }),
  }),
});

export const { useGetRolesQuery } = roleApiService;
