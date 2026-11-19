import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  SUPER_ADMIN_LOGIN_API,
  LOGIN_API,
  GET_ALL_ROUTES_API,
  SIGNUP_API,
  LOGOUT_API,
  VALIDATE_TOKEN,
  SEND_EMAIL_API,
  RESET_PASSWORD_WITH_TOKEN_API,
  IMPERSONATION_LINK_API,
  IMPERSONATION_EXCHANGE_API,
} from "./apis";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const authApiService = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
    responseHandler: async (response) => {
      // If response is not ok (like 403), still get the content but mark as error
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return {
          error: {
            status: response.status,
            data: data || { message: response.statusText },
          },
        };
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }
      return response.text();
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data: { email: string; password: string }) => ({
        url: LOGIN_API,
        method: "POST",
        body: data,
      }),
    }),
    superAdminLogin: builder.mutation({
      query: (data: { email: string; password: string }) => ({
        url: SUPER_ADMIN_LOGIN_API,
        method: "POST",
        body: data,
      }),
    }),
    signup: builder.mutation({
      query: (data: { email: string; password: string; name: string }) => ({
        url: SIGNUP_API,
        method: "POST",
        body: data,
      }),
    }),
    logoutUser: builder.mutation({
      query: (userId: string) => ({
        url: `${LOGOUT_API}/${userId}`,
        method: "POST",
      }),
    }),
    getAllroutes: builder.mutation({
      query: () => ({
        url: GET_ALL_ROUTES_API,
        method: "GET",
      }),
    }),
    validateToken: builder.query({
      query: () => ({
        url: VALIDATE_TOKEN,
        method: "GET",
      }),
      transformErrorResponse: (response: { status: number; data: any }) => {
        return {
          status: response.status,
          message: response.data?.message || "Authentication failed",
          isAuthError: response.status === 403 || response.status === 401,
        };
      },
    }),
    sendEmail: builder.mutation<any, { email: string }>({
      query: (data) => ({
        url: SEND_EMAIL_API,
        method: "POST",
        body: data,
      }),
    }),
    resetPasswordWithToken: builder.mutation<
      any,
      { token: string; password: string }
    >({
      query: (data) => ({
        url: RESET_PASSWORD_WITH_TOKEN_API,
        method: "POST",
        body: data,
      }),
    }),
    generateImpersonationLink: builder.mutation<any, number>({
      query: (targetUserId) => ({
        url: `${IMPERSONATION_LINK_API}/${targetUserId}`,
        method: "POST",
      }),
    }),
    exchangeImpersonation: builder.mutation<any, { code: string }>({
      query: (data) => ({
        url: IMPERSONATION_EXCHANGE_API,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutUserMutation,
  useSuperAdminLoginMutation,
  useGetAllroutesMutation,
  useValidateTokenQuery,
  useSendEmailMutation,
  useResetPasswordWithTokenMutation,
  useGenerateImpersonationLinkMutation,
  useExchangeImpersonationMutation,
} = authApiService;
