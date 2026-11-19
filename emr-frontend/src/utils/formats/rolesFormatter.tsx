import { Role } from "@/services/roleApiServices";
import { Roles } from "@/data/types";

export const ROLE_LABEL_MAP: Record<Roles, string> = {
  [Roles.SUPER_ADMIN]: "Super Admin",
  [Roles.ADMIN]: "Admin",
  [Roles.FACILITY_INCHARGE]: "Facility Incharge",
  [Roles.FRONT_DESK]: "Registration Clerk",
  [Roles.MEDICAL_OFFICER_MALE]: "Medical Officer Male",
  [Roles.MEDICAL_OFFICER_FEMALE]: "Medical Officer Female",
  [Roles.VACCINATOR]: "Vaccinator",
  [Roles.LHV]: "Lhv",
  [Roles.DISPENSER]: "Dispenser",
  [Roles.SBA]: "Sba",
  [Roles.PAEDS]: "Paeds",
  [Roles.TELEHEALTH_CONSULTANT]: "Telehealth Consultant",
  [Roles.HEAD_OFFICE]: "Head Office",
};

export const formatRolesToOptions = (roles: Role[] | undefined) => {
  if (!roles) return [];

  return roles
    .filter((r) => r.name !== Roles.SUPER_ADMIN)
    .map((role) => ({
      label: formatRoleName(role.name as Roles),
      value: role.id.toString(),
    }));
};

export const formatRoleName = (name: Roles | undefined | null): string => {
  if (!name) return "Doctor";

  return (
    ROLE_LABEL_MAP[name] ??
    name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};
