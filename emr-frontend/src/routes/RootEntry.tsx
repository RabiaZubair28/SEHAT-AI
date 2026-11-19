import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";
import getDefaultRouteForRole from "@/utils/helpers/getDefaultRouteForRole";
import Loader from "@/components/shared/Loader";

const Landing = lazy(() => import("@/pages/Landing"));

/**
 * Public entry point for "/":
 * - logged-in admins (admin / super-admin / facility-incharge / head-office)
 *   are stored in authAdmin and sent to the admin dashboard
 * - logged-in clinical users are stored in authUser and sent to their role's
 *   default route
 * - logged-out visitors see the marketing Landing page
 */
const RootEntry = () => {
  const admin = useSelector((state: RootState) => state.authAdmin.admin);
  const user = useSelector((state: RootState) => state.authUser.user);

  if (admin) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  if (user) {
    return <Navigate to={getDefaultRouteForRole(user?.role?.name)} replace />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Landing />
    </Suspense>
  );
};

export default RootEntry;
