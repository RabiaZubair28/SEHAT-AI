import { Tooltip, Row, Col, Grid, Button, Tag } from "antd";
import IconButton from "../shared/IconButton";
import PersonInfoCard from "./PatientInfoCard";
import Title from "@/components/shared/Title";
import backIcon from "@/assets/layout/back.png";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import testing from "@/assets/testing.svg";
import { PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { calculateAgeByDob } from "@/utils/ageCalculator";
import {
  useStartAppointmentMutation,
  usePauseAppointmentMutation,
} from "@/features/patient-journey/services/appointementServiceStatusApi";
import { SERVICES_STATUS } from "@/features/patient-journey/data/constants";
import { useGlobalNotification } from "@/hooks/useNotification";
import Loader from "../shared/Loader";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { ROUTES } from "@/data/routes";

interface TopBarProps {
  title: string;
  showIconButton?: boolean;
  onIconClick?: () => void;
  showPatientInfo?: boolean;
  patientInfo?: {
    imageSrc: string;
    name: string;
    mrNumber: string;
    age: string;
  };
  extraActions?: React.ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  showIconButton = false,
  onIconClick,
  showPatientInfo = false,
  extraActions,
}) => {
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const dispatch = useDispatch();
  const showAppointmentStatus =
    location.pathname.includes("/services/") &&
    location.pathname.split("/services/")[1]?.length > 0;

  const navigate = useNavigate();

  const selectedPatientData = useSelector(
    (state: RootState) => state.patientRecords.selectedPatientData,
  );

  const dob = calculateAgeByDob(selectedPatientData?.patientData?.dob);

  // RTK Query mutations
  const [startAppointment, { isLoading: isStarting }] =
    useStartAppointmentMutation();
  const [pauseAppointment, { isLoading: isPausing }] =
    usePauseAppointmentMutation();

  const appointmentId = selectedPatientData?.appointmentId;
  const selectedService = selectedPatientData?.appointmentServices?.find(
    (item: any) =>
      item.service.id === selectedPatientData?.selectedServiceIdFromCard,
  );

  const showNotification = useGlobalNotification();

  const handleToggleAppointment = async () => {
    if (!appointmentId || !selectedService) {
      console.error("Appointment or Service ID not found");
      return;
    }

    let serviceId = selectedService.service?.id;
    if (!serviceId) {
      console.error("Service ID not found");
      return;
    }

    try {
      if (selectedService?.status === SERVICES_STATUS.PAUSED) {
        // Start the appointment
        let response = await startAppointment({
          appointmentId,
          serviceId,
        }).unwrap();

        dispatch(setSelectedPatientData(response));

        showNotification(
          "success",
          "Patient Appointment Res",
          `Appointment ${SERVICES_STATUS.RESUMED} for patient ${selectedPatientData?.name} in ${selectedService?.service?.name} service`,
        );
      } else if (selectedService?.status === SERVICES_STATUS.IN_PROGRESS) {
        // Pause the appointment
        let response = await pauseAppointment({
          appointmentId,
          serviceId,
        }).unwrap();

        dispatch(setSelectedPatientData(response));
        navigate(ROUTES.PATIENT_QUEUE);

        showNotification(
          "success",
          "Patient Appointment Paused",
          `Appointment ${SERVICES_STATUS.PAUSED} for patient ${selectedPatientData?.name} in ${selectedService?.service?.name} service`,
        );
      }
    } catch (error: any) {
      showNotification(
        "error",
        "Patient Appointment Issue",
        error?.data?.message ||
          `Failed to ${
            selectedService?.status === SERVICES_STATUS.PAUSED
              ? "start"
              : "pause"
          } appointment`,
      );
    }
  };

  const isLoading = isStarting || isPausing;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="bg-white rounded-lg px-3 md:px-6 py-2 shadow-sm">
      <Row align="middle" justify="space-between" wrap={false}>
        {/* Left: Back + Title */}
        <Col flex="auto" style={{ minWidth: 0 }}>
          <div className="flex items-center gap-2">
            {showIconButton && (
              <Tooltip title="Go Back" placement="topLeft">
                <span>
                  <IconButton
                    icon={backIcon}
                    onClick={onIconClick || (() => {})}
                  />
                </span>
              </Tooltip>
            )}
            <Title
              className="!text-green-custom !mb-0 truncate"
              level={screens.md ? 4 : 5}
              text={title}
            />
          </div>
        </Col>

        {/* Right: Actions + Patient Info */}
        <Col flex="none">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Appointment Status */}
            {showAppointmentStatus && (
              <div className="flex flex-col justify-center px-2 md:px-3 py-1 md:py-2 bg-gray-100 rounded-md shadow-md border-green-custom border-2">
                <div className="flex items-center gap-2">
                  {selectedService?.status === SERVICES_STATUS.PAUSED ? (
                    <>
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={handleToggleAppointment}
                        className="!text-green-600 !p-0 !text-xs md:!text-sm"
                      >
                        Resume
                      </Button>
                      <Tag
                        color="red"
                        className="rounded-sm text-xs px-1 md:px-2"
                      >
                        Paused
                      </Tag>
                    </>
                  ) : (
                    <>
                      <Button
                        type="link"
                        icon={<PauseCircleOutlined />}
                        onClick={handleToggleAppointment}
                        className="!text-yellow-600 !p-0 !text-xs md:!text-sm"
                      >
                        Pause
                      </Button>
                      <Tag
                        color="green"
                        className="rounded-sm text-xs px-1 md:px-2"
                      >
                        Active
                      </Tag>
                    </>
                  )}
                </div>
                {screens.md && (
                  <p className="text-xs font-bold text-gray-600 mt-1 whitespace-nowrap">
                    {selectedService?.status === SERVICES_STATUS.PAUSED
                      ? "Appointment is currently paused"
                      : `Appointment for ${selectedPatientData?.name} is in progress`}
                  </p>
                )}
              </div>
            )}

            {/* Extra Actions */}
            {extraActions && <div>{extraActions}</div>}

            {/* Patient Info */}
            {showPatientInfo && (
              <PersonInfoCard
                imageSrc={testing}
                name={selectedPatientData?.name || "John Doe"}
                mrNumber={selectedPatientData?.mrNo || "42501-4545665-1343"}
                age={`${dob ?? 0}`}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TopBar;
