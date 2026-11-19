import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface ChangePasswordPayload {
  // Omitted when a super admin reset forces the change.
  current_password?: string;
  new_password: string;
}

export const passwordApiService = createApi({
  reducerPath: "passwordApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    changePassword: builder.mutation<
      { success: boolean; message?: string },
      ChangePasswordPayload
    >({
      query: (body) => ({
        url: "auth/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useChangePasswordMutation } = passwordApiService;
