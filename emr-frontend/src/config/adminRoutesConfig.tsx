import { lazy } from "react";
import { ROUTES } from "@/data/routes";
import { Roles } from "@/data/types";
import { Navigate } from "react-router-dom";

// Lazy-loaded components
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Facilites = lazy(() => import("@/pages/admin/Facilities"));
const AddFacilities = lazy(() => import("@/pages/admin/AddFacilities"));
const Permissions = lazy(() => import("@/pages/admin/Permissions"));
const UserServices = lazy(() => import("@/pages/admin/UserServices"));
const PendingQueueAdmin = lazy(() => import("@/pages/admin/PendingQueueAdmin"));
const Referral = lazy(() => import("@/pages/Referrals"));
const AppLayoutPage = lazy(() => import("@/pages/AppLayout"));
const ApplyLeave = lazy(() => import("@/features/admin/applyLeave"));
const StockManagement = lazy(() => import("@/pages/admin/StockManagement"));
const NewMedicineBatchRequest = lazy(
  () => import("@/features/admin/stockmanagement/newBatchesRequest/index"),
);
const EditMedicineBatch = lazy(
  () => import("@/features/admin/stockmanagement/editBatch/index"),
);
const RequestedCommoditiesPage = lazy(
  () => import("@/pages/RequestedCommoditiesPage"),
);
const RequestedCommoditiesDetails = lazy(
  () =>
    import(
      "@/features/medicine-commodities/requested-medicine-commodities/components/RequestedCommoditiesDetails"
    ),
);
const ImmunisationTable = lazy(
  () => import("@/features/admin/immunisation/index"),
);

const AuditLogsPage = lazy(() => import("@/pages/admin/AuditLogs"));
const FacilityAttendance = lazy(
  () => import("@/pages/admin/FacilityAttendance"),
);
const AdminReportsPage = lazy(() => import("@/pages/admin/AdminReports"));

// Define the structure of admin routes
interface AdminRoute {
  path?: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  index?: boolean;
  children?: AdminRoute[];
}

interface AdminRouteConfig {
  path: string;
  element: React.ComponentType<any>;
  roles: Roles[];
  children?: AdminRoute[];
}

// Define route configuration array
export const adminRouteConfig: AdminRouteConfig[] = [
  {
    path: ROUTES.ADMIN,
    element: AppLayoutPage,
    roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE, Roles.HEAD_OFFICE],
    children: [
      {
        index: true,
        element: () => <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE, Roles.HEAD_OFFICE],
      },
      {
        path: ROUTES.ADMIN,
        element: Dashboard,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE, Roles.HEAD_OFFICE],
      },
      {
        path: ROUTES.ADMIN_DASHBOARD,
        element: Dashboard,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE, Roles.HEAD_OFFICE],
      },
      {
        path: ROUTES.ADMIN_USERS,
        element: UserManagement,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_USER_SERVICES,
        element: UserServices,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_FACILITIES,
        element: Facilites,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN],
      },
      {
        path: ROUTES.ADMIN_FACILITIES_ADD,
        element: AddFacilities,
        roles: [Roles.SUPER_ADMIN],
      },
      {
        path: ROUTES.ADMIN_PERMISSIONS,
        element: Permissions,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN],
      },

      {
        path: ROUTES.ADMIN_STOCK_MANAGEMENT,
        element: StockManagement,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_STOCK_MANAGEMENT_NEW_REQUEST,
        element: NewMedicineBatchRequest,
        roles: [Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_STOCK_MANAGEMENT_EDIT,
        element: EditMedicineBatch,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_COMMODITY_REQUESTS,
        element: RequestedCommoditiesPage,
        roles: [Roles.FACILITY_INCHARGE],
      },
      {
        path: `${ROUTES.ADMIN_COMMODITY_REQUESTS}/:requestId/${ROUTES.REQUESTED_MEDICINES_DETAILS}`,
        element: RequestedCommoditiesDetails,
        roles: [Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.AUDIT_LOGS,
        element: AuditLogsPage,
        roles: [Roles.SUPER_ADMIN],
      },
      {
        path: ROUTES.ADMIN_PENDING,
        element: PendingQueueAdmin,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_REFERRAL,
        element: Referral,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_APPLY_LEAVE,
        element: ApplyLeave,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.FACILITY_ATTENDANCE,
        element: FacilityAttendance,
        roles: [Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.IMMUNISATION,
        element: ImmunisationTable,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE],
      },
      {
        path: ROUTES.ADMIN_REPORTS,
        element: AdminReportsPage,
        roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.FACILITY_INCHARGE, Roles.HEAD_OFFICE],
      },
    ],
  },
];
