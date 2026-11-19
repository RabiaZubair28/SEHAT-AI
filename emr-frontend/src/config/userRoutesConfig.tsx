import React from "react";
import { ROUTES } from "@/data/routes";
import { Roles } from "@/data/types";
import Delivery from "@/features/patient-journey/delivery";
import Immunisation from "@/features/patient-journey/immunisation";
import RequestedCommoditiesDetails from "@/features/medicine-commodities/requested-medicine-commodities/components/RequestedCommoditiesDetails";

// Lazy-loaded pages

//BaseLayout
const AppLayout = React.lazy(() => import("@/pages/AppLayout"));

//Home Pages
const SearchPatientPage = React.lazy(() => import("@/pages/SearchPatient"));
const PatientRegistrationPage = React.lazy(
  () => import("@/pages/PatientRegistration")
);

const RefferalsPage = React.lazy(() => import("@/pages/Referrals"));
const PatientQueuePage = React.lazy(() => import("@/pages/PatientQueue"));
const PatientProfileLayoutPage = React.lazy(
  () => import("@/pages/patient-journey/PatientProfileLayout")
);

//Dispenser
const RequestedCommodityPage = React.lazy(
  () => import("@/pages/RequestedCommoditiesPage")
);

//Generate New Medicine Request
const NewCommodityRequestPage = React.lazy(
  () => import("@/pages/NewCommodityRequestPage")
);

//Patient-profle
const PatientProfilePage = React.lazy(
  () => import("@/pages/patient-journey/Patient-Profile")
);
const VitalsPage = React.lazy(() => import("@/pages/patient-journey/Vitals"));

//Service Page
const Service = React.lazy(() => import("@/pages/patient-journey/services"));

//Services Pages
const PatientDispensingPage = React.lazy(
  () => import("@/pages/patient-journey/Patient-Dispensing")
);

const FamilyPlanning = React.lazy(
  () => import("@/pages/patient-journey/FamilyPlanning")
);

const NutritionPage = React.lazy(
  () => import("@/pages/patient-journey/NutritionPage")
);

//User's Attendance //
const UserAttendance = React.lazy(() => import("@/pages/Attendance"));
const UserLeaves = React.lazy(() => import("@/features/leaves"));

const Anc = React.lazy(() => import("@/pages/patient-journey/Anc"));
const Pnc = React.lazy(() => import("@/pages/patient-journey/Pnc"));
const Opd = React.lazy(() => import("@/pages/patient-journey/Opd"));
const EmergencyPage = React.lazy(() => import("@/pages/Emergency"));
// Utility function to wrap components with role-based access control

//Inventory
const InventoryManagementPage = React.lazy(
  () => import("@/pages/InventoryManagementPage")
);

const AkuhGuidelinesPage = React.lazy(() => import("@/pages/AkuhGuidelines"));
const NutritionReviewsPage = React.lazy(() => import("@/pages/NutritionReviews"));

//Medicine Batches (Dispenser)
const StockManagementPage = React.lazy(
  () => import("@/pages/admin/StockManagement")
);
const NewMedicineBatchRequestPage = React.lazy(
  () => import("@/features/admin/stockmanagement/newBatchesRequest/index")
);

