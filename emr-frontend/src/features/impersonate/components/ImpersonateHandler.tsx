import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useExchangeImpersonationMutation } from "@/features/auth/services/authApiServices";
import { setUserCredentials } from "@/redux/store/slices/authUserSlice";
import { setAdminCredentials, setServices } from "@/redux/store/slices/authAdminSlice";
import { resetStore } from "@/redux/store/actions";
import { ROUTES } from "@/data/routes";
import { Roles } from "@/data/types";
import { IMPERSONATION_MESSAGES } from "@/data/messages";
import getDefaultRouteForRole from "@/utils/helpers/getDefaultRouteForRole";
import { loadRoutes } from "@/utils/loadRoutes";
import { useGlobalNotification } from "@/hooks/useNotification";
import Loading from "@/components/shared/Loader";

const ImpersonateHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();
  const code = searchParams.get("code");
  const [exchange, { isLoading }] = useExchangeImpersonationMutation();

  // One-shot guard: React Strict Mode fires effects twice in development.
  // Without this guard the exchange would run twice — the second call would
  // find the target's access_token already overwritten and fail guard validation.
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    // Remove the credential from the URL immediately — before the exchange
    // request — so it never lingers in the address bar or browser history.
    window.history.replaceState({}, document.title, ROUTES.IMPERSONATE);

    if (!exchanged.current) {
      exchanged.current = true;
      performExchange(code);
    }
  }, [code, exchange, dispatch, navigate]);

  const performExchange = async (code: string) => {
    try {
      const response = await exchange({ code }).unwrap();

      if (response?.user?.role?.name) {
        const isAdmin = [
          Roles.ADMIN,
          Roles.SUPER_ADMIN,
          Roles.FACILITY_INCHARGE,
          Roles.HEAD_OFFICE,
        ].includes(response.user.role.name as Roles);

        // Drop the previous session's state and API caches before switching identity.
        dispatch(resetStore());

        if (isAdmin) {
          dispatch(setAdminCredentials(response.user));
          dispatch(setServices(response.services));
        } else {
          dispatch(setUserCredentials(response.user));
        }

        const defaultRoute = isAdmin
          ? ROUTES.ADMIN_DASHBOARD
          : getDefaultRouteForRole(response.user.role.name);

        navigate(defaultRoute || ROUTES.LOGIN, { replace: true });
        loadRoutes();
      }
    } catch (error: any) {
      showNotification(
        IMPERSONATION_MESSAGES.FAILURE.type,
        error?.data?.error?.data?.error || IMPERSONATION_MESSAGES.FAILURE.title,
        error?.data?.error?.data?.message ||
          IMPERSONATION_MESSAGES.FAILURE.description,
      );
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return isLoading ? <Loading /> : null;
};

export default ImpersonateHandler;
