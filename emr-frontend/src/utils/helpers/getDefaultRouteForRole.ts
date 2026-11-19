import { ROUTES } from "@/data/routes";
import { UserRole } from "@/data/types";
import { SIDEBAR_ITEMS, SidebarItem } from "@/config/sidebarConfig";

const findFirstNavigableRoute = (items: SidebarItem[] = []): string | null => {
  for (const item of items) {
    if (item.key) {
      return item.key;
    }

    if (item.children?.length) {
      const childRoute = findFirstNavigableRoute(item.children);
      if (childRoute) {
        return childRoute;
      }
    }
  }

  return null;
};

export const getDefaultRouteForRole = (role?: UserRole | null): string => {
  if (!role) {
    return ROUTES.SEARCH_PATIENT;
  }

  const sidebarItems = SIDEBAR_ITEMS[role] || [];
  return findFirstNavigableRoute(sidebarItems) || ROUTES.SEARCH_PATIENT;
};

export default getDefaultRouteForRole;
