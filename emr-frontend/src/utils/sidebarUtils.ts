import { SidebarItem } from "@/config/sidebarConfig";

/**
 * Finds the active sidebar key based on current path
 * @param pathname Current route path
 * @param sidebarItems Menu items to check against
 * @returns Key of the active sidebar item
 */
export const getActiveKey = (
  pathname: string,
  sidebarItems: SidebarItem[]
): string => {
  // Loop through all items\

  for (const item of sidebarItems) {
    // Check explicit active route list first
    if (item.activeroutes?.some((route) => pathname.startsWith(route))) {
      return item.key;
    }

    // Fallback: Check if current path starts with item key
    if (pathname.startsWith(item.key)) {
      return item.key;
    }
  }

  // Return first item key if no match found
  return sidebarItems.length > 0 ? sidebarItems[0].key : "";
};
