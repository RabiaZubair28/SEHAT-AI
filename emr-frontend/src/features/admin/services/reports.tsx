import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuthCheck } from "@/utils/helpers/baseQueryWithAuthCheck";
import { PatientListResponse } from "@/features/registerpatient/services/patientRegisterServices";

// ─── Report Type (path param) ─────────────────────────────────────────────────

export type ReportType =
  | "patients"
  | "single-patient"
  | "service"
  | "medicine"
  | "doctor"
  | "immunisation"
  | "delivery";

// ─── Query Params (all optional except reportType)
export interface ReportParams {
  reportType: ReportType;
  page?: number;
  limit?: number;
  facilityId?: number;
  facility_id?: number;
  patientId?: number;
  visitId?: number;
  serviceType?: string;
  search?: string;
  gender?: "Male" | "Female" | "Other" | "";
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  doctorId?: number;

  medicineName?: string;
  vaccineName?: string;
  vaccineId?: number;
  divisionId?: number;
  districtId?: number;
  talukaId?: number;
  ucId?: number;
  immunisationType?: "Defaulter" | "Scheduled" | "No Dose";
  includeDateWiseUsage?: boolean;
  variantId?: number;
  deliveryProgressStatus?: string;
  TypeOfDelivery?: string;
}

// ─── Search Patient Params ────────────────────────────────────────────────────
export interface SearchPatientParams {
  mr_no?: string;
  phone_number?: string;
  cnic?: string;
  first_name?:  string;
  last_name?:   string;
  facility_id?: number;
  page?: number;
  limit?: number;
}

export interface ExportParams extends ReportParams {
  exportType: "PDF" | "EXCEL";
}

// ─── API Service ──────────────────────────────────────────────────────────────
export const reportingApiService = createApi({
  reducerPath: "reportingApi",
  baseQuery: baseQueryWithAuthCheck,
  endpoints: (builder) => ({
    // Generic fetch — response type T defined at call site via the hook
    getReport: builder.query<unknown, ReportParams>({
      query: ({ reportType, ...params }) => ({
        url: `reporting/${reportType}`,
        method: "GET",
        params: removeEmpty(params),
      }),
    }),

    // Export — triggers a file download via blob
    exportReport: builder.query<{ downloadUrl: string }, ExportParams>({
      query: ({ reportType, exportType, ...params }) => ({
        url: `reporting/${reportType}`,
        params: removeEmpty({ ...params, exportType }),
        responseHandler: async (response: Response) => {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          return { downloadUrl: url };
        },
      }),
    }),

    // Search patients — used for SinglePatientReport lookup
    searchPatients: builder.query<PatientListResponse, SearchPatientParams>({
      query: (params) => ({
        url: "patients",
        method: "GET",
        params: removeEmpty(params),
      }),
    }),
  }),
});

export const {
  useGetReportQuery,
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  useSearchPatientsQuery,
  useLazySearchPatientsQuery,
} = reportingApiService;

// ─── Helper — strip undefined / null / empty string from params ───────────────
function removeEmpty(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );
}


