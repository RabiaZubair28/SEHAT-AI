// src/hooks/usePermissionCheck.ts
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { hasPermission } from "@/utils/permissionUtils";
import { Roles } from "@/data/types";
import { useLocation } from "react-router-dom";
import { ROUTES } from "@/data/routes";

export function usePermissionCheck(routeKey: string | null) {
  if (!routeKey) {
    // console.error("No routeKey provided. Permission check cannot proceed.");
    return false;
  }

  const location = useLocation();
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const permissions = useSelector((state: RootState) =>
    isAdmin
      ? state.authAdmin.adminPermissions?.payload
      : state.authUser.userPermissions?.payload
  );

  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user
  );

  const routes = useSelector((state: RootState) => state.route);

  // ✅ Super Admin bypass
  if (user?.role?.name === Roles.SUPER_ADMIN) {
    return true;
  }

  if (!permissions || permissions.length === 0) {
    // console.warn("User has no permissions. Access denied by default.");
    return false;
  }

  if (!routes[routeKey]) {
    // console.log(`Route for key "${routeKey}" not found.`);
    return false;
  }

  return hasPermission(
    permissions,
    routes[routeKey].route,
    routes[routeKey].method
  );
}
