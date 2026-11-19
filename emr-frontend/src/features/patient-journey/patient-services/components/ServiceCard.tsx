import React, { useMemo, useRef } from "react";
import { Button, Card, Modal } from "antd";
import Title from "@/components/shared/Title";
import { SERVICES } from "@/config/servicesConfig";
import {
  useDispatchAppointmentMutation,
  useStartAppointmentMutation,
} from "@/features/patient-journey/services/appointementServiceStatusApi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useDispatch } from "react-redux";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import {
  SERVICES_STATUS,
  VISIT_STATUS,
} from "@/features/patient-journey/data/constants";
import { useNavigate } from "react-router-dom";
import { HttpStatus, Roles } from "@/data/types";
import { ROUTES } from "@/data/routes";
import { getAgeInYears } from "@/utils/ageCalculator";
import Loader from "@/components/shared/Loader";

type ServiceEligibility = {
  minAge: number;
  gender: string | null;
  maxAge?: number;
  femaleAllAges?: boolean;
};

const SERVICE_ELIGIBILITY: Record<string, ServiceEligibility> = {
  ANC: { minAge: 14, gender: "Female" },
  PNC: { minAge: 14, gender: "Female" },
  DELIVERY: { minAge: 14, gender: "Female" },
  IMMUNISATION: { minAge: 0, gender: null, maxAge: 5, femaleAllAges: true },
  FAMILY_PLANNING: { minAge: 14, gender: "Female" },
  MEDICINE_DISPENSING: { minAge: 0, gender: null },
  NUTRITION: { minAge: 0, gender: null },
  OPD: { minAge: 0, gender: null },
};

