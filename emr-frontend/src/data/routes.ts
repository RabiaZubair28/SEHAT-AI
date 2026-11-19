export const ROUTES = {
  //auth
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forget-password",
  RESET_PASSWORD: "/reset-password",
  CHANGE_PASSWORD: "/change-password",
  ADMIN_CHANGE_PASSWORD: "/admin/change-password",

  //impersonation
  IMPERSONATE: "/impersonate",

  //admin
  ADMIN_LOGIN: "/admin/login",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_FACILITIES: "/admin/facilities",
  ADMIN_FACILITIES_ADD: "/admin/facilities/add",
  ADMIN_PERMISSIONS: "/admin/permission",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_USER_SERVICES: "/admin/user-services",
  ADMIN_PENDING: "/admin/appointments-tracker",
  ADMIN_REFERRAL: "/admin/referral",
  ADMIN_APPLY_LEAVE: "/admin/leave",
  ADMIN_STOCK_MANAGEMENT: "/admin/medicine-batches",
  ADMIN_STOCK_MANAGEMENT_NEW_REQUEST: "/admin/medicine-batches/new-request",
  ADMIN_STOCK_MANAGEMENT_EDIT: "/admin/medicine-batches/:id/edit",
  MEDICINE_BATCHES: "/medicine-batches",
  MEDICINE_BATCHES_NEW_REQUEST: "/medicine-batches/new-request",
  ADMIN_COMMODITY_REQUESTS: "/admin/commodity-requests",
  AUDIT_LOGS: "/admin/audit-logs",
  FACILITY_ATTENDANCE: "/admin/attendance",
  ADMIN_REPORTS: "/admin/reports",
  IMMUNISATION: "/admin/immunisation",

  //register
  REFERRAL: "/referral",
  PATIENT_REGISTER: "/patient-register",
  SEARCH_PATIENT: "/search-patient",

  //commodities
  COMMODITY_REQUESTS: "/commodity-requests",
  REQUESTED_MEDICINES_DETAILS: "details",
  REQUESTED_CONTRACEPTIVE_DETAILS: "contraceptive-details",
  NEW_COMMODITY_REQUESTS: "/commodity-requests/new-request",
  INVENTORY: "/inventory",

  //doctor-patient-module
  PATIENT_MODULE: "/patient",
  PATIENT_PROFILE: "profile",
  VITALS: "vitals",
  SERVICES: "services",

  //service
  ANC: "anc",
  PNC: "pnc",
  OPD: "opd",
  PATIENT_PROFILE_REFFERAL: "referral",
  DELIVERY: "delivery",
  FAMIlY_PLANNING: "family-planning",
  NUTRITION: "nutrition",
  IMMUNIZATION: "immunisation",
  MEDICINE_DISPENSING: "medicine-dispensing",

  //doctor
  PATIENT_QUEUE: "/queue",
  SERVICE_CARD: "/cards",

  //Restrictions
  FORBIDDEN: "/403",
  NOT_FOUND: "/404",

  //Attendance//
  ATTENDANCE: "/attendance",

  //Leave//
  LEAVE: "/leave",

  EMERGENCY: "emergency",
  AKUH_GUIDELINES: "akuh-guidelines",
  NUTRITION_REVIEWS: "nutrition-reviews",
};
