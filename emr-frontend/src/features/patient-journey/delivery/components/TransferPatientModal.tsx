import React from "react";
import { Modal, Button, Table, Alert } from "antd";
import {
  useGetAvailableDoctorsQuery,
  useTransferServiceToDoctorMutation,
} from "@/services/transferPatientApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Loader from "@/components/shared/Loader";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { ServiceType, Roles } from "@/data/types";
import { formatRoleName } from "@/utils/formats/rolesFormatter";

interface TransferPatientModalProps {
  visible: boolean;
  onClose: () => void;
  serviceType: ServiceType;
}

const TransferPatientModal: React.FC<TransferPatientModalProps> = ({
  visible,
  onClose,
  serviceType,
}) => {
  const showNotification = useGlobalNotification();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.authUser.user);
  const facilityId = user?.facility?.id;
  const selectedPatientData = useSelector(
    (state: RootState) => state?.patientRecords.selectedPatientData,
  );
  const appointmentId = selectedPatientData?.appointmentId;

  const {
    data: doctorsResponse,
    isLoading,
    isError,
    error,
  } = useGetAvailableDoctorsQuery(
    {
      serviceType: serviceType,
      facility_id: facilityId!,
    },
    {
      skip: !facilityId || !visible,
      refetchOnMountOrArgChange: true,
    },
  );

  const [transferService, { isLoading: isTransferring }] =
    useTransferServiceToDoctorMutation();

  const handleTransfer = async (doctorId: number) => {
    try {
      const response = await transferService({
        serviceType,
        doctorId,
        appointmentId,
        facility_id: facilityId,
      }).unwrap();

      if (response?.success) {
        navigate("/queue");

        showNotification(
          "success",
          "Transfer Successful",
          response?.message || "Patient transferred successfully",
        );
        onClose();
      } else {
        showNotification(
          "error",
          "Transfer Failed",
          response?.message || "Failed to transfer patient",
        );
      }
    } catch (error: any) {
      showNotification(
        "error",
        "Transfer Failed",
        error?.data?.message || "An error occurred during transfer",
      );
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Doctor Name",
      key: "doctor_name",
      render: (_: any, record: any) =>
        `${record.first_name || ""} ${record.last_name || ""}`,
    },
    {
      title: "Role",
      key: "role",
      render: (_: any, record: any) => formatRoleName(record.role?.name as Roles),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleTransfer(record.id)}
          loading={isTransferring}
        >
          Transfer
        </Button>
      ),
    },
  ];

  if (isError) {
    const apiError = error as {
      status: number;
      data?: { error?: string; message?: string };
    };
    const errorTitle = apiError?.data?.error || "Error";
    const errorDescription =
      apiError?.data?.message || "Failed to load available doctors";

    return (
      <Modal
        title="Transfer Patient"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <Alert
          message={errorTitle}
          description={errorDescription}
          type="error"
          showIcon
        />
      </Modal>
    );
  }

  return (
    <Modal
      title="Transfer Patient to Available Doctor"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {isLoading ? (
        <Loader />
      ) : (
        <Table
          columns={columns}
          dataSource={doctorsResponse?.data || []}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{
            emptyText: "No available doctors found",
          }}
        />
      )}
    </Modal>
  );
};

export default TransferPatientModal;