const isPatientEligibleForService = (
  serviceName: string,
  patientAge: number,
  patientGender: string,
): boolean => {
  const normalizedServiceName = serviceName.toUpperCase().replace(/\s+/g, "_");
  const eligibility = SERVICE_ELIGIBILITY[normalizedServiceName];

  if (!eligibility) {
    return true;
  }

  if (patientAge < eligibility.minAge) {
    return false;
  }
  const isFemale = patientGender?.toLowerCase() === "female";

  if (eligibility.maxAge !== undefined && patientAge > eligibility.maxAge) {
    if (!(eligibility.femaleAllAges && isFemale)) {
      return false;
    }
  }

  if (
    eligibility.gender &&
    patientGender?.toLowerCase() !== eligibility.gender.toLowerCase()
  ) {
    return false;
  }

  return true;
};
const ServiceCard: React.FC = () => {
  const navigate = useNavigate();
  const [startAppointment, { isLoading: isServiceStarting }] =
    useStartAppointmentMutation();
  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );
  const userServices = useSelector(
    (state: RootState) => state.authUser.userServices,
  );
  const [dispatchAppointment, { isLoading: isDispatching }] =
    useDispatchAppointmentMutation();

  const showNotification = useGlobalNotification();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.authUser.user);
  const isVaccinator = user?.role?.name === Roles.VACCINATOR;
  const isProcessingRef = useRef(false);

  const isVisitDispatched = useMemo(() => {
    return selectedPatientData?.visit?.status == VISIT_STATUS.DISPATCHED;
  }, [selectedPatientData?.visit?.status]);

  const patientAge = useMemo(() => {
    if (selectedPatientData?.patientData?.dob) {
      return getAgeInYears(selectedPatientData.patientData?.dob);
    }
    return null;
  }, [selectedPatientData?.patientData?.dob]);

  const patientGender = useMemo(() => {
    return selectedPatientData?.patientData?.gender;
  }, [selectedPatientData?.patientData?.gender]);

  const availableServices = useMemo(() => {
    if (!userServices || userServices.length === 0) {
      return SERVICES;
    }
    const userServicenames = new Set(
      userServices.map((service) => service.name?.toUpperCase()),
    );

    let filteredServices = SERVICES.filter((service) =>
      userServicenames.has(service.name),
    );

    if (patientAge !== null && patientGender) {
      filteredServices = filteredServices.filter((service) =>
        isPatientEligibleForService(service.name, patientAge, patientGender),
      );
    }

    return filteredServices;
  }, [userServices, patientAge, patientGender]);

  // ES-771
  // All paths which do not navigate successfully now throw errors which are caught by the handleServiceClickWrapper
  // When handleServiceClickWrapper catches those errors, it sets isProcessingRef.current = false
  // Otherwise isProcessingRef.current === true, which prevents running handleServiceClick in quick succession (double-clicks)
  const handleServiceClick = async (selectedService: Record<string, any>) => {
    const matchedUserServiceId = userServices?.find(
      (service) => service.name?.toUpperCase() === selectedService.name,
    );

    if (!matchedUserServiceId) {
      showNotification(
        "error",
        "Service does not exist",
        "Selected service not found for user.",
      );

      throw new Error("Service does not exist");
    }

    const serviceIdToUse = matchedUserServiceId?.id;

    // Check if this service already exists for the appointment
    const serviceToBSelected = selectedPatientData?.appointmentServices?.find(
      (item: any) => item.service?.name === selectedService.name,
    );

    // If visit is dispatched, only allow completed services
    if (isVisitDispatched) {
      if (serviceToBSelected?.status === SERVICES_STATUS.COMPLETED) {
        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            selectedServiceIdFromCard: Number(serviceIdToUse),
            selectedServiceRoute: selectedService.route,
          }),
        );
        navigate(selectedService.route);
        return;
      } else {
        showNotification(
          "info",
          "Visit Dispatched",
          "This visit has been dispatched. Only completed services can be viewed.",
        );

        throw new Error("Visit Dispatched");
      }
    }

    // If service is completed, navigate to it
    if (serviceToBSelected?.status === SERVICES_STATUS.COMPLETED) {
      dispatch(
        setSelectedPatientData({
          ...selectedPatientData,
          selectedServiceIdFromCard: Number(serviceIdToUse),
          selectedServiceRoute: selectedService.route,
        }),
      );

      navigate(selectedService.route);
      return;
    }

    // If service is in progress, resume it
    if (serviceToBSelected?.status === SERVICES_STATUS.IN_PROGRESS) {
      showNotification(
        "success",
        "Patient Appointment",
        `Appointment ${SERVICES_STATUS.CONTINUE} for patient ${selectedPatientData?.name} in ${selectedService.displayName} service`,
      );
      dispatch(
        setSelectedPatientData({
          ...selectedPatientData,
          selectedServiceIdFromCard: Number(serviceIdToUse),
          selectedServiceRoute: selectedService.route,
        }),
      );
      navigate(selectedService.route);
      return;
    }

    // Otherwise, start the appointment (first time)
    try {
      const res = await startAppointment({
        appointmentId: Number(selectedPatientData?.appointmentId),
        serviceId: Number(serviceIdToUse),
      }).unwrap();

      if (res?.status === HttpStatus.OK) {
        const { data } = res;

        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            selectedServiceIdFromCard: Number(serviceIdToUse),
            selectedServiceRoute: selectedService.route,
            appointmentServices: data?.appointmentServices ?? [],
            appointmentStatus: data?.status,
            visit: data?.visit,
          }),
        );

        showNotification(
          "success",
          "Patient Appointment",
          `Appointment ${
            serviceToBSelected?.status === SERVICES_STATUS.PAUSED
              ? SERVICES_STATUS.RESUMED
              : SERVICES_STATUS.STARTED
          } for patient ${selectedPatientData?.name} in ${
            selectedService.displayName
          } service`,
        );

        navigate(selectedService.route);
      } else {
        throw new Error(res?.message || "Could not start the service.");
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error.message || "An error occurred while starting the service.";
      showNotification("error", "Service Start Failed", errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleServiceClickWrapper = async (
    selectedService: Record<string, any>,
  ) => {
    if (isProcessingRef.current || isServiceStarting || isDispatching) return;
    isProcessingRef.current = true;

    try {
      await handleServiceClick(selectedService);
    } catch (error: any) {
      isProcessingRef.current = false;
    }
  };

  const handleCompleteVisit = async () => {
    try {
      const res = await dispatchAppointment({
        appointmentId: Number(selectedPatientData?.appointmentId),
      }).unwrap();

      if (res?.status === HttpStatus.OK) {
        const { data } = res;
        navigate(ROUTES.PATIENT_QUEUE);
        showNotification(
          "success",
          "Visit Completed",
          `Visit for patient ${selectedPatientData?.name} has been dispatched successfully.`,
        );

        dispatch(
          setSelectedPatientData({
            ...selectedPatientData,
            visit: {
              ...selectedPatientData?.visit,
              status: data?.status || VISIT_STATUS.DISPATCHED,
            },
            appointmentStatus: data?.status,
          }),
        );
      } else {
        showNotification(
          "info",
          "Visit Completion",
          res?.message || "Could not complete the visit.",
        );
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || "An error occurred while completing the visit.";
      showNotification("error", "Visit Completion Failed", errorMessage);
    }
  };

  if (isServiceStarting || isDispatching) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {availableServices.map((service) => {
          const isSelected =
            selectedPatientData?.appointmentServices?.some(
              (item: any) => service?.name === item?.service?.name,
            ) ?? false;

          const hasCompletedService =
            selectedPatientData?.appointmentServices?.some(
              (service: any) =>
                service?.status?.toLowerCase() === SERVICES_STATUS.COMPLETED,
            );

          const serviceStatus = selectedPatientData?.appointmentServices?.find(
            (item: any) => service?.name === item?.service?.name,
          )?.status;

          // If visit is dispatched, only enable completed services
          let isDisabled;
          if (isVisitDispatched) {
            isDisabled =
              serviceStatus?.toLowerCase() !== SERVICES_STATUS.COMPLETED;
          } else if (hasCompletedService) {
            isDisabled = false;
          } else {
            isDisabled = !isSelected;
          }
          isDisabled = isDisabled || isServiceStarting || isDispatching;

          return (
            <Card
              key={service.name}
              onClick={() => !isDisabled && handleServiceClickWrapper(service)}
              className={`h-40 flex flex-col items-center justify-center text-center
    ${
      isDisabled
        ? "opacity-70 cursor-not-allowed hover:scale-100 hover:shadow-none"
        : "cursor-pointer hover:scale-105 hover:shadow-green-custom ring-2 ring-[var(--color-green-custom)]"
    }`}
              style={{ background: "rgba(0, 0, 0, 0.02)" }}
            >
              <div style={{ color: service.color }}>{service.icon}</div>
              <Title
                className={`!mb-0 ${
                  isSelected
                    ? "text-[var(--color-green-custom)]"
                    : "text-[var(--color-gray-custom)]"
                }`}
                level={4}
                text={service.displayName}
              />
              <p className="mt-2 text-gray-500 text-center px-2">
                {service.description}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Buttons Row */}
      <div className="flex justify-center md:justify-end gap-4 mt-6 mb-6">
        {!isVaccinator && (
          <Button
            type="primary"
            disabled={isVisitDispatched}
            onClick={() =>
              navigate(ROUTES.REFERRAL, {
                state: { patientId: selectedPatientData?.id },
              })
            }
          >
            Refer patient
          </Button>
        )}

        <Button
          type="primary"
          loading={isDispatching}
          disabled={isVisitDispatched}
          onClick={() =>
            Modal.confirm({
              title: "Complete Visit?",
              content: "Are you sure you want to complete this visit?",
              okText: "Yes",
              cancelText: "No",
              onOk: handleCompleteVisit,
            })
          }
        >
          {isVisitDispatched ? "Visit Dispatched" : "Complete visit"}
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
