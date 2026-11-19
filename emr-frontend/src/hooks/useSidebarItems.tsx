import { useLocation, matchPath, useParams } from "react-router-dom";
import {
  SIDEBAR_ITEMS,
  PATIENT_PROFILE_SIDEBAR,
  SidebarItem,
  User,
} from "@/config/sidebarConfig";
import { usePermissionCheck } from "./usePermission";
import { useMemo } from "react";

export const useSidebarConfig = (user?: User) => {
  const location = useLocation();
  const { patientId } = useParams();

  const isPatientRoute = matchPath(
    { path: "/patient/:patientId/*", end: false },
    location.pathname
  );

  const filterItems = (items: SidebarItem[]): SidebarItem[] => {
    return items
      .map((item) => {
        const hasAccess = usePermissionCheck(item.permissionKey || null);

        if (item.children && item.children.length > 0) {
          const filteredChildren = filterItems(item.children);
          return filteredChildren.length
            ? { ...item, children: filteredChildren }
            : null;
        }
        if (!item.permissionKey || hasAccess) {
          return item;
        }

        return null;
      })
      .filter(Boolean) as SidebarItem[];
  };

  const sidebar = useMemo(() => {
    if (isPatientRoute && patientId) {
      return PATIENT_PROFILE_SIDEBAR(patientId, user?.role.name);
    }
    if (user) return SIDEBAR_ITEMS[user.role.name] || [];
    return [];
  }, [isPatientRoute, patientId, user]);

  return filterItems(sidebar);
};
