import { ServiceType, SERVICES_STATUS } from "../data/constants";
import { clearFormData } from "@/redux/store/slices/formDataSlice";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";

export const completeDeliveryService = ({
  dispatch,
  selectedPatientData,
  response,
  patientId,
}: {
  dispatch: any;
  selectedPatientData: any;
  response: any;
  patientId: number;
}) => {
  // Find existing delivery service (if any)
  const existingDeliveryService =
    selectedPatientData?.appointmentServices?.find(
      (s: any) => s.service?.name === ServiceType.DELIVERY
    );

  // Create delivery service summary
  const deliveryServiceSummary = {
    id: response?.id ?? existingDeliveryService?.id,
    status: SERVICES_STATUS.COMPLETED,
    service: {
      id: selectedPatientData?.selectedServiceIdFromCard,
      name: ServiceType.DELIVERY,
    },
  };

  // Get existing services array
  const existingServices = selectedPatientData?.appointmentServices || [];

  // Update or add delivery service (prevents duplicates)
  const updatedAppointmentServices = existingServices.some(
    (s: any) => s.service?.name === ServiceType.DELIVERY
  )
    ? existingServices.map((s: any) =>
        s.service?.name === ServiceType.DELIVERY
          ? { ...s, ...deliveryServiceSummary }
          : s
      )
    : [...existingServices, deliveryServiceSummary];

  // Dispatch updated state to Redux
  dispatch(
    setSelectedPatientData({
      ...selectedPatientData,
      appointmentServices: updatedAppointmentServices,
      appointmentStatus: SERVICES_STATUS.COMPLETED,
    })
  );

  // Clear form draft
  dispatch(
    clearFormData({
      formKey: "deliveryForm",
      patientId,
    })
  );
};


