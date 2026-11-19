import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { DISPENSING_API } from "./apis";
import { FetchBaseQueryMeta } from "@reduxjs/toolkit/query";

export const dispenserApiService = createApi({
  reducerPath: "dispensingApi",
  baseQuery: baseQueryWithAuthCheck,
  tagTypes: ["dispensing"],
  endpoints: (builder) => ({
    // 2️⃣ Mutation
    postDispensing: builder.mutation<any, any>({
      query: (body) => ({
        url: `${DISPENSING_API}`,
        method: "POST",
        body,
      }),
      transformResponse: (
        response: any,
        meta: FetchBaseQueryMeta | undefined
      ) => ({
        ...response,
        status: meta?.response?.status,
      }),
      invalidatesTags: [{ type: "dispensing" }],
    }), // ✅ closed properly

    // ✅ closed properly
  }),
});

// ✅ Hook exports
export const { usePostDispensingMutation } = dispenserApiService;
