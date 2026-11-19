import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Default: localStorage
import { combineReducers, UnknownAction } from "redux";
import { resetStore } from "@/redux/store/actions";

// Import your reducers and API services
import authReducer from "@/redux/store/slices/authUserSlice";
import PatientRecordReducer from "@/redux/store/slices/patientSlice";
import appNotificationsReducer from "@/redux/store/slices/appNotificationsSlice";

import routesReducer from "@/redux/store/slices/routeSice";
import formDataReducer from "@/redux/store/slices/formDataSlice";
import adminAuthReducer from "@/redux/store/slices/authAdminSlice";
import followUpReducer from "@/redux/store/slices/followUpRedux";
import { authApiService } from "@/features/auth/services/authApiServices";
import { searchPatientService } from "@/features/searchPatient/services/searchpatientservcies";
import { facilitiesApiService } from "@/features/admin/services/facilitiesApi";
import { getRolePermissionsApiService } from "@/features/admin/services/rolePermissionsApi";
import { rolePermissionApiService } from "@/features/admin/services/createPermissionApi";
import { routesApiService } from "@/services/routesApiService";
import { roleApiService } from "@/services/roleApiServices";
import { userApiService } from "@/features/admin/services/usersApiService";
import { userPermissionApiService } from "@/features/admin/services/createPermissionApi";
import { patientApiService } from "@/features/registerpatient/services/patientRegisterServices";
import { locationApiService } from "@/services/locationsApiServices";
import { referralApiService } from "@/features/referrals/services/ReferralApiServices";
import { appointmentApiService } from "@/features/patientQueue/services/queueApi";
import { userServicesApi } from "@/features/admin/services/UserServices";
import { patientProfileApi } from "@/features/patient-journey/services/patientProfileApi";
import { ancServiceApi } from "@/features/patient-journey/services/ancServiceApi";
import { pncServiceApi } from "@/features/patient-journey/services/pncServiceApi";
import { vitalsServiceApi } from "@/features/patient-journey/services/vitalServiceApi";
import { appointmentServiceStatusApi } from "@/features/patient-journey/services/appointementServiceStatusApi";
import { adminAppointmentApiService } from "@/features/admin/services/appointmentTrackerApi";
import { medicineApi } from "@/services/medicineApi";
import { familyPlanningApiService } from "@/features/patient-journey/services/familyplanningApi";
import { opdServiceApi } from "@/features/patient-journey/services/opdServiceApi";
import { nutritionServiceApi } from "@/features/patient-journey/services/nutritionServiceApi";
import { nutritionAdvisorApi } from "@/features/patient-journey/services/nutritionAdvisorApi";
import { attendanceApiService } from "@/features/attendance/services/attendanceApiServices";
import { leaveApiService } from "@/features/admin/services/applyLeaveApi";
import { userLeaveApiService } from "@/features/leaves/services/leaveApiService";
import { deliveryServiceApi } from "@/features/patient-journey/services/deliveryServiceApi";
import { dispenserApiService } from "@/features/patient-journey/services/dispenserApi";
import { medicineBatchApiService } from "@/features/admin/services/medicineBatchesApi";
import { immunisationServiceApi } from "@/features/patient-journey/services/immunisationServiceApi";
import { immunisationAdminApi } from "@/features/admin/services/immunisationAdmin";
import { commodityRequestApiService } from "@/features/medicine-commodities/services/medicinecommoditiyApi";
import { medicineInventoryApiService } from "@/features/inventory/service/medicineInventoryApi";
import { auditLogsApiService } from "@/features/admin/services/auditLogsApi";
import { adminAttendanceApiService } from "@/features/admin/facilityAttendance/services/attendanceApiServices";
import { emergencyApiService } from "@/features/emergency/services/emergencyApi";
import { transferPatientApi } from "@/services/transferPatientApi";
import { dashboardApiService } from "@/features/admin/services/dashboardService";
import { reportingApiService } from "@/features/admin/services/reports";
import { doctorsApiService } from "@/services/doctorsByFacilityApi";
import { guidelinesApi } from "@/services/guidelinesApi";
import { getVaccinesApi } from "@/features/admin/services/getVaccinesApi";
import { passwordApiService } from "@/features/auth/services/passwordApiService";


