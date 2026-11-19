import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useLogoutUserMutation,
  useValidateTokenQuery,
} from "@/features/auth/services/authApiServices";
import { resetStore } from "@/redux/store/actions";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";
import { socketService } from "@/services/socketServices";
import { useEffect, useMemo } from "react";
import { useGlobalNotification } from "@/hooks/useNotification";

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const showNotification = useGlobalNotification();

  const admin = useSelector((state: RootState) => state.authAdmin.admin);
  const user = useSelector((state: RootState) => state.authUser.user);
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const currentUser = isAdmin ? admin : user;

  const [logoutUser, { isLoading: isLogoutLoading }] = useLogoutUserMutation();

  // Validate token only if no user in store
  const {
    data: validateData,
    isLoading: isValidateLoading,
    isError: isValidateError,
  } = useValidateTokenQuery(undefined, {
    skip: !!currentUser, // skip if we already have a user
  });

  // compute userId when ready
  const userId = useMemo(
    () => currentUser?.id || validateData?.data?.sub,
    [currentUser, validateData],
  );

  const notifyLogoutError = () =>
    showNotification(
      "error",
      "Unable to log out",
      "Something went wrong. Please try again.",
    );

  // Clears all client-side auth/session state and redirects to the right login page.
  const resetSessionAndRedirect = () => {
    socketService?.disconnect();

    // Resets every slice (auth, patient, form data, follow-ups, all API caches).
    dispatch(resetStore());

    const target = isAdmin ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
    navigate(target, { replace: true });
  };

  const handleLogout = async () => {
    console.log("🔹 handleLogout triggered, userId:", userId);

    // if validateData is still loading, wait for it
    if (isValidateLoading) return;

    if (!userId) {
      resetSessionAndRedirect();
      return;
    }

    try {
      await logoutUser(userId.toString()).unwrap();
      resetSessionAndRedirect();
    } catch (error: any) {
      console.error("❌ Logout API failed:", error);
      if (
        error?.status === 403 ||
        error?.status === 401 ||
        error?.status === 500
      ) {
        console.error("Logout failed:", error);
        dispatch(resetStore());
        window.location.href = isAdmin ? ROUTES.ADMIN_LOGIN : ROUTES.LOGIN;
      } else {
        notifyLogoutError();
      }
    }
  };

  // ✅ Automatically logout when token validation fails
  useEffect(() => {
    // Token invalid/missing entirely — no point calling the logout API, just clear and redirect.
    if (isValidateError) {
      resetSessionAndRedirect();
      return;
    }

    // Token validated but store has no user object — go through the full logout flow.
    if (validateData && !currentUser) {
      handleLogout();
    }
  }, [validateData, isValidateError, currentUser]);

  return { handleLogout, isLogoutLoading, isValidateLoading };
};
