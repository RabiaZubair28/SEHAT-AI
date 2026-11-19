import { createApi } from "@reduxjs/toolkit/query/react";
import { Route } from "@/data/types";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const routesApiService = createApi({
  reducerPath: "routesApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getRoutes: builder.query<Route[], void>({
      query: () => `${BASE_URL}routes`,
    }),
  }),
});

export const { useGetRoutesQuery } = routesApiService;
