import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";

export interface VisitsByService {
  OPD: number;
  ANC: number;
  PNC: number;
  Nutrition: number;
  FamilyPlanning: number;
  Immunisation: number;
  MedicineDispensing: number;
  Delivery: number;
}

export interface LivePatientFlow {
  totalVisitsToday: number;
  visitsByServiceToday: VisitsByService;
  visitsCompletedToday: number;
  currentlyInQueue: number;
  unassignedPatients: number;
}

export interface MonthlyPatientFlow {
  totalVisitsThisMonth: number;
  visitsByServiceThisMonth: VisitsByService;
  visitsCompletedThisMonth: number;
  newRegistrationsThisMonth: number;
  avgDailyVisitsThisMonth: number;
}

export interface StaffRoleDetail {
  count: number;
  detail: string | null;
}

export interface StaffAttendanceRecord {
  userId: number;
  name: string;
  role: string;
  facilityName?: string;
  attendanceStatus: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface StaffAttendancePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search: string | null;
}

export interface StaffAttendanceCollection {
  records: StaffAttendanceRecord[];
  pagination: StaffAttendancePagination;
}

export interface StaffAttendance {
  totalFacilityStaff: number;
  staffByRole: {
    Doctors: StaffRoleDetail;
  };
  allUsers: StaffAttendanceCollection;
  checkedInUsers: StaffAttendanceCollection;
  checkedOutUsers: StaffAttendanceCollection;
  checkedInNow: number;
  checkedOutOrAbsent: number;
  checkedInRange: number;
}

export interface DashboardData {
  livePatientFlow: LivePatientFlow;
  monthlyPatientFlow: MonthlyPatientFlow;
  staffAttendance: StaffAttendance;
}

export interface OverallServiceVisits {
  label: string;
  value: number;
}

export interface OverallTotals {
  totalRegistrations: number;
  totalVisits: number;
  totalVisitsCompleted: number;
  totalVisitsByService: OverallServiceVisits[];
}

export interface OverallParams {
  facilityId?: number;
  districtId?: number;
}

export interface DashboardParams {
  date: string;
  facilityId?: number;
  districtId?: number;
  totalFacilityStaffRecordsPage?: number;
  totalFacilityStaffRecordsLimit?: number;
  totalFacilityStaffRecordsSearch?: string;
  checkedInUsersPage?: number;
  checkedInUsersLimit?: number;
  checkedInUsersSearch?: string;
  checkedOutUsersPage?: number;
  checkedOutUsersLimit?: number;
  checkedOutUsersSearch?: string;
}

interface ApiVisitsByService {
  OPD: number;
  ANC: number;
  PNC: number;
  Nutrition: number;
  "Family Planning": number;
  Immunisation: number;
  "Medicine Dispensing": number;
  Delivery: number;
}

interface ApiStaffRoleDetail {
  total?: number;
  count?: number;
  detail: string | null;
}

interface ApiStaffAttendanceCollection {
  records?: StaffAttendanceRecord[];
  pagination?: Partial<StaffAttendancePagination>;
}

interface ApiOverallResponse {
  data: Partial<OverallTotals>;
}

interface ApiDashboardResponse {
  data: {
    patientFlowToday: {
      totalVisitsToday: number;
      visitsByServiceToday: ApiVisitsByService;
      visitsCompletedToday: number;
      currentlyInQueue: number;
      unassignedPatients: number;
    };
    patientFlowMonth: {
      totalVisitsThisMonth: number;
      visitsByServiceThisMonth: ApiVisitsByService;
      visitsCompletedThisMonth: number;
      newRegistrationsThisMonth: number;
      avgDailyVisitsThisMonth: number;
    };
    staffAttendance: {
      totalFacilityStaff: number;
      staffByRole: Record<string, ApiStaffRoleDetail>;
      totalFacilityStaffRecords?: StaffAttendanceRecord[];
      totalFacilityStaffRecordsPagination?: Partial<StaffAttendancePagination>;
      checkedInUsers?: ApiStaffAttendanceCollection;
      checkedOutUsers?: ApiStaffAttendanceCollection;
      checkedInNow: number;
      checkedOutOrAbsent: number;
      checkedInRange?: number;
    };
  };
}

const mapPagination = (
  pagination?: Partial<StaffAttendancePagination>,
): StaffAttendancePagination => ({
  page: pagination?.page ?? 1,
  limit: pagination?.limit ?? 10,
  total: pagination?.total ?? 0,
  totalPages: pagination?.totalPages ?? 1,
  search: pagination?.search ?? null,
});

