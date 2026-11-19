import { resetStore } from "@/redux/store/actions";
import {
  setUserMustChangePassword,
  setUserToken,
} from "@/redux/store/slices/authUserSlice";
import {
  setAdminMustChangePassword,
  setAdminToken,
} from "@/redux/store/slices/authAdminSlice";
import { PASSWORD_CHANGE_REQUIRED_CODE } from "@/utils/helpers/passwordPolicy";
import {
  BaseQueryApi,
  BaseQueryFn,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query";
import { ROUTES } from "@/data/routes";
import { notification } from "antd";

const MESSAGES = {
  handleMissingReduxState: {
    SESSION_EXPIRED: "Session expired. Please log in again.",
  },
  handleAuthorizationError: {
    TITLE: "Permissions Error",
    FALLBACK: "Permissions error",
    INSUFFICIENT: "Permissions error. Insufficient permissions.",
  },
  handleAuthenticationError: {
    REAUTHENTICATING: {
      type: "info",
      title: "Authentication",
      description: "Re-authenticating...",
    },
    REAUTHENTICATED: {
      type: "success",
      title: "Authentication",
      description: "Re-authenticated",
    },
  },
  handleAuthenticationFailure: {
    TITLE: "Authentication Error",
    FALLBACK: "Authentication error",
    LOGGING_OUT: "Logging out.",
    AUTH_FAILED: "Authentication failed. Please log in again.",
  },
  handleServerError: {
    SERVER_ERROR: "Something went wrong on the server. Please try again later.",
  },
} as const;

const ERROR_NOTIFICATION_DELAY_MS = 3000;

type QueryResult = { data?: any; error?: any; meta?: any };

const openErrorNotification = (message: string, description: string) => {
  notification.error({
    message,
    description,
    placement: "topRight",
  });
};

const openInfoNotification = (message: string, description: string) => {
  notification.info({
    message,
    description,
    placement: "topRight",
  });
};

const openSuccessNotification = (message: string, description: string) => {
  notification.success({
    message,
    description,
    placement: "topRight",
  });
};

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const state: any = getState();
    const token = state.authAdmin?.token || state.authUser?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * Get auth data from Redux state
 */
const getReduxAuthState = (api: any, isAdmin: boolean) => {
  const state = api.getState();
  return isAdmin ? state.authAdmin?.admin : state.authUser?.user;
};

/**
 * Dispatch logout action based on user type
 */
const performLogout = async (
  api: any,
  isAdmin: boolean,
  userId?: string | number,
) => {
  if (userId) {
    await baseQuery(
      {
        url: `auth/logout/${userId}`,
        method: "POST",
      },
      api,
      {},
    );
  }

  api.dispatch(resetStore());
  window.location.href = isAdmin ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
};

/**
 * Main baseQuery wrapper
 */
export const baseQueryWithAuthCheck: BaseQueryFn = async (
  args,
  api,
  extraOptions,
) => {
  const path = window.location.pathname;
  const isAdmin = path.includes(ROUTES.ADMIN);

  const authState = getReduxAuthState(api, isAdmin);
  if (!authState && !path.includes("/signup")) {
    return await handleMissingReduxState(api, extraOptions, isAdmin);
  }

  // Actual API request
  let result = await baseQuery(args, api, extraOptions);

  switch (result.error?.status) {
    case 401:
      return await handleAuthenticationError({
        api,
        args,
        extraOptions,
        isAdmin,
        result,
        authState,
      });
    case 403:
      if (isPasswordChangeRequired(result)) {
        return handlePasswordChangeRequired({ api, isAdmin, result });
      }
      return handleAuthorizationError({ result });
    case 500:
      return handleServerError({ result });
    default:
      return handleDefault({ result });
  }
};

/**
 * Pre-request guard: redux state missing → validate token, then logout
 */
const handleMissingReduxState = async (
  api: BaseQueryApi,
  extraOptions: {},
  isAdmin: boolean,
): Promise<QueryResult> => {
  const validationResult = await baseQuery(
    { url: "auth/validate-token", method: "GET" },
    api,
    extraOptions,
  );

  const data = validationResult.data as { data?: { sub?: string | number } };
  const userId = data?.data?.sub?.toString();

  await performLogout(api, isAdmin, userId);

  return {
    error: {
      status: 401,
      data: { message: MESSAGES.handleMissingReduxState.SESSION_EXPIRED },
    },
  };
};

type HandleCtx = {
  result: QueryResult;
};

type HandlePasswordChangeRequiredCtx = HandleCtx & {
  api: BaseQueryApi;
  isAdmin: boolean;
};

const isPasswordChangeRequired = (result: QueryResult): boolean =>
  (result.error?.data as { code?: string } | undefined)?.code ===
  PASSWORD_CHANGE_REQUIRED_CODE;

// 403 because a super admin reset the password: flag the stored user so
// PrivateRoute sends them to the change password page.
const handlePasswordChangeRequired = (
  ctx: HandlePasswordChangeRequiredCtx,
): QueryResult => {
  const { api, isAdmin, result } = ctx;

  api.dispatch(
    isAdmin ? setAdminMustChangePassword(true) : setUserMustChangePassword(true),
  );

  return { error: result.error, meta: result.meta };
};

// 403
const handleAuthorizationError = (ctx: HandleCtx): QueryResult => {
  const { result } = ctx;

  const errText =
    result?.error?.status ?? MESSAGES.handleAuthorizationError.FALLBACK;
  const msgText = result?.error?.data?.message;

  openErrorNotification(
    MESSAGES.handleAuthorizationError.TITLE,
    `${errText}.${msgText ? ` ${msgText}.` : ""}`,
  );

  if (result.error) {
    return {
      error: result.error,
      data: result.error?.data,
      meta: result?.meta,
    };
  }

  return {
    error: {
      status: 403,
      data: {
        message: MESSAGES.handleAuthorizationError.INSUFFICIENT,
      },
    },
  };
};

type HandleAuthenticationErrorCtx = {
  api: BaseQueryApi;
  args: any;
  extraOptions: {};
  isAdmin: boolean;
  result: QueryResult;
  authState?: { id?: string | number };
};

const handleAuthenticationError = async (
  ctx: HandleAuthenticationErrorCtx,
): Promise<QueryResult> => {
  const { api, args, extraOptions, isAdmin, authState, result } = ctx;

  openInfoNotification(
    MESSAGES.handleAuthenticationError.REAUTHENTICATING.title,
    MESSAGES.handleAuthenticationError.REAUTHENTICATING.description,
  );

  try {
    const refreshUrl = isAdmin ? "/auth/admin/refresh" : "/auth/refresh";

    const refreshResponse = await baseQuery(
      { url: refreshUrl, method: "POST" },
      api,
      extraOptions,
    );

    const newToken = (refreshResponse.data as any)?.access_token;

    if (newToken) {
      api.dispatch(isAdmin ? setAdminToken(newToken) : setUserToken(newToken));

      openSuccessNotification(
        MESSAGES.handleAuthenticationError.REAUTHENTICATED.title,
        MESSAGES.handleAuthenticationError.REAUTHENTICATED.description,
      );

      // retry original request
      const retried = await baseQuery(args, api, extraOptions);

      if (retried.error?.status === 401 || retried.error?.status === 403) {
        return { error: retried.error, meta: retried.meta };
      }

      if (retried.error?.status === 500) {
        return handleServerError({ result: retried });
      }

      return handleDefault({ result: retried });
    }

    // Unknown state
    return await handleAuthenticationFailure({
      result,
      api,
      isAdmin,
      authState,
    });
  } catch {
    return await handleAuthenticationFailure({
      result,
      api,
      isAdmin,
      authState,
    });
  }
};

type HandleAuthenticationFailureCtx = {
  result: QueryResult;
  api: BaseQueryApi;
  isAdmin: boolean;
  authState?: { id?: string | number };
};

const handleAuthenticationFailure = async (
  ctx: HandleAuthenticationFailureCtx,
): Promise<QueryResult> => {
  const { result, api, isAdmin, authState } = ctx;

  const errData = result?.error?.data ?? {};
  const errText =
    errData?.error ?? MESSAGES.handleAuthenticationFailure.FALLBACK;
  const msgText = errData?.message;

  openErrorNotification(
    MESSAGES.handleAuthenticationFailure.TITLE,
    `${errText}. ${msgText ? `${msgText}. ` : ""}${MESSAGES.handleAuthenticationFailure.LOGGING_OUT}.`,
  );
  await new Promise((resolve) =>
    setTimeout(resolve, ERROR_NOTIFICATION_DELAY_MS),
  );
  await performLogout(api, isAdmin, authState?.id);

  return {
    error: {
      status: 401,
      data: { message: MESSAGES.handleAuthenticationFailure.AUTH_FAILED },
    },
  };
};

// 500
const handleServerError = (ctx: HandleCtx): QueryResult => {
  const { result } = ctx;

  return {
    error: {
      status: result.error.status,
      data: {
        message: MESSAGES.handleServerError.SERVER_ERROR,
      },
    },
  };
};

const handleDefault = (ctx: HandleCtx): QueryResult => {
  const { result } = ctx;

  if (result.error) {
    return { error: result.error, meta: result.meta };
  }
  return { data: result.data, meta: result.meta };
};
