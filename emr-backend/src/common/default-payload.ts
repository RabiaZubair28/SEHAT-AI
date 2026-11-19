import { RoleName } from './enums/enums';
import { PermissionPayloadItem } from './interfaces/permission-payload.interface';

const mergePayloads = (
  ...payloads: PermissionPayloadItem[][]
): PermissionPayloadItem[] =>
  Array.from(
    new Map(
      payloads
        .flat()
        .map((payload) => [`${payload.method}:${payload.route}`, payload]),
    ).values(),
  );

const defaultAdminPayload: PermissionPayloadItem[] = [
  {
    route: '/auth/logout/:id',
    name: 'Logout user and clear token',
    method: 'POST',
    description:
      'Logs out the user by ID and clears the authentication cookie.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/auth/validate-token',
    name: 'Validate access token',
    method: 'GET',
    description:
      'Checks the validity of the access token and returns user data if valid.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/auth/change-password',
    name: 'Change own password',
    method: 'POST',
    description:
      'Changes the password of the logged-in user and clears the must-change-password flag set by a super admin reset.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/facilities/',
    name: 'Filter facilities by name, code, location, facility_id, and pagination',
    method: 'GET',
    description:
      'Returns a filtered and paginated list of facilities based on optional name, code, location, and facility_id queries.',
    module: 'Facilities',
    guards: ['JwtOrClientAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/facilities/district/:district_id',
    name: 'Get facilities associated by district ID',
    method: 'GET',
    description:
      'Returns all facilities linked to a specific district ID. Requires admin access.',
    module: 'Facilities',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/districts/',
    name: 'Get all districts',
    method: 'GET',
    description: 'Retrieves a list of all available districts.',
    module: 'Districts',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/districts/division/:division_id',
    name: 'Get all districts associated with division ID',
    method: 'GET',
    description:
      'Retrieves all districts linked to a specific division using the division ID.',
    module: 'Districts',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/division/',
    name: 'Get all divisions',
    method: 'GET',
    description: 'Retrieves a list of all divisions.',
    module: 'Division',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/routes/',
    name: 'Get all available routes',
    method: 'GET',
    description:
      'Fetches a list of all protected application routes with metadata.',
    module: 'Routes',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/taluka/',
    name: 'Get all Talukas',
    method: 'GET',
    description: 'Retrieves a list of all available talukas.',
    module: 'Taluka',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/taluka/district/:district_id',
    name: 'Get Talukas by District ID',
    method: 'GET',
    description: 'Retrieves talukas linked to a specific district.',
    module: 'Taluka',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/uc/',
    name: 'Get all UCs with filters',
    method: 'GET',
    description: 'Retrieves all UCs with optional filters.',
    module: 'Uc',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/uc/:taluka_id',
    name: 'Get UCs by Taluka ID',
    method: 'GET',
    description: 'Retrieves UCs linked to a specific Taluka.',
    module: 'UC',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/user/:userId',
    name: 'Create notification for a specific user (admin only)',
    method: 'POST',
    description:
      'Creates and sends a notification to a specific user account.',
    module: 'Notifications',
    guards: ['JwtAdminAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/role/:roleId',
    name: 'Create notification for a specific role (admin only)',
    method: 'POST',
    description:
      'Creates and sends a notification to all users belonging to a specific role.',
    module: 'Notifications',
    guards: ['JwtAdminAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/',
    name: 'Get all notifications for current user',
    method: 'GET',
    description: 'Retrieves notifications for the currently authenticated user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/:id/read',
    name: 'Mark a single notification as read',
    method: 'PATCH',
    description: 'Marks a specific notification as read for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/read-all',
    name: 'Mark all notifications as read',
    method: 'PATCH',
    description: 'Marks all notifications as read for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/unread-count',
    name: 'Get count of unread notifications for current user',
    method: 'GET',
    description:
      'Returns the number of unread notifications for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/patient/:id/visits',
    name: 'Get patient with visits list',
    method: 'GET',
    description:
      'Retrieves patient basic information and a list of all visits.',
    module: 'Patient PDF',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/patient/visits/:visitId',
    name: 'Get complete visit details',
    method: 'GET',
    description: 'Retrieves full visit details by visit ID.',
    module: 'Patient PDF',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/user-services/services-by-role',
    name: 'Get allowed services by role',
    method: 'GET',
    description:
      'Returns the list of services that can be assigned to a user for the provided role.',
    module: 'User Services',
    guards: ['JwtAdminAuthGuard'],
  },
  {
    name: 'Retrieve a paginated list of vaccines',
    route: '/immunisation/vaccines',
    guards: ['JwtOrAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns a list of vaccines filtered by optional parameters.',
  },
  {
    route: '/dashboard/overall',
    name: 'Get dashboard overall totals',
    method: 'GET',
    description:
      'Returns lifetime total patient registrations and total visits for the dashboard, scoped by role, district and facility.',
    module: 'Dashboard',
    guards: ['JwtAdminAuthGuard'],
  },
];

const defaultUserPayload: PermissionPayloadItem[] = [
  {
    route: '/auth/logout/:id',
    name: 'Logout user and clear token',
    method: 'POST',
    description:
      'Logs out the user by ID and clears the authentication cookie.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/auth/validate-token',
    name: 'Validate access token',
    method: 'GET',
    description:
      'Checks the validity of the access token and returns user data if valid.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/auth/change-password',
    name: 'Change own password',
    method: 'POST',
    description:
      'Changes the password of the logged-in user and clears the must-change-password flag set by a super admin reset.',
    module: 'Auth',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/facilities/',
    name: 'Filter facilities by name, code, location, facility_id, and pagination',
    method: 'GET',
    description:
      'Returns a filtered and paginated list of facilities based on optional name, code, location, and facility_id queries.',
    module: 'Facilities',
    guards: ['JwtOrClientAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/facilities/district/:district_id',
    name: 'Get facilities associated by district ID',
    method: 'GET',
    description:
      'Returns all facilities linked to a specific district ID. Requires admin access.',
    module: 'Facilities',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/districts/',
    name: 'Get all districts',
    method: 'GET',
    description: 'Retrieves a list of all available districts.',
    module: 'Districts',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/districts/division/:division_id',
    name: 'Get all districts associated with division ID',
    method: 'GET',
    description:
      'Retrieves all districts linked to a specific division using the division ID.',
    module: 'Districts',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/division/',
    name: 'Get all divisions',
    method: 'GET',
    description: 'Retrieves a list of all divisions.',
    module: 'Division',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/routes/',
    name: 'Get all available routes',
    method: 'GET',
    description:
      'Fetches a list of all protected application routes with metadata.',
    module: 'Routes',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/taluka/',
    name: 'Get all Talukas',
    method: 'GET',
    description: 'Retrieves a list of all available talukas.',
    module: 'Taluka',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/taluka/district/:district_id',
    name: 'Get Talukas by District ID',
    method: 'GET',
    description: 'Retrieves talukas linked to a specific district.',
    module: 'Taluka',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/uc/',
    name: 'Get all UCs with filters',
    method: 'GET',
    description: 'Retrieves all UCs with optional filters.',
    module: 'Uc',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/uc/:taluka_id',
    name: 'Get UCs by Taluka ID',
    method: 'GET',
    description: 'Retrieves UCs linked to a specific Taluka.',
    module: 'UC',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/',
    name: 'Get all notifications for current user',
    method: 'GET',
    description: 'Retrieves notifications for the currently authenticated user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/:id/read',
    name: 'Mark a single notification as read',
    method: 'PATCH',
    description: 'Marks a specific notification as read for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/read-all',
    name: 'Mark all notifications as read',
    method: 'PATCH',
    description: 'Marks all notifications as read for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/notifications/unread-count',
    name: 'Get count of unread notifications for current user',
    method: 'GET',
    description:
      'Returns the number of unread notifications for the current user.',
    module: 'Notifications',
    guards: ['JwtOrAuthGuard'],
    hidden: ['User', 'Admin'],
  },
  {
    route: '/users/update-profile',
    name: 'Reset user profile details',
    method: 'PATCH',
    description: 'Allows the user to update their profile details.',
    module: 'Users',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/',
    name: 'Create a new patient',
    method: 'POST',
    description:
      'Creates a new patient record linked to the authenticated user.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/',
    name: 'Get all patients',
    method: 'GET',
    description:
      'Retrieves a list of patients with optional filtering parameters.',
    module: 'Patients',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/patients/:id',
    name: 'Get a patient by ID',
    method: 'GET',
    description: 'Fetches details of a patient by their unique identifier.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/:id',
    name: 'Update a patient by ID',
    method: 'PATCH',
    description: 'Updates an existing patient record by its ID.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/medical-history/:id',
    name: 'Update a patients medical history by ID',
    method: 'PATCH',
    description:
      'Updates an existing patients medical history record by its ID.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/:id/visits',
    name: 'Get visit details of a patient by patient ID',
    method: 'GET',
    description: 'Fetches all visits of a patient based on patient ID.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/:id/visits/:visitId/:serviceType',
    name: 'Get a patient service details by visit ID by patient ID',
    method: 'GET',
    description:
      'Fetches service details of service of a patient based on visit ID and service type.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patients/:id/service/:serviceType',
    name: 'Get a patient service details by patient ID',
    method: 'GET',
    description:
      'Fetches service details of service of a patient based on service type.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/patient/:id/visits',
    name: 'Get patient with visits list',
    method: 'GET',
    description:
      'Retrieves patient basic information and a list of all visits.',
    module: 'Patient PDF',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/patient/visits/:visitId',
    name: 'Get complete visit details',
    method: 'GET',
    description: 'Retrieves full visit details by visit ID.',
    module: 'Patient PDF',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/appointments/complete',
    name: 'Complete  appointment for the patient',
    method: 'POST',
    description:
      'Complete the appointment for the patient, Only by the assigned doctor',
    module: 'Appointments',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/appointments/start',
    name: 'Start the appointment for the patient',
    method: 'POST',
    description:
      'Start the appointment for the patient, Only by the assigned doctor',
    module: 'Appointments',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/appointments/pause',
    name: 'Pause the appointment for the patient',
    method: 'POST',
    description:
      'Pause the appointment for the patient, Only by the assigned doctor',
    module: 'Appointments',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/appointments/get',
    name: 'Get details for the appointment',
    method: 'GET',
    description: 'Get the relevant details for the appointment',
    module: 'Appointments',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/appointments/appointment-services',
    name: 'Get appointment services by facility and service',
    method: 'GET',
    description:
      'Fetch appointment services for a facility filtered by service_id.',
    module: 'Appointments',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/getServiceByRoles',
    name: 'Get Services by Role ID',
    method: 'GET',
    description:
      'Fetches a list of available services based on the roles assigned to the authenticated user.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/in',
    name: 'Refer A Patient Inside the Facility',
    method: 'POST',
    description:
      'Creates an internal referral for a patient to another department or service within the same facility.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/unassign',
    name: 'Unassign a patient (no doctor, no service)',
    method: 'POST',
    description:
      'Saves the patient into the unassigned_patients table without assigning any doctor or service.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/unassigned',
    name: 'Get all unassigned patients',
    method: 'GET',
    description:
      'Returns a paginated list of all patients in the unassigned queue.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/availability/:patientId',
    name: 'Get eligible services for a patient',
    method: 'GET',
    description:
      'Returns the list of services that the patient is eligible to receive.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/out',
    name: 'Refer A Patient Outside the Facility',
    method: 'POST',
    description:
      'Creates an external referral for a patient to be referred to a different facility or external provider.',
    module: 'Referrals',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/referrals/dispatch/:appointmentId',
    name: 'Dispatch a patient visit',
    method: 'PATCH',
    description:
      'Marks the most recent visit for the specified patient as dispatched.',
    module: 'Referrals',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/doctors/appointment/pending',
    name: 'Get all pending appointments by Doctor ID',
    method: 'GET',
    description:
      'Retrieve a paginated list of all pending appointments assigned to a specific doctor identified by their ID.',
    module: 'Doctors',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/doctors/appointment/completed',
    name: 'Get all completed appointments by Doctor ID',
    method: 'GET',
    description:
      'Retrieve a paginated list of all completed appointments for a specific doctor identified by their ID.',
    module: 'Doctors',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/doctors/appointment/all',
    name: 'Get all appointments (for registration clerk)',
    method: 'GET',
    description:
      'Get all apppoinments for a current day, based on registration clerk`s facility_id',
    module: 'Doctors',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/doctors/available',
    name: 'Get checked-in doctors offering a service',
    method: 'GET',
    description:
      'Retrieve doctors for a facility who offer the given service and are checked in.',
    module: 'Doctors',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/doctors/transfer/service/:serviceType/doctor/:doctorId/appointment/:appointmentId',
    name: 'Transfer service to another doctor',
    method: 'PATCH',
    description:
      'Transfers the service associated with the given service type to another doctor for the specified appointment.',
    module: 'Doctors',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/vital-assesment/',
    name: 'Create vitals for the appointment',
    method: 'POST',
    description:
      'Only the assigned doctor can create vitals for a given appointment.',
    module: 'Vital Assesment',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/vital-assesment/',
    name: 'Get details for the visit vitals',
    method: 'GET',
    description: 'Get the relevant details for the visit vitals',
    module: 'Vital Assesment',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/medicine/',
    name: 'Retrieve a paginated list of medicines',
    method: 'GET',
    description: 'Returns a list of medicines filtered by optional parameters.',
    module: 'Medicine',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/medicine/prescriptions',
    name: 'Retrieve prescribed medicines for a patient',
    method: 'GET',
    description: 'Fetches all prescribed medicines linked to a patient',
    module: 'Medicine',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/leave/',
    name: 'Create leave record',
    method: 'POST',
    description:
      'Creates a new leave record for a user. Only Facility Incharge can create leaves.',
    module: 'Leave',
    guards: ['FacilityInchargeGuard'],
  },
  {
    route: '/leave/',
    name: 'Get all applied leaves',
    method: 'GET',
    description:
      'Retrieves all applied leaves sorted by creation date in descending order. Accessible by all authenticated users.',
    module: 'Leave',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/leave/:id',
    name: 'Delete leave record',
    method: 'DELETE',
    description:
      'Deletes a leave record. Only future leaves can be deleted. Only Facility Incharge can delete leaves.',
    module: 'Leave',
    guards: ['FacilityInchargeGuard'],
  },
  {
    route: '/attendance/',
    name: 'Create attendance record',
    method: 'POST',
    description:
      'Creates a new attendance record for the authenticated user with the current timestamp as check-in time. Latitude and longitude are required for vaccinator users and optional for others.',
    module: 'Attendance',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/attendance/checkout',
    name: 'Check out attendance',
    method: 'PATCH',
    description:
      'Updates the attendance record of the authenticated user to mark check-out time.',
    module: 'Attendance',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/attendance/force-checkout/:doctorId',
    name: 'Force check out a doctor',
    method: 'PATCH',
    description:
      'Forcefully checks out a doctor for the current facility. Only facility incharge can perform this action.',
    module: 'Attendance',
    guards: ['FacilityInchargeGuard'],
  },
  {
    route: '/attendance/',
    name: 'Get attendance records based on user role',
    method: 'GET',
    description:
      'Fetches attendance records based on user role with pagination and filtering.',
    module: 'Attendance',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/commodity-requests/',
    name: 'Create a commodity request with multiple items',
    method: 'POST',
    description:
      'Creates a new commodity request containing one or more medicine variants.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/',
    name: 'Get all commodity requests',
    method: 'GET',
    description: 'Retrieves commodity requests using optional filter criteria.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/statistics/summary',
    name: 'Get commodity request statistics',
    method: 'GET',
    description:
      'Returns summary statistics of commodity requests, optionally filtered by requester.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/inventory/all',
    name: 'Get all medicine inventory',
    method: 'GET',
    description: 'Retrieves inventory of all medicines and contraceptives.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/inventory/contraceptives',
    name: 'Get contraceptive inventory',
    method: 'GET',
    description: 'Retrieves inventory for contraceptive commodities only.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/inventory/medicines',
    name: 'Get non-contraceptive medicine inventory',
    method: 'GET',
    description: 'Retrieves inventory for non-contraceptive medicines only.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/:id',
    name: 'Get commodity request by ID',
    method: 'GET',
    description: 'Retrieves a specific commodity request by its ID.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/requester/:requesterId',
    name: 'Get requests by requester',
    method: 'GET',
    description:
      'Retrieves all commodity requests created by a specific requester.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/commodity-requests/:id/status',
    name: 'Update commodity request status with item-level control',
    method: 'PATCH',
    description:
      'Updates the approval or processing status of a commodity request with item-level control.',
    module: 'Commodity Requests',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/emergency/',
    name: 'Create new emergency patient record',
    method: 'POST',
    description:
      'Creates a new emergency patient with vitals and outcome. Doctor will be current user if not specified.',
    module: 'Emergency',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/emergency/doctor/:doctorId',
    name: 'Get emergency patients by doctor ID',
    method: 'GET',
    description: 'Retrieves all emergency patients for a specific doctor',
    module: 'Emergency',
    guards: ['JwtUserAuthGuard'],
  },
  {
    route: '/emergency/',
    name: 'Get all emergency patients',
    method: 'GET',
    description: 'Retrieves all emergency patient records with pagination',
    module: 'Emergency',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/token-counter/',
    name: 'Get next token',
    method: 'GET',
    description:
      'Generates and returns the next token value for the current day.',
    module: 'Token Counter',
    guards: ['JwtUserAuthGuard'],
    hidden: ['User', 'Admin'],
  },
];

const facilityInchargeAllowedGuards = [
  'JwtOrAuthGuard',
  'JwtAdminAuthGuard',
  'FacilityInchargeGuard',
];

const defaultRegistrationClerkPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    route: '/referrals/getServiceByRoles',
    name: 'Get Services by Role ID',
    method: 'GET',
    description:
      'Fetches a list of available services based on the roles assigned to the authenticated user.',
    module: 'Referrals',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/referrals/in',
    name: 'Refer A Patient Inside the Facility',
    method: 'POST',
    description:
      'Creates an internal referral for a patient to another department or service within the same facility.',
    module: 'Referrals',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/referrals/out',
    name: 'Refer A Patient Outside the Facility',
    method: 'POST',
    description:
      'Creates an external referral for a patient to be referred to a different facility or external provider.',
    module: 'Referrals',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/patients/',
    name: 'Create a new patient',
    method: 'POST',
    description:
      'Creates a new patient record linked to the authenticated user.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/patients/',
    name: 'Get all patients',
    method: 'GET',
    description:
      'Retrieves a list of patients with optional filtering parameters.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/patients/:id',
    name: 'Get a patient by ID',
    method: 'GET',
    description: 'Fetches details of a patient by their unique identifier.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
    hidden: ['registration_clerk'],
  },
  {
    route: '/patients/:id',
    name: 'Update a patient by ID',
    method: 'PATCH',
    description: 'Updates an existing patient record by its ID.',
    module: 'Patients',
    guards: ['JwtUserAuthGuard'],
  },
];

const defaultFacilityInchargePayload: PermissionPayloadItem[] = mergePayloads(
  defaultAdminPayload,
  defaultUserPayload.filter((payload) =>
    payload.guards?.some((guard) =>
      facilityInchargeAllowedGuards.includes(guard),
    ),
  ),
  [
    {
      route: '/dashboard/',
      name: 'Get dashboard data',
      method: 'GET',
      description:
        'Returns dashboard metrics scoped to the current facility for Facility Incharge users.',
      module: 'Dashboard',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/reporting/:reportType',
      name: 'Get report by type',
      method: 'GET',
      description:
        'Returns reports scoped to the current facility for Facility Incharge users.',
      module: 'Reporting',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/admin/users/get',
      name: 'Get all users',
      method: 'GET',
      description:
        'Retrieves users for the current facility with role-based restrictions for Facility Incharge.',
      module: 'Admin',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/admin/users/create',
      name: 'Create a new user (Admin)',
      method: 'POST',
      description:
        'Creates a new user with full details for the current facility scope.',
      module: 'Admin',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/admin/users/:id',
      name: 'Update a user by ID',
      method: 'PUT',
      description:
        'Updates user information for allowed users within the current facility.',
      module: 'Admin',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/admin/users/:id',
      name: 'Soft Delete a user by ID',
      method: 'DELETE',
      description:
        'Soft deletes an allowed user within the current facility.',
      module: 'Admin',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-services/',
      name: 'Assign a service to a user',
      method: 'POST',
      description:
        'Assigns services to a user within the current facility.',
      module: 'User Services',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-services/',
      name: 'List all user services',
      method: 'GET',
      description:
        'Fetches user-service assignments for the current facility.',
      module: 'User Services',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-services/services-by-role',
      name: 'Get allowed services by role',
      method: 'GET',
      description:
        'Returns the list of services that can be assigned to a user for the provided role.',
      module: 'User Services',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-permissions/',
      name: 'Create a new user permission',
      method: 'POST',
      description:
        'Assigns a specific permission to a user within the current facility scope.',
      module: 'User Permissions',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-permissions/',
      name: 'Get all user permissions',
      method: 'GET',
      description:
        'Returns user permission records for users in the current facility scope.',
      module: 'User Permissions',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/user-permissions/defaults/:roleName',
      name: 'Get user permission defaults by role',
      method: 'GET',
      description:
        'Returns the default permission payload for the provided role name.',
      module: 'User Permissions',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/doctors/admin/appointment/pending',
      name: 'Get all pending appointments by Doctor ID for admin',
      method: 'GET',
      description:
        'Retrieves pending appointments by facility for the current Facility Incharge.',
      module: 'Doctors',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/doctors/facility',
      name: 'Get doctors by facility',
      method: 'GET',
      description:
        'Retrieves doctors for the current facility.',
      module: 'Doctors',
      guards: ['JwtAdminAuthGuard'],
    },
    {
      route: '/immunisation/patient-immunisations/uc',
      name: 'Retrieve patient immunisation summaries for user UC',
      method: 'GET',
      description:
        'Returns patient immunisation summary records for the UC of the requesting user.',
      module: 'Immunisation',
      guards: ['FacilityInchargeGuard'],
    },
    {
      route: '/immunisation/patient-immunisations/close',
      name: 'Close patient immunisation status',
      method: 'POST',
      description:
        'Sets the latest patient immunisation status to Closed for the given patient.',
      module: 'Immunisation',
      guards: ['FacilityInchargeGuard'],
    },
    {
      route: '/medicine-batch/',
      name: 'Add new medicine batches',
      method: 'POST',
      description:
        'Creates multiple medicine batch records for the current facility.',
      module: 'Medicine Batch',
      guards: ['JwtOrAuthGuard'],
    },
    {
      route: '/medicine-batch/',
      name: 'Get all medicine batches',
      method: 'GET',
      description:
        'Retrieves medicine batches for the current facility with pagination and filters.',
      module: 'Medicine Batch',
      guards: ['JwtOrAuthGuard'],
    },
    {
      route: '/patient/:id/visits',
      name: 'Get patient with visits list',
      method: 'GET',
      description:
        'Retrieves patient basic information and a list of all visits.',
      module: 'Patient PDF',
      guards: ['JwtOrAuthGuard'],
    },
    {
      route: '/patient/visits/:visitId',
      name: 'Get complete visit details',
      method: 'GET',
      description: 'Retrieves full visit details by visit ID.',
      module: 'Patient PDF',
      guards: ['JwtOrAuthGuard'],
    },
  ]);

const defaultHeadOfficePayload: PermissionPayloadItem[] = [
  ...defaultAdminPayload,
  {
    "name": "Get dashboard data",
    "route": "/dashboard/",
    "guards": [
      "JwtAdminAuthGuard"
    ],
    "method": "GET",
    "module": "Dashboard",
    "description": "Returns dashboard metrics scoped to the current facility for Facility Incharge users."
  },
  {
    "name": "Get report by type",
    "route": "/reporting/:reportType",
    "guards": [
      "JwtAdminAuthGuard"
    ],
    "method": "GET",
    "module": "Reporting",
    "description": "Returns reports scoped to the current facility for Facility Incharge users."
  },
];

const defaultSbaPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Refer A Patient To Yourself',
    route: '/referrals/self-referral',
    guards: ['JwtOrAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an internal referral assigned to the authenticated doctor, bypassing automatic doctor assignment.',
  },
  {
    name: 'Create a new patient',
    route: '/patients/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Patients',
    description:
      'Creates a new patient record linked to the authenticated user.',
  },
  {
    name: 'Get all patients',
    route: '/patients/',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Patients',
    description:
      'Retrieves a list of patients with optional filtering parameters.',
  },
  {
    name: 'Get a patient by ID',
    route: '/patients/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Patients',
    description: 'Fetches details of a patient by their unique identifier.',
  },
  {
    name: 'Update a patient by ID',
    route: '/patients/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Patients',
    description: 'Updates an existing patient record by its ID.',
  },
  {
    name: 'Get Services by Role ID',
    route: '/referrals/getServiceByRoles',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Referrals',
    description:
      'Fetches a list of available services based on the roles assigned to the authenticated user.',
  },
  {
    name: 'Refer A Patient Inside the Facility',
    route: '/referrals/in',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an internal referral for a patient to another department or service within the same facility.',
  },
  {
    name: 'Refer A Patient Outside the Facility',
    route: '/referrals/out',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an external referral for a patient to be referred to a different facility or external provider.',
  },
  {
    name: 'Get all pending appointments by Doctor ID',
    route: '/doctors/appointment/pending',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Doctors',
    description:
      'Retrieve a paginated list of all pending appointments assigned to a specific doctor identified by their ID.',
  },
  {
    name: 'Get all completed appointments by Doctor ID',
    route: '/doctors/appointment/completed',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Doctors',
    description:
      'Retrieve a paginated list of all completed appointments for a specific doctor identified by their ID.',
  },
  {
    name: 'Submit the ANC Visit details',
    route: '/anc/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Anc',
    description: 'Submit the ANC Visit details',
  },
  {
    name: 'Update an existing ANC Visit',
    route: '/anc/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Anc',
    description: 'Update an existing ANC Visit',
  },
  {
    name: 'Complete the appointment for the patient',
    route: '/appointments/complete',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Complete the appointment for the patient, Only by the assigned doctor',
  },
  {
    name: 'Start the appointment for the patient',
    route: '/appointments/start',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Start the appointment for the patient, Only by the assigned doctor',
  },
  {
    name: 'Create the appointment vitals for the patient',
    route: '/appointments/create/vitals',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Complete the appointment vitals for the patient, Only by the assigned doctor',
  },
  {
    name: 'Get details for the appointment vitals',
    route: '/appointments/get/vitals',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Appointments',
    description: 'Get details for the appointment',
  },
  {
    name: 'Get details for the appointments',
    route: '/appointments/get',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Appointments',
    description: 'Get details for the appointments',
  },
  {
    name: 'Submit Nutrition service details',
    route: '/nutrition/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition',
    description:
      'Creates a new Nutrition service record for a patient linked to the authenticated user.',
  },
  {
    name: 'Update an existing Nutrition record',
    route: '/nutrition/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition',
    description: 'Updates the details of an existing Nutrition service record.',
  },
  {
    name: 'Nutrition Advisor food library',
    route: '/nutrition-advisor/foods',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Validated food library used by the Nutrition Advisor.',
  },
  {
    name: 'Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Patient summary, targets, findings and recommendations.',
  },
  {
    name: 'Preview Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Preview patient findings and targets using proposed preferences.',
  },
  {
    name: 'Nutrition Advisor current plan',
    route: '/nutrition-advisor/:appointment_service_id/plans/current',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Latest meal plan version for a Nutrition encounter.',
  },
  {
    name: 'Nutrition Advisor plan versions',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'All meal plan versions for a Nutrition encounter.',
  },
  {
    name: 'Generate Nutrition Advisor plan',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Generate a 7-day meal plan draft.',
  },
  {
    name: 'Get Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Get a specific meal plan version.',
  },
  {
    name: 'Nutrition Advisor substitutes',
    route: '/nutrition-advisor/plans/:plan_id/substitutes',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Safe food substitutes for a meal slot.',
  },
  {
    name: 'Save Nutrition Advisor plan draft',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition Advisor',
    description: 'Save draft edits to a meal plan.',
  },
  {
    name: 'Submit Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/submit',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Submit a draft plan for clinical review.',
  },
  {
    name: 'Nutrition Advisor deliveries',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Delivery history for a Nutrition encounter.',
  },
  {
    name: 'Share Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Download or send an approved handout via WhatsApp.',
  },
  {
    name: 'Submit the PNC Visit details',
    route: '/pnc/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Pnc',
    description: 'Creates a new PNC visit record linked to the authenticated user.',
  },
  {
    name: 'Update an existing PNC Visit',
    route: '/pnc/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Pnc',
    description: 'Updates the details of an existing PNC visit record.',
  },
  {
    name: 'Add Delivery Visit details',
    route: '/delivery/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Delivery',
    description: 'Creates a new Delivery Visit record with optional nested assesments.',
  },
  {
    name: 'Update Delivery Cemonc details',
    route: '/delivery/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Delivery',
    description:
      'Updates an existing Delivery Cemonc record with optional nested assessments. Immutable fields in newborn assessments cannot be updated.',
  },
  {
    name: 'Get Deliveries by Patient ID',
    route: '/delivery/patient/:patientId',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Delivery',
    description:
      'Retrieves all Delivery records associated with a specific patient ID.',
  },
  {
    name: 'Get Children by Appointment Service ID',
    route: '/delivery/appointment-service/:appointmentServiceId/children',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Delivery',
    description:
      'Retrieves all child patients associated with a specific appointment service.',
  },
  {
    name: 'AKUH Guidelines',
    route: '/akuh-guidelines/',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns a list of all available guidelines with their IDs and titles from the AKU API.',
  },
  {
    name: 'AKUH Content Guidelines',
    route: '/akuh-guidelines/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns the full HTML content of a specific guideline using its ID.',
  },
  {
    name: 'Add Family Planning Visit details',
    route: '/family-planning/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Family Planning',
    description:
      'Creates a new Family Planning visit record linked to the authenticated user.',
  },
  {
    name: 'Update Family Planning Visit details',
    route: '/family-planning/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PUT',
    module: 'Family Planning',
    description:
      'Updates an existing Family Planning visit record linked to the authenticated user.',
  },
  {
    name: 'Get telehealth doctor queue',
    route: '/telehealth/queue',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns telehealth-enabled doctors with optional filtering by service type, specialty, and availability.',
  },
  {
    name: 'Create telehealth consultation request',
    route: '/telehealth/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Telehealth',
    description:
      'Creates a new telehealth consultation request from the logged-in primary doctor to a selected consultant.',
  },
  {
    name: 'Cancel telehealth request',
    route: '/telehealth/requests/:id/cancel',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Cancels a telehealth request for the given request ID with an optional cancellation reason. Only the requesting (primary) doctor can cancel.',
  },
  {
    name: 'Get telehealth request by appointment service ID',
    route: '/telehealth/appointment-services/:appointmentServiceId/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  },
  {
    name: 'Create OPD record',
    route: '/opd/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Opd',
    description:
      'Creates a new OPD visit record linked to the authenticated user.',
  },
  {
    name: 'Update existing OPD visit (within 2 weeks)',
    route: '/opd/:appointment_service_id',
    guards: ['JwtOrAuthGuard'],
    method: 'PATCH',
    module: 'Opd',
    description: 'Updates OPD record except prescriptions',
  },
  {
    name: 'Retrieve a paginated list of vaccines',
    route: '/immunisation/vaccines',
    guards: ['JwtOrAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns a list of vaccines filtered by optional parameters.',
  },
  {
    name: 'Create immunisation record',
    route: '/immunisation/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Creates a new immunisation record for a patient visit using immunisation card details.',
  },
  {
    name: 'Get immunisation by patient and appointment service',
    route: '/immunisation/patient',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description:
      'Fetches immunisation details for a patient and appointment service.',
  },
  {
    name: 'Retrieve patient immunisation summaries',
    route: '/immunisation/patient-immunisations',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns patient immunisation summary records filtered by status.',
  },
  {
    name: 'Add patient immunisation remarks',
    route: '/immunisation/patient-immunisations/remarks',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Adds remarks to the latest patient immunisation record if empty.',
  },
];

const defaultMedicalOfficerFemalePayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Refer A Patient To Yourself',
    route: '/referrals/self-referral',
    guards: ['JwtOrAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an internal referral assigned to the authenticated doctor, bypassing automatic doctor assignment.',
  },
  {
    name: 'Create a new patient',
    route: '/patients/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Patients',
    description:
      'Creates a new patient record linked to the authenticated user.',
  },
  {
    name: 'Get all patients',
    route: '/patients/',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Patients',
    description:
      'Retrieves a list of patients with optional filtering parameters.',
  },
  {
    name: 'Get a patient by ID',
    route: '/patients/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Patients',
    description: 'Fetches details of a patient by their unique identifier.',
  },
  {
    name: 'Update a patient by ID',
    route: '/patients/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Patients',
    description: 'Updates an existing patient record by its ID.',
  },
  {
    name: 'Get Services by Role ID',
    route: '/referrals/getServiceByRoles',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Referrals',
    description:
      'Fetches a list of available services based on the roles assigned to the authenticated user.',
  },
  {
    name: 'Refer A Patient Inside the Facility',
    route: '/referrals/in',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an internal referral for a patient to another department or service within the same facility.',
  },
  {
    name: 'Refer A Patient Outside the Facility',
    route: '/referrals/out',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an external referral for a patient to be referred to a different facility or external provider.',
  },
  {
    name: 'Get all pending appointments by Doctor ID',
    route: '/doctors/appointment/pending',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Doctors',
    description:
      'Retrieve a paginated list of all pending appointments assigned to a specific doctor identified by their ID.',
  },
  {
    name: 'Get all completed appointments by Doctor ID',
    route: '/doctors/appointment/completed',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Doctors',
    description:
      'Retrieve a paginated list of all completed appointments for a specific doctor identified by their ID.',
  },
  {
    name: 'Submit the ANC Visit details',
    route: '/anc/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Anc',
    description: 'Submit the ANC Visit details',
  },
  {
    name: 'Update an existing ANC Visit',
    route: '/anc/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Anc',
    description: 'Update an existing ANC Visit',
  },
  {
    name: 'Complete the appointment for the patient',
    route: '/appointments/complete',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Complete the appointment for the patient, Only by the assigned doctor',
  },
  {
    name: 'Start the appointment for the patient',
    route: '/appointments/start',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Start the appointment for the patient, Only by the assigned doctor',
  },
  {
    name: 'Create the appointment vitals for the patient',
    route: '/appointments/create/vitals',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Appointments',
    description:
      'Complete the appointment vitals for the patient, Only by the assigned doctor',
  },
  {
    name: 'Get details for the appointment vitals',
    route: '/appointments/get/vitals',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Appointments',
    description: 'Get details for the appointment',
  },
  {
    name: 'Get details for the appointments',
    route: '/appointments/get',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Appointments',
    description: 'Get details for the appointments',
  },
  {
    name: 'Submit Nutrition service details',
    route: '/nutrition/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition',
    description:
      'Creates a new Nutrition service record for a patient linked to the authenticated user.',
  },
  {
    name: 'Update an existing Nutrition record',
    route: '/nutrition/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition',
    description: 'Updates the details of an existing Nutrition service record.',
  },
  {
    name: 'Nutrition Advisor food library',
    route: '/nutrition-advisor/foods',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Validated food library used by the Nutrition Advisor.',
  },
  {
    name: 'Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Patient summary, targets, findings and recommendations.',
  },
  {
    name: 'Preview Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Preview patient findings and targets using proposed preferences.',
  },
  {
    name: 'Nutrition Advisor current plan',
    route: '/nutrition-advisor/:appointment_service_id/plans/current',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Latest meal plan version for a Nutrition encounter.',
  },
  {
    name: 'Nutrition Advisor plan versions',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'All meal plan versions for a Nutrition encounter.',
  },
  {
    name: 'Generate Nutrition Advisor plan',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Generate a 7-day meal plan draft.',
  },
  {
    name: 'Get Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Get a specific meal plan version.',
  },
  {
    name: 'Nutrition Advisor substitutes',
    route: '/nutrition-advisor/plans/:plan_id/substitutes',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Safe food substitutes for a meal slot.',
  },
  {
    name: 'Save Nutrition Advisor plan draft',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition Advisor',
    description: 'Save draft edits to a meal plan.',
  },
  {
    name: 'Submit Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/submit',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Submit a draft plan for clinical review.',
  },
  {
    name: 'Nutrition Advisor deliveries',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Delivery history for a Nutrition encounter.',
  },
  {
    name: 'Share Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Download or send an approved handout via WhatsApp.',
  },
  {
    name: 'Nutrition Advisor review queue',
    route: '/nutrition-advisor/reviews',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Nutrition plans awaiting clinical review at the facility.',
  },
  {
    name: 'Review Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/review',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Approve, reject or request changes to a plan version.',
  },
  {
    name: 'Submit the PNC Visit details',
    route: '/pnc/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Pnc',
    description: 'Creates a new PNC visit record linked to the authenticated user.',
  },
  {
    name: 'Update an existing PNC Visit',
    route: '/pnc/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Pnc',
    description: 'Updates the details of an existing PNC visit record.',
  },
  {
    name: 'Add Delivery Visit details',
    route: '/delivery/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Delivery',
    description: 'Creates a new Delivery Visit record with optional nested assesments.',
  },
  {
    name: 'Update Delivery Cemonc details',
    route: '/delivery/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Delivery',
    description:
      'Updates an existing Delivery Cemonc record with optional nested assessments. Immutable fields in newborn assessments cannot be updated.',
  },
  {
    name: 'Get Deliveries by Patient ID',
    route: '/delivery/patient/:patientId',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Delivery',
    description:
      'Retrieves all Delivery records associated with a specific patient ID.',
  },
  {
    name: 'Get Children by Appointment Service ID',
    route: '/delivery/appointment-service/:appointmentServiceId/children',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Delivery',
    description:
      'Retrieves all child patients associated with a specific appointment service.',
  },
  {
    name: 'AKUH Guidelines',
    route: '/akuh-guidelines/',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns a list of all available guidelines with their IDs and titles from the AKU API.',
  },
  {
    name: 'AKUH Content Guidelines',
    route: '/akuh-guidelines/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns the full HTML content of a specific guideline using its ID.',
  },
  {
    name: 'Add Family Planning Visit details',
    route: '/family-planning/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Family Planning',
    description:
      'Creates a new Family Planning visit record linked to the authenticated user.',
  },
  {
    name: 'Update Family Planning Visit details',
    route: '/family-planning/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PUT',
    module: 'Family Planning',
    description:
      'Updates an existing Family Planning visit record linked to the authenticated user.',
  },
  {
    name: 'Get telehealth doctor queue',
    route: '/telehealth/queue',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns telehealth-enabled doctors with optional filtering by service type, specialty, and availability.',
  },
  {
    name: 'Create telehealth consultation request',
    route: '/telehealth/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Telehealth',
    description:
      'Creates a new telehealth consultation request from the logged-in primary doctor to a selected consultant.',
  },
  {
    name: 'Cancel telehealth request',
    route: '/telehealth/requests/:id/cancel',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Cancels a telehealth request for the given request ID with an optional cancellation reason. Only the requesting (primary) doctor can cancel.',
  },
  {
    name: 'Get telehealth request by appointment service ID',
    route: '/telehealth/appointment-services/:appointmentServiceId/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  },
  {
    name: 'Create OPD record',
    route: '/opd/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Opd',
    description:
      'Creates a new OPD visit record linked to the authenticated user.',
  },
  {
    name: 'Update existing OPD visit (within 2 weeks)',
    route: '/opd/:appointment_service_id',
    guards: ['JwtOrAuthGuard'],
    method: 'PATCH',
    module: 'Opd',
    description: 'Updates OPD record except prescriptions',
  },
  {
    name: 'Retrieve a paginated list of vaccines',
    route: '/immunisation/vaccines',
    guards: ['JwtOrAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns a list of vaccines filtered by optional parameters.',
  },
  {
    name: 'Create immunisation record',
    route: '/immunisation/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Creates a new immunisation record for a patient visit using immunisation card details.',
  },
  {
    name: 'Get immunisation by patient and appointment service',
    route: '/immunisation/patient',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description:
      'Fetches immunisation details for a patient and appointment service.',
  },
  {
    name: 'Retrieve patient immunisation summaries',
    route: '/immunisation/patient-immunisations',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns patient immunisation summary records filtered by status.',
  },
  {
    name: 'Add patient immunisation remarks',
    route: '/immunisation/patient-immunisations/remarks',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Adds remarks to the latest patient immunisation record if empty.',
  },
];

const defaultMedicalOfficerMalePayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Refer A Patient To Yourself',
    route: '/referrals/self-referral',
    guards: ['JwtOrAuthGuard'],
    method: 'POST',
    module: 'Referrals',
    description:
      'Creates an internal referral assigned to the authenticated doctor, bypassing automatic doctor assignment.',
  },
  {
    name: 'Create OPD record',
    route: '/opd/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Opd',
    description:
      'Creates a new OPD visit record linked to the authenticated user.',
  },
  {
    name: 'Update existing OPD visit (within 2 weeks)',
    route: '/opd/:appointment_service_id',
    guards: ['JwtOrAuthGuard'],
    method: 'PATCH',
    module: 'Opd',
    description: 'Updates OPD record except prescriptions',
  },
  {
    name: 'Submit Nutrition service details',
    route: '/nutrition/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition',
    description:
      'Creates a new Nutrition service record for a patient linked to the authenticated user.',
  },
  {
    name: 'Update an existing Nutrition record',
    route: '/nutrition/:appointment_service_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition',
    description: 'Updates the details of an existing Nutrition service record.',
  },
  {
    name: 'Nutrition Advisor food library',
    route: '/nutrition-advisor/foods',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Validated food library used by the Nutrition Advisor.',
  },
  {
    name: 'Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Patient summary, targets, findings and recommendations.',
  },
  {
    name: 'Preview Nutrition Advisor overview',
    route: '/nutrition-advisor/:appointment_service_id/overview',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Preview patient findings and targets using proposed preferences.',
  },
  {
    name: 'Nutrition Advisor current plan',
    route: '/nutrition-advisor/:appointment_service_id/plans/current',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Latest meal plan version for a Nutrition encounter.',
  },
  {
    name: 'Nutrition Advisor plan versions',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'All meal plan versions for a Nutrition encounter.',
  },
  {
    name: 'Generate Nutrition Advisor plan',
    route: '/nutrition-advisor/:appointment_service_id/plans',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Generate a 7-day meal plan draft.',
  },
  {
    name: 'Get Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Get a specific meal plan version.',
  },
  {
    name: 'Nutrition Advisor substitutes',
    route: '/nutrition-advisor/plans/:plan_id/substitutes',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Safe food substitutes for a meal slot.',
  },
  {
    name: 'Save Nutrition Advisor plan draft',
    route: '/nutrition-advisor/plans/:plan_id',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Nutrition Advisor',
    description: 'Save draft edits to a meal plan.',
  },
  {
    name: 'Submit Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/submit',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Submit a draft plan for clinical review.',
  },
  {
    name: 'Nutrition Advisor deliveries',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Delivery history for a Nutrition encounter.',
  },
  {
    name: 'Share Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/deliveries',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Download or send an approved handout via WhatsApp.',
  },
  {
    name: 'Nutrition Advisor review queue',
    route: '/nutrition-advisor/reviews',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Nutrition Advisor',
    description: 'Nutrition plans awaiting clinical review at the facility.',
  },
  {
    name: 'Review Nutrition Advisor plan',
    route: '/nutrition-advisor/plans/:plan_id/review',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Nutrition Advisor',
    description: 'Approve, reject or request changes to a plan version.',
  },
  {
    name: 'AKUH Guidelines',
    route: '/akuh-guidelines/',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns a list of all available guidelines with their IDs and titles from the AKU API.',
  },
  {
    name: 'AKUH Content Guidelines',
    route: '/akuh-guidelines/:id',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'akuh-guidelines',
    description:
      'Returns the full HTML content of a specific guideline using its ID.',
  },
  {
    name: 'Get telehealth doctor queue',
    route: '/telehealth/queue',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns telehealth-enabled doctors with optional filtering by service type, specialty, and availability.',
  },
  {
    name: 'Create telehealth consultation request',
    route: '/telehealth/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Telehealth',
    description:
      'Creates a new telehealth consultation request from the logged-in primary doctor to a selected consultant.',
  },
  {
    name: 'Cancel telehealth request',
    route: '/telehealth/requests/:id/cancel',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Cancels a telehealth request for the given request ID with an optional cancellation reason. Only the requesting (primary) doctor can cancel.',
  },
  {
    name: 'Get telehealth request by appointment service ID',
    route: '/telehealth/appointment-services/:appointmentServiceId/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  },
];

const defaultDispenserPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Dispense prescribed medicines',
    route: '/dispenser/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Dispenser',
    description:
      'Creates a dispense record for a visit and deducts stock from the selected medicine batches.',
  },
  {
    route: '/medicine-batch/',
    name: 'Add new medicine batches',
    method: 'POST',
    description:
      'Creates multiple medicine batch records for the current facility.',
    module: 'Medicine Batch',
    guards: ['JwtOrAuthGuard'],
  },
  {
    route: '/medicine-batch/',
    name: 'Get all medicine batches',
    method: 'GET',
    description:
      'Retrieves medicine batches for the current facility with pagination and filters.',
    module: 'Medicine Batch',
    guards: ['JwtOrAuthGuard'],
  },
];

const defaultPaedsPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Create OPD record',
    route: '/opd/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Opd',
    description:
      'Creates a new OPD visit record linked to the authenticated user.',
  },
  {
    name: 'Update existing OPD visit (within 2 weeks)',
    route: '/opd/:appointment_service_id',
    guards: ['JwtOrAuthGuard'],
    method: 'PATCH',
    module: 'Opd',
    description: 'Updates OPD record except prescriptions',
  },
  {
    name: 'Get telehealth doctor queue',
    route: '/telehealth/queue',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns telehealth-enabled doctors with optional filtering by service type, specialty, and availability.',
  },
  {
    name: 'Create telehealth consultation request',
    route: '/telehealth/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Telehealth',
    description:
      'Creates a new telehealth consultation request from the logged-in primary doctor to a selected consultant.',
  },
  {
    name: 'Cancel telehealth request',
    route: '/telehealth/requests/:id/cancel',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Cancels a telehealth request for the given request ID with an optional cancellation reason. Only the requesting (primary) doctor can cancel.',
  },
  {
    name: 'Get telehealth request by appointment service ID',
    route: '/telehealth/appointment-services/:appointmentServiceId/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  },
];

const defaultTelehealthConsultantPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Get incoming telehealth requests for consultant',
    route: '/telehealth/requests/incoming',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns incoming telehealth requests assigned to the logged-in consultant doctor.',
  },
  {
    name: 'Accept telehealth request',
    route: '/telehealth/requests/:id/accept',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Accepts a telehealth request for the given request ID and moves it to consultant acceptance flow.',
  },
  {
    name: 'Complete telehealth request with consultation note',
    route: '/telehealth/requests/:id/complete',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Completes the telehealth request and records consultant notes for EMR visibility.',
  },
  {
    name: 'Reject telehealth request',
    route: '/telehealth/requests/:id/reject',
    guards: ['JwtUserAuthGuard'],
    method: 'PATCH',
    module: 'Telehealth',
    description:
      'Rejects a telehealth request for the given request ID with an optional rejection reason.',
  },
  {
    name: 'Get telehealth request by appointment service ID',
    route: '/telehealth/appointment-services/:appointmentServiceId/requests',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Telehealth',
    description:
      'Returns the telehealth request for a given appointment service, scoped to the logged-in primary doctor. Includes the consultation note if the request is completed.',
  },
];

