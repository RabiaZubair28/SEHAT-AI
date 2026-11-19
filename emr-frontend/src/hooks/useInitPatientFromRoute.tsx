import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGlobalNotification } from "./useNotification";

export const useInitPatientFromRoute = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();

  const selectedPatient = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData
  );

  const hasRedirectedRef = useRef(false);

  const wrongPatientId =
    (patientId && Number(patientId) !== Number(selectedPatient?.id)) ||
    !selectedPatient;

  useEffect(() => {
    if (wrongPatientId && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      showNotification(
        "error",
        "Wrong Patient Selected",
        "Conflict in patient selection. Please select the patient from queue."
      );
      navigate(`/queue`, { replace: true });
      return;
    }

    const pathMatch = location.pathname.match(
      /^\/patient\/\d+\/services(\/.*)?/
    );

    const isDeepRoute = !!pathMatch?.[1];

    const selectedServiceId = selectedPatient?.selectedServiceIdFromCard;

    // Redirect if pending service is selected
    if (!selectedServiceId && isDeepRoute && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      showNotification(
        "warning",
        "Appointment not started",
        "Please select the service from services and start appointment of patient."
      );
      navigate(`/patient/${patientId}/services`, { replace: true });
      return;
    }

    const rawRoute = pathMatch?.[1] || ""; // e.g. "/pnc"
    const currentRoute = rawRoute
      ? rawRoute.replace(/^\//, "")?.toLowerCase()
      : "";

    const selectedRoute = String(
      selectedPatient?.selectedServiceRoute ?? ""
    ).toLowerCase();

    if (currentRoute && currentRoute !== selectedRoute && selectedServiceId) {
      // Redirect back to correct service
      navigate(`/patient/${selectedPatient?.id}/services/${selectedRoute}`);
    }
  }, [location.pathname]);
};
