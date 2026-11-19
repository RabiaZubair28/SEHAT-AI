import React, { useState, useEffect } from "react";
import { Modal, Radio, Space, Card, Alert, Button, Divider } from "antd";
import { UserOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import {
  useGetAvailableDoctorsQuery,
  useTransferServiceToDoctorMutation,
} from "@/services/transferPatientApi";
import Loader from "@/components/shared/Loader";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import { useGlobalNotification } from "@/hooks/useNotification";
import { formatServiceName } from "@/utils/formats/generalFormatters";

interface TransferPatientModalProps {
  visible: boolean;
  onClose: () => void;
  patientData: any;
  onSuccess?: () => void;
}

const TransferPatientModal: React.FC<TransferPatientModalProps> = ({
  visible,
  onClose,
  patientData,
  onSuccess,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const showNotification = useGlobalNotification();

  const facilityId = patientData?.patient?.facility_id;
  const serviceType = patientData?.service?.name;
  const appointmentId = patientData?.appointment?.id;
  const currentDoctorId = patientData?.appointment?.doctor?.id;

  const {
    data: doctorsData,
    isLoading: isLoadingDoctors,
    isError: isErrorDoctors,
  } = useGetAvailableDoctorsQuery(
    {
      facility_id: facilityId,
      serviceType: serviceType,
    },
    {
      skip: !visible || !facilityId || !serviceType,
    },
  );

  const [transferService, { isLoading: isTransferring }] =
    useTransferServiceToDoctorMutation();

  useEffect(() => {
    if (!visible) {
      setSelectedDoctorId(null);
    }
  }, [visible]);

  const handleTransfer = async () => {
    if (!selectedDoctorId) return;

    try {
      await transferService({
        serviceType: serviceType,
        doctorId: selectedDoctorId,
        appointmentId: appointmentId,
        facility_id: facilityId,
      }).unwrap();

      showNotification(
        "success",
        "Patient Transferred",
        "The patient has been successfully transferred to the selected doctor.",
      );

      onSuccess?.();
      onClose();
    } catch (error: any) {
      showNotification(
        "error",
        "Transfer Failed",
        error?.data?.message ||
          "An error occurred while transferring the patient. Please try again.",
      );
    }
  };

  const doctors = (doctorsData?.data || []).filter(
    (doctor: any) => doctor.id !== currentDoctorId,
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MedicineBoxOutlined className="text-blue-600" />
          <span>Transfer Patient to Doctor</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isTransferring}>
          Cancel
        </Button>,
        <Button
          key="transfer"
          type="primary"
          onClick={handleTransfer}
          disabled={!selectedDoctorId || isTransferring}
          loading={isTransferring}
        >
          Assign Doctor
        </Button>,
      ]}
    >
      <div className="py-4">
        {/* Patient Info */}
        <Card size="small" className="mb-4 !bg-blue-50 !border-green-custom">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Patient Name</p>
              <p className="font-semibold">
                {patientData?.patient?.first_name}{" "}
                {patientData?.patient?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Service Type</p>
              <p className="font-semibold">{formatServiceName(serviceType)}</p>
            </div>
          </div>
        </Card>

        <Divider orientation="left" orientationMargin={0}>
          <span className="text-sm text-gray-600">Select Available Doctor</span>
        </Divider>

        {/* Loading State */}
        {isLoadingDoctors && (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        )}

        {/* Error State */}
        {isErrorDoctors && (
          <Alert
            message="Error Loading Doctors"
            description="Failed to fetch available doctors. Please try again."
            type="error"
            showIcon
          />
        )}

        {/* No Doctors Available */}
        {!isLoadingDoctors && !isErrorDoctors && doctors.length === 0 && (
          <Alert
            message="No Doctors Available"
            description="There are no available doctors for this service at the moment."
            type="warning"
            showIcon
          />
        )}

        {/* Doctors List */}
        {!isLoadingDoctors && !isErrorDoctors && doctors.length > 0 && (
          <Radio.Group
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full" size="small">
              {doctors.map((doctor: any) => (
                <Card
                  key={doctor.id}
                  size="small"
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDoctorId === doctor.id
                      ? "!border-green-custom !bg-blue-50"
                      : "!border-gray-200"
                  }`}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                  hoverable
                >
                  <Radio value={doctor.id} className="w-full">
                    <div className="flex items-center justify-between ml-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full !bg-green-custom flex items-center justify-center">
                          <UserOutlined className="!text-white text-lg" />
                        </div>
                        <div>
                          <p className="font-semibold text-base !mb-0">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </p>
                          <p className="text-sm text-gray-600 !mb-0">
                            {formatRoleName(doctor.role?.name)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        )}
      </div>
    </Modal>
  );
};

export default TransferPatientModal;
