import React from "react";
import {
  SearchOutlined,
  SettingOutlined,
  DashboardOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarsOutlined,
  FormOutlined,
  FileSearchOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  HeartOutlined,
  BranchesOutlined,
  UserOutlined,
  BookOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import { ROUTES } from "@/data/routes";
import { Roles, UserRole } from "@/data/types";
import { ROUTE_KEYS } from "@/data/routeKey";

export interface PermissionPayload {
  name: string;
  route: string;
  method: string;
  module: string;
  description: string;
}

export interface Permission {
  reduce(
    arg0: (acc: Record<string, boolean>, perm: any) => Record<string, boolean>,
    arg1: {},
  ): unknown;
  length: any;
  id: number;
  payload: PermissionPayload[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  id: number;
  permission: Permission;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: number;
  name: string;
}

export interface Facility {
  id: number;
  name: string;
  code: number;
  uc_id: number,
  facility_type: string;
  managed_by: string;
  is_24_7: boolean;
  bmu: boolean;
  otp: boolean;
  nsc: boolean;
  lat: number;
  long: number;
  created_at: string;
  updated_at: string;
  district: District;
}

export interface Role {
  id: number;
  name: UserRole;
  description: string;
  created_at: string;
  updated_at: string;
  avatar: string | null;
}

export interface Service {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  facility: Facility;
  personalInfo: any;
  userPermissions: UserPermissions;
  services?: Service[] | null;
  status: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SidebarItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: SidebarItem[];
  activeroutes?: string[];
  permissionKey?: string;
}

export const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  [Roles.SUPER_ADMIN]: [
    {
      key: ROUTES.ADMIN_DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: ROUTES.ADMIN_USERS,
      icon: <TeamOutlined />,
      label: "Users Management",
    },
    {
      key: ROUTES.ADMIN_FACILITIES,
      icon: <MedicineBoxOutlined />,
      label: "Facilities",
    },
    {
      key: ROUTES.ADMIN_PERMISSIONS,
      icon: <SettingOutlined />,
      label: "Access Management",
    },
    {
      key: ROUTES.ADMIN_USER_SERVICES,
      icon: <TeamOutlined />,
      label: "Users Services",
    },
    {
      key: ROUTES.ADMIN_STOCK_MANAGEMENT,
      icon: <MedicineBoxOutlined />,
      label: "Medicine Batches",
    },
    {
      key: ROUTES.ADMIN_PENDING,
      icon: <BarsOutlined />,
      label: "Appointments Tracker",
    },
    {
      key: ROUTES.ADMIN_APPLY_LEAVE,
      icon: <FormOutlined />,
      label: "Apply for Leave",
    },
    {
      key: ROUTES.AUDIT_LOGS,
      icon: <FileSearchOutlined />,
      label: "Audit Logs",
    },
    {
      key: ROUTES.ADMIN_REPORTS,
      icon: <DatabaseOutlined />,
      label: "Reports",
    },
  ],

  [Roles.HEAD_OFFICE]: [
    {
      key: ROUTES.ADMIN_DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },

    {
      key: ROUTES.ADMIN_REPORTS,
      icon: <DatabaseOutlined />,
      label: "Reports",
    },
  ],

  [Roles.ADMIN]: [
    {
      key: ROUTES.ADMIN_DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: ROUTES.ADMIN_USERS,
      icon: <TeamOutlined />,
      label: "Users Management",
    },
    {
      key: ROUTES.ADMIN_FACILITIES,
      icon: <MedicineBoxOutlined />,
      label: "Facilities",
    },
    {
      key: ROUTES.ADMIN_PERMISSIONS,
      icon: <SettingOutlined />,
      label: "Access Management",
      permissionKey: ROUTE_KEYS.TEST,
    },
    {
      key: ROUTES.ADMIN_USER_SERVICES,
      icon: <TeamOutlined />,
      label: "Users Services",
    },
    {
      key: ROUTES.ADMIN_STOCK_MANAGEMENT,
      icon: <MedicineBoxOutlined />,
      label: "Medicine Batches",
    },
    {
      key: ROUTES.ADMIN_PENDING,
      icon: <BarsOutlined />,
      label: "Appointments Tracker",
    },
    {
      key: ROUTES.ADMIN_APPLY_LEAVE,
      icon: <FormOutlined />,
      label: "Apply for Leave",
    },
    {
      key: ROUTES.ADMIN_REPORTS,
      icon: <DatabaseOutlined />,
      label: "Reports",
    },
  ],

  [Roles.FACILITY_INCHARGE]: [
    {
      key: ROUTES.ADMIN_DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: ROUTES.ADMIN_USERS,
      icon: <TeamOutlined />,
      label: "Users Management",
    },
    {
      key: ROUTES.ADMIN_USER_SERVICES,
      icon: <TeamOutlined />,
      label: "Users Services",
    },
    {
      key: ROUTES.ADMIN_STOCK_MANAGEMENT,
      icon: <MedicineBoxOutlined />,
      label: "Medicine Batches",
    },
    {
      key: ROUTES.ADMIN_COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.ADMIN_PENDING,
      icon: <BarsOutlined />,
      label: "Appointments Tracker",
    },
    {
      key: ROUTES.ADMIN_APPLY_LEAVE,
      icon: <FormOutlined />,
      label: "Apply for Leave",
    },
    {
      key: ROUTES.IMMUNISATION,
      icon: <SafetyCertificateOutlined />,
      label: "Immunisation",
    },
    {
      key: ROUTES.FACILITY_ATTENDANCE,
      icon: <DashboardOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.ADMIN_REPORTS,
      icon: <DatabaseOutlined />,
      label: "Reports",
    },
  ],

  [Roles.FRONT_DESK]: [
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.DISPENSER]: [
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.MEDICINE_BATCHES,
      icon: <MedicineBoxOutlined />,
      label: "Medicine Batches",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.VACCINATOR]: [
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },

    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },

    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.MEDICAL_OFFICER_MALE]: [
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.NUTRITION_REVIEWS,
      icon: <AuditOutlined />,
      label: "Nutrition Plan Reviews",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.MEDICAL_OFFICER_FEMALE]: [
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.NUTRITION_REVIEWS,
      icon: <AuditOutlined />,
      label: "Nutrition Plan Reviews",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.PAEDS]: [
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.LHV]: [
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
  ],

  [Roles.SBA]: [
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },
    {
      key: ROUTES.SEARCH_PATIENT,
      icon: <SearchOutlined />,
      label: "Register Patient",
      activeroutes: [ROUTES.SEARCH_PATIENT, ROUTES.PATIENT_REGISTER],
    },

    {
      key: ROUTES.COMMODITY_REQUESTS,
      icon: <MedicineBoxOutlined />,
      label: "Commodity Request",
    },
    {
      key: ROUTES.INVENTORY,
      icon: <DatabaseOutlined />,
      label: "Inventory",
    },
    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
    {
      key: ROUTES.AKUH_GUIDELINES,
      icon: <BookOutlined />,
      label: "AKUH Guidelines",
    },
  ],

  [Roles.TELEHEALTH_CONSULTANT]: [
    {
      key: ROUTES.PATIENT_QUEUE,
      icon: <BarsOutlined />,
      label: "Patient's Queue",
    },

    {
      key: ROUTES.ATTENDANCE,
      icon: <CalendarOutlined />,
      label: "Attendance",
    },
    {
      key: ROUTES.LEAVE,
      icon: <ScheduleOutlined />,
      label: "Leaves",
    },
  ],
};