const defaultVaccinatorPayload: PermissionPayloadItem[] = [
  ...defaultUserPayload,
  {
    name: 'Retrieve a paginated list of vaccines',
    route: '/immunisation/vaccines',
    guards: ['JwtOrAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns a list of vaccines filtered by optional parameters.',
  },
  {
    name: 'Create immunisation record',
    route: '/immunisation/',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Creates a new immunisation record for a patient visit using immunisation card details.',
  },
  {
    name: 'Get immunisation by patient and appointment service',
    route: '/immunisation/patient',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description:
      'Fetches immunisation details for a patient and appointment service.',
  },
  {
    name: 'Retrieve patient immunisation summaries',
    route: '/immunisation/patient-immunisations',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns patient immunisation summary records filtered by status.',
  },
  {
    name: 'Add patient immunisation remarks',
    route: '/immunisation/patient-immunisations/remarks',
    guards: ['JwtUserAuthGuard'],
    method: 'POST',
    module: 'Immunisation',
    description:
      'Adds remarks to the latest patient immunisation record if empty.',
  },
  {
    name: 'Sync patient immunisation data',
    route: '/immunisation/sync',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description:
      'Fetches patient immunisation records with patient and immunisation relations.',
  },
  {
    name: 'Retrieve immunisation metadata',
    route: '/immunisation/metadata',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns metadata related to immunisation records.',
  },
  {
    name: 'Retrieve patients with immunisation records',
    route: '/immunisation/patients-with-immunisation',
    guards: ['JwtUserAuthGuard'],
    method: 'GET',
    module: 'Immunisation',
    description: 'Returns a list of patients who have immunisation records.',
  },
];

const roleDefaultPayloads: Record<string, PermissionPayloadItem[]> = {
  [RoleName.REGISTRATION_CLERK]: defaultRegistrationClerkPayload,
  [RoleName.FACILITY_INCHARGE]: defaultFacilityInchargePayload,
  [RoleName.HEAD_OFFICE]: defaultHeadOfficePayload,
  [RoleName.ADMIN]: defaultAdminPayload,
  [RoleName.SUPER_ADMIN]: defaultAdminPayload,
};

export function getDefaultPayloadForRole(
  roleName: string,
): PermissionPayloadItem[] {
  return roleDefaultPayloads[roleName] ?? defaultUserPayload;
}

export {
  defaultAdminPayload,
  defaultUserPayload,
  defaultRegistrationClerkPayload,
  defaultFacilityInchargePayload,
  defaultSbaPayload,
  defaultMedicalOfficerFemalePayload,
  defaultMedicalOfficerMalePayload,
  defaultDispenserPayload,
  defaultPaedsPayload,
  defaultTelehealthConsultantPayload,
  defaultVaccinatorPayload,
  defaultHeadOfficePayload,
};