const mapCollection = (
  records?: StaffAttendanceRecord[],
  pagination?: Partial<StaffAttendancePagination>,
): StaffAttendanceCollection => ({
  records: records ?? [],
  pagination: mapPagination(pagination),
});

export const dashboardApiService = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, DashboardParams>({
      query: (params) => ({
        url: "dashboard",
        method: "GET",
        params: removeEmpty({
          date: params.date,
          facility_id: params.facilityId,
          districtId: params.districtId,
          totalFacilityStaffRecordsPage: params.totalFacilityStaffRecordsPage,
          totalFacilityStaffRecordsLimit: params.totalFacilityStaffRecordsLimit,
          totalFacilityStaffRecordsSearch:
            params.totalFacilityStaffRecordsSearch,
          checkedInUsersPage: params.checkedInUsersPage,
          checkedInUsersLimit: params.checkedInUsersLimit,
          checkedInUsersSearch: params.checkedInUsersSearch,
          checkedOutUsersPage: params.checkedOutUsersPage,
          checkedOutUsersLimit: params.checkedOutUsersLimit,
          checkedOutUsersSearch: params.checkedOutUsersSearch,
        }),
      }),
      transformResponse: (raw: ApiDashboardResponse): DashboardData => {
        const d = raw.data;

        const mapServices = (services: ApiVisitsByService): VisitsByService => ({
          OPD: services.OPD ?? 0,
          ANC: services.ANC ?? 0,
          PNC: services.PNC ?? 0,
          Nutrition: services.Nutrition ?? 0,
          FamilyPlanning: services["Family Planning"] ?? 0,
          Immunisation: services.Immunisation ?? 0,
          MedicineDispensing: services["Medicine Dispensing"] ?? 0,
          Delivery: services.Delivery ?? 0,
        });

        const mapRole = (role?: ApiStaffRoleDetail): StaffRoleDetail => ({
          count: role?.total ?? role?.count ?? 0,
          detail: role?.detail ?? null,
        });

        return {
          livePatientFlow: {
            totalVisitsToday: d.patientFlowToday.totalVisitsToday,
            visitsByServiceToday: mapServices(
              d.patientFlowToday.visitsByServiceToday,
            ),
            visitsCompletedToday: d.patientFlowToday.visitsCompletedToday,
            currentlyInQueue: d.patientFlowToday.currentlyInQueue,
            unassignedPatients: d.patientFlowToday.unassignedPatients,
          },
          monthlyPatientFlow: {
            totalVisitsThisMonth: d.patientFlowMonth.totalVisitsThisMonth,
            visitsByServiceThisMonth: mapServices(
              d.patientFlowMonth.visitsByServiceThisMonth,
            ),
            visitsCompletedThisMonth:
              d.patientFlowMonth.visitsCompletedThisMonth,
            newRegistrationsThisMonth:
              d.patientFlowMonth.newRegistrationsThisMonth,
            avgDailyVisitsThisMonth: d.patientFlowMonth.avgDailyVisitsThisMonth,
          },
          staffAttendance: {
            totalFacilityStaff: d.staffAttendance.totalFacilityStaff,
            staffByRole: {
              Doctors: mapRole(d.staffAttendance.staffByRole.Doctors),
            },
            allUsers: mapCollection(
              d.staffAttendance.totalFacilityStaffRecords,
              d.staffAttendance.totalFacilityStaffRecordsPagination,
            ),
            checkedInUsers: mapCollection(
              d.staffAttendance.checkedInUsers?.records,
              d.staffAttendance.checkedInUsers?.pagination,
            ),
            checkedOutUsers: mapCollection(
              d.staffAttendance.checkedOutUsers?.records,
              d.staffAttendance.checkedOutUsers?.pagination,
            ),
            checkedInNow: d.staffAttendance.checkedInNow,
            checkedOutOrAbsent: d.staffAttendance.checkedOutOrAbsent,
            checkedInRange: d.staffAttendance.checkedInRange ?? 0,
          },
        };
      },
    }),
    getDashboardOverall: builder.query<OverallTotals, OverallParams>({
      query: (params) => ({
        url: "dashboard/overall",
        method: "GET",
        params: removeEmpty({
          facilityId: params.facilityId,
          districtId: params.districtId,
        }),
      }),
      transformResponse: (raw: ApiOverallResponse): OverallTotals => ({
        totalRegistrations: raw.data.totalRegistrations ?? 0,
        totalVisits: raw.data.totalVisits ?? 0,
        totalVisitsCompleted: raw.data.totalVisitsCompleted ?? 0,
        totalVisitsByService: raw.data.totalVisitsByService ?? [],
      }),
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useLazyGetDashboardQuery,
  useGetDashboardOverallQuery,
} = dashboardApiService;

function removeEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}
