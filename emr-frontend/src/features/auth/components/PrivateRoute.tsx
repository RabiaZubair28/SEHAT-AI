import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";
import { UserRole } from "@/data/types";
import { useLogout } from "@/hooks/useLogout";
import React from "react";
import Loader from "@/components/shared/Loader";

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

// const NotFoundPage = lazy(() => import("@/pages/NotFound"));

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  roles,
}) => {
  const location = useLocation();
  const { handleLogout, isValidateLoading, isLogoutLoading } = useLogout();

  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const regularUser = useSelector((state: RootState) => state.authUser.user);
  const hasLoggedOutRef = React.useRef(false);

  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const user = isAdmin ? adminUser : regularUser;
  const validatedRole = user?.role?.name;

  const shouldLogout = !user;
  const shouldRedirectTo401 =
    roles && (!validatedRole || !roles.includes(validatedRole));

  React.useEffect(() => {
    if (shouldLogout && !hasLoggedOutRef.current) {
      hasLoggedOutRef.current = true;
      handleLogout();
    }
  }, [shouldLogout, handleLogout]);

  if (isValidateLoading || isLogoutLoading) {
    return <Loader />;
  }

  // A super admin reset this account's password: nothing else is reachable
  // until the user sets their own.
  if (user?.must_change_password) {
    return (
      <Navigate
        to={isAdmin ? ROUTES.ADMIN_CHANGE_PASSWORD : ROUTES.CHANGE_PASSWORD}
        replace
      />
    );
  }

  if (shouldRedirectTo401 && user) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <>{children}</>;
};
