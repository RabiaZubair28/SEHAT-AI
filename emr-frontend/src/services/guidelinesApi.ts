import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export const guidelinesApi = createApi({
  reducerPath: "guidelinesApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getGuidelines: builder.query<{ success: boolean; data: { id: number; title: string }[] }, void>({
      query: () => `/akuh-guidelines`,
    }),
    getGuidelineContent: builder.query<
      { success: boolean; data: { id: number; title: string; formatted_content: string } },
      number
    >({
      query: (id) => `/akuh-guidelines/${id}`,
    }),
  }),
});

export const { useGetGuidelinesQuery, useGetGuidelineContentQuery } = guidelinesApi;
