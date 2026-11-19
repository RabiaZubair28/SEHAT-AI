import { useAuthUser } from "./useAuthUser";
import { Roles } from "@/data/types";

export function useUserRole() {
  const { user } = useAuthUser();
  const roleName = user?.role?.name as Roles | undefined;

  return {
    roleName,
    isSuperAdmin: roleName === Roles.SUPER_ADMIN,
    isAdmin: roleName === Roles.ADMIN,
    isFacilityIncharge: roleName === Roles.FACILITY_INCHARGE,
    isHeadOffice: roleName === Roles.HEAD_OFFICE,
    isDispenser: roleName === Roles.DISPENSER,
    isFrontDesk: roleName === Roles.FRONT_DESK,
    hasRole: (...roles: Roles[]) => roles.includes(roleName as Roles),
    isAdminGroup: [
      Roles.SUPER_ADMIN,
      Roles.ADMIN,
      Roles.FACILITY_INCHARGE,
      Roles.HEAD_OFFICE,
    ].includes(roleName as Roles),
  };
}