// Route configuration array
export const userRoutes = [
  {
    path: "/",
    element: AppLayout,
    roles: [
      Roles.MEDICAL_OFFICER_MALE,
      Roles.MEDICAL_OFFICER_FEMALE,
      Roles.FRONT_DESK,
      Roles.LHV,
      Roles.VACCINATOR,
      Roles.SBA,
      Roles.DISPENSER,
      Roles.PAEDS,
      Roles.TELEHEALTH_CONSULTANT
    ],
    children: [
      {
        path: ROUTES.SEARCH_PATIENT,
        element: SearchPatientPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },
      {
        path: ROUTES.PATIENT_REGISTER,
        element: PatientRegistrationPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },
      {
        path: ROUTES.ATTENDANCE,
        element: UserAttendance,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.FRONT_DESK,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },
      {
        path: ROUTES.LEAVE,
        element: UserLeaves,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },
      {
        path: ROUTES.REFERRAL,
        element: RefferalsPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },

      {
        path: ROUTES.EMERGENCY,
        element: EmergencyPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },

      {
        path: ROUTES.PATIENT_QUEUE,
        element: PatientQueuePage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.LHV,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.VACCINATOR,
          Roles.DISPENSER,
          Roles.SBA,
          Roles.FRONT_DESK,
          Roles.PAEDS,
          Roles.TELEHEALTH_CONSULTANT
        ],
      },
      {
        path: ROUTES.NEW_COMMODITY_REQUESTS,
        element: NewCommodityRequestPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.LHV,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: ROUTES.COMMODITY_REQUESTS,
        element: RequestedCommodityPage,
        roles: [
          Roles.DISPENSER,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.MEDICAL_OFFICER_MALE,
          Roles.SBA,
          Roles.VACCINATOR,
          Roles.LHV,
          Roles.PAEDS,
   
        ],
      },
      {
        path: ROUTES.NUTRITION_REVIEWS,
        element: NutritionReviewsPage,
        roles: [Roles.MEDICAL_OFFICER_MALE, Roles.MEDICAL_OFFICER_FEMALE],
      },
      {
        path: ROUTES.AKUH_GUIDELINES,
        element: AkuhGuidelinesPage,
        roles: [
          Roles.FRONT_DESK,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.PAEDS,
          Roles.LHV,
          Roles.SBA,
          Roles.TELEHEALTH_CONSULTANT,
        ],
      },
      {
        path: ROUTES.INVENTORY,
        element: InventoryManagementPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.FRONT_DESK,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
         
        ],
      },
      {
        path: `${ROUTES.COMMODITY_REQUESTS}/:requestId/${ROUTES.REQUESTED_MEDICINES_DETAILS}`, // Use the constant here
        element: RequestedCommoditiesDetails, // Use the correct component
        roles: [
          Roles.DISPENSER,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.MEDICAL_OFFICER_MALE,
          Roles.SBA,
          Roles.VACCINATOR,
          Roles.LHV,
          Roles.PAEDS,

        ],
      },
      {
        path: ROUTES.MEDICINE_BATCHES,
        element: StockManagementPage,
        roles: [Roles.DISPENSER],
      },
      {
        path: ROUTES.MEDICINE_BATCHES_NEW_REQUEST,
        element: NewMedicineBatchRequestPage,
        roles: [Roles.DISPENSER],
      },
    ],
  },
  {
    // path: "/queue/:patientId",
    path: `${ROUTES.PATIENT_MODULE}/:patientId`,
    element: PatientProfileLayoutPage,
    roles: [
      Roles.FRONT_DESK,
      Roles.MEDICAL_OFFICER_MALE,
      Roles.LHV,
      Roles.VACCINATOR,
      Roles.SBA,
      Roles.MEDICAL_OFFICER_FEMALE,
      Roles.DISPENSER,
      Roles.PAEDS,
    ],
    children: [
      {
        // path: "patient-profile",
        path: ROUTES.PATIENT_PROFILE,
        element: PatientProfilePage,
        roles: [
          Roles.FRONT_DESK,
          Roles.MEDICAL_OFFICER_MALE,
          Roles.LHV,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
        ],
      },
      {
        path: ROUTES.SERVICES,
        element: Service,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.ANC}`,
        element: Anc,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.NUTRITION}`,
        element: NutritionPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.FAMIlY_PLANNING}`,
        element: FamilyPlanning,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: ROUTES.PATIENT_PROFILE_REFFERAL,
        element: RefferalsPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.DISPENSER,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.MEDICINE_DISPENSING}`,
        element: PatientDispensingPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.DISPENSER,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.PNC}`,
        element: Pnc,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.OPD}`,
        element: Opd,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.OPD}`,
        element: Opd,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.DELIVERY}`,
        element: Delivery,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
      {
        path: `${ROUTES.SERVICES}/${ROUTES.IMMUNIZATION}`,
        element: Immunisation,
        roles: [
          Roles.VACCINATOR,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.SBA,
          Roles.MEDICAL_OFFICER_MALE,
          Roles.PAEDS,
        ],
      },
      {
        path: ROUTES.VITALS,
        element: VitalsPage,
        roles: [
          Roles.MEDICAL_OFFICER_MALE,
          Roles.MEDICAL_OFFICER_FEMALE,
          Roles.LHV,
          Roles.VACCINATOR,
          Roles.SBA,
          Roles.PAEDS,
        ],
      },
    ],
  },
];