export const PATIENT_PROFILE_SIDEBAR = (
  patientId: string,
  userRole?: UserRole,
): SidebarItem[] => {
  const allTabs = [
    {
      key: `${ROUTES.PATIENT_MODULE}/${patientId}/${ROUTES.PATIENT_PROFILE}`,
      icon: <UserOutlined />,
      label: "Patient Profile",
    },
    {
      key: `${ROUTES.PATIENT_MODULE}/${patientId}/${ROUTES.VITALS}`,
      icon: <HeartOutlined />,
      label: "Vitals",
    },
    {
      key: `${ROUTES.PATIENT_MODULE}/${patientId}/${ROUTES.SERVICES}`,
      icon: <MedicineBoxOutlined />,
      label: "Services",
    },
    {
      key: `${ROUTES.PATIENT_MODULE}/${patientId}/${ROUTES.PATIENT_PROFILE_REFFERAL}`,
      icon: <BranchesOutlined />,
      label: "Referral",
    },
  ];

  switch (userRole) {
    case Roles.FRONT_DESK:
      return [allTabs[0]];
    case Roles.VACCINATOR:
      return [allTabs[0], allTabs[2]];

    case Roles.DISPENSER:
      return [allTabs[0], allTabs[2], allTabs[3]];
    case Roles.MEDICAL_OFFICER_MALE:
    case Roles.MEDICAL_OFFICER_FEMALE:
    case Roles.LHV:
    case Roles.SBA:
    case Roles.PAEDS:
      return allTabs;

    default:
      return [];
  }
};