// Combine reducers (including RTK Query reducers)
const appReducer = combineReducers({
  authUser: authReducer,
  route: routesReducer,
  authAdmin: adminAuthReducer,
  patientRecords: PatientRecordReducer,
  appNotifications: appNotificationsReducer,
  formData: formDataReducer,
  followUpDecision: followUpReducer,
  [authApiService.reducerPath]: authApiService.reducer,
  [searchPatientService.reducerPath]: searchPatientService.reducer,
  [facilitiesApiService.reducerPath]: facilitiesApiService.reducer,
  [routesApiService.reducerPath]: routesApiService.reducer,
  [familyPlanningApiService.reducerPath]: familyPlanningApiService.reducer,
  [rolePermissionApiService.reducerPath]: rolePermissionApiService.reducer,
  [roleApiService.reducerPath]: roleApiService.reducer,
  [userApiService.reducerPath]: userApiService.reducer,
  [userPermissionApiService.reducerPath]: userPermissionApiService.reducer,
  [getRolePermissionsApiService.reducerPath]:
    getRolePermissionsApiService.reducer,
  [patientApiService.reducerPath]: patientApiService.reducer,
  [locationApiService.reducerPath]: locationApiService.reducer,
  [referralApiService.reducerPath]: referralApiService.reducer,
  [appointmentApiService.reducerPath]: appointmentApiService.reducer,
  [userServicesApi.reducerPath]: userServicesApi.reducer,
  [patientProfileApi.reducerPath]: patientProfileApi.reducer,
  [ancServiceApi.reducerPath]: ancServiceApi.reducer,
  [vitalsServiceApi.reducerPath]: vitalsServiceApi.reducer,
  [appointmentServiceStatusApi.reducerPath]:
    appointmentServiceStatusApi.reducer,
  [adminAppointmentApiService.reducerPath]: adminAppointmentApiService.reducer,
  [pncServiceApi.reducerPath]: pncServiceApi.reducer,
  [medicineApi.reducerPath]: medicineApi.reducer,
  [opdServiceApi.reducerPath]: opdServiceApi.reducer,
  [nutritionServiceApi.reducerPath]: nutritionServiceApi.reducer,
  [nutritionAdvisorApi.reducerPath]: nutritionAdvisorApi.reducer,
  [attendanceApiService.reducerPath]: attendanceApiService.reducer,
  [leaveApiService.reducerPath]: leaveApiService.reducer,
  [userLeaveApiService.reducerPath]: userLeaveApiService.reducer,
  [deliveryServiceApi.reducerPath]: deliveryServiceApi.reducer,
  [dispenserApiService.reducerPath]: dispenserApiService.reducer,
  [medicineBatchApiService.reducerPath]: medicineBatchApiService.reducer,
  [immunisationServiceApi.reducerPath]: immunisationServiceApi.reducer,
  [immunisationAdminApi.reducerPath]: immunisationAdminApi.reducer,
  [commodityRequestApiService.reducerPath]: commodityRequestApiService.reducer,
  [medicineInventoryApiService.reducerPath]:
    medicineInventoryApiService.reducer,
  [auditLogsApiService.reducerPath]: auditLogsApiService.reducer,
  [adminAttendanceApiService.reducerPath]: adminAttendanceApiService.reducer,
  [emergencyApiService.reducerPath]: emergencyApiService.reducer,
  [transferPatientApi.reducerPath]: transferPatientApi.reducer,
  [dashboardApiService.reducerPath]: dashboardApiService.reducer,
  [reportingApiService.reducerPath]: reportingApiService.reducer,
  [doctorsApiService.reducerPath]: doctorsApiService.reducer,
  [guidelinesApi.reducerPath]: guidelinesApi.reducer,
  [getVaccinesApi.reducerPath]: getVaccinesApi.reducer,
  [passwordApiService.reducerPath]: passwordApiService.reducer,
});

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: UnknownAction,
) => {
  if (resetStore.match(action)) {
    state = undefined;
  }

  return appReducer(state, action);
};

// Persist config (only persist the 'auth' slice)
const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "authUser",
    "authAdmin",
    "route",
    "patientRecords",
    "appNotifications",
    "formData",
    "followUpDecision",
  ], // Only persist auth state
  // blacklist: [authApiService.reducerPath] // Alternative: Exclude RTK Query cache
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"], // Fix for Redux Persist
        warnAfter: 100,
      },
    }).concat(
      authApiService.middleware,
      searchPatientService.middleware,
      facilitiesApiService.middleware,
      roleApiService.middleware,
      routesApiService.middleware,
      rolePermissionApiService.middleware,
      userApiService.middleware,
      userPermissionApiService.middleware,
      getRolePermissionsApiService.middleware,
      locationApiService.middleware,
      familyPlanningApiService.middleware,
      patientApiService.middleware,
      referralApiService.middleware,
      appointmentApiService.middleware,
      userServicesApi.middleware,
      patientProfileApi.middleware,
      ancServiceApi.middleware,
      vitalsServiceApi.middleware,
      appointmentServiceStatusApi.middleware,
      adminAppointmentApiService.middleware,
      pncServiceApi.middleware,
      medicineApi.middleware,
      opdServiceApi.middleware,
      nutritionServiceApi.middleware,
      nutritionAdvisorApi.middleware,
      attendanceApiService.middleware,
      leaveApiService.middleware,
      userLeaveApiService.middleware,
      deliveryServiceApi.middleware,
      dispenserApiService.middleware,
      medicineBatchApiService.middleware,
      immunisationServiceApi.middleware,
      immunisationAdminApi.middleware,
      commodityRequestApiService.middleware,
      medicineInventoryApiService.middleware,
      auditLogsApiService.middleware,
      adminAttendanceApiService.middleware,
      emergencyApiService.middleware,
      transferPatientApi.middleware,
      dashboardApiService.middleware,
      reportingApiService.middleware,
      doctorsApiService.middleware,
      guidelinesApi.middleware,
      getVaccinesApi.middleware,
      passwordApiService.middleware,
    ),
});

export const persistor = persistStore(store); // Used in PersistGate
export type RootState = ReturnType<typeof store.getState>;
