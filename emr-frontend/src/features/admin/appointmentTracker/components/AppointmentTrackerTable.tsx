import React, { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Input,
  Row,
  Col,
  Modal,
} from "antd";
import type { TableProps } from "antd";
import { useGetAllPatientsQuery } from "../../services/appointmentTrackerApi";
import Loader from "@/components/shared/Loader";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import {
  SwapOutlined,
  DeleteOutlined,
  UserSwitchOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import TransferPatientModal from "./TransferPatientModal";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import { useUnassignPatientMutation } from "@/services/transferPatientApi";
import { useGlobalNotification } from "@/hooks/useNotification";
import { formatServiceName } from "@/utils/formats/generalFormatters";

interface AppointmentsTrackerTableProps {
  facilityId: number | null;
}

const AppointmentsTrackerTable: React.FC<AppointmentsTrackerTableProps> = ({
  facilityId,
}) => {
  const navigate = useNavigate();
  const showNotification = useGlobalNotification();
  const [unassignPatient, { isLoading: isUnassigning }] =
    useUnassignPatientMutation();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [searchFilters, setSearchFilters] = useState({
    first_name: "",
    last_name: "",
  });

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  const handleTransfer = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPatientData(record.originalData);
    setTransferModalVisible(true);
  };

  const handleDelete = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();

    Modal.confirm({
      title: "Unassign Patient",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to unassign this patient?</p>
          <p className="font-semibold mt-2">Patient: {record.name}</p>
        </div>
      ),
      okText: "Yes, Unassign",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await unassignPatient({
            patient_id: record?.originalData?.patient?.id,
            facility_id: facilityId!,
          }).unwrap();

          showNotification(
            "success",
            "Success",
            "Patient has been unassigned successfully.",
          );

          // Refetch the data
          refetch();
        } catch (error: any) {
          showNotification(
            "error",
            "Unassign Failed",
            error?.data?.message ||
              "Failed to unassign patient. Please try again.",
          );
        }
      },
    });
  };

  const handleReassign = (record: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(ROUTES.ADMIN_REFERRAL, {
      state: {
        patientId: record.originalData.patient.id,
      },
    });
  };

  const handleSearch = (field: "first_name" | "last_name", value: string) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTransferSuccess = () => {
    // Refetch the patients data after successful transfer
    refetch();
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "S.NO",
      dataIndex: "srNo",
      key: "srNo",
      width: 70,
    },
    {
      title: "PATIENT NAME",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>,
      width: 200,
    },
    {
      title: "STAFF NAME",
      dataIndex: "staffName",
      key: "staffName",
      width: 200,
    },
    {
      title: "USER ROLE",
      dataIndex: "userRole",
      key: "userRole",
      width: 200,
    },
    {
      title: "SERVICE TYPE",
      dataIndex: "serviceType",
      key: "serviceType",
      width: 200,
    },

    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 200,
      render: (status) => {
        let color = "";
        let text = "";

        switch (status?.toLowerCase()) {
          case "pending":
            color = "orange";
            text = "Pending";
            break;
          case "in_progress":
            color = "blue";
            text = "In Progress";
            break;
          case "paused":
            color = "gold";
            text = "Paused";
            break;
          default:
            color = "default";
            text = status;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Transfer">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={(e) => handleTransfer(record, e)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Reassign">
            <Button
              type="text"
              icon={<UserSwitchOutlined />}
              onClick={(e) => handleReassign(record, e)}
              size="small"
              disabled={
                record.status.toLowerCase() === "in_progress" ||
                record.status.toLowerCase() === "paused"
              }
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => handleDelete(record, e)}
              size="small"
              disabled={
                record.status.toLowerCase() === "in_progress" ||
                record.status.toLowerCase() === "paused"
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const queryParams = {
    page: pagination.current,
    limit: pagination.pageSize,
    ...(facilityId && { facility_id: facilityId }),
    ...(searchFilters.first_name && { first_name: searchFilters.first_name }),
    ...(searchFilters.last_name && { last_name: searchFilters.last_name }),
  };

  const {
    data: patientsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllPatientsQuery(queryParams, {
    refetchOnMountOrArgChange: true,
    skip: !facilityId,
  });

  if (isLoading || isUnassigning) return <Loader />;

  if (isError)
    return <div className="text-red-600">Failed to load patients</div>;

  const filteredData =
    patientsData?.data?.filter((item: any) => {
      const status = item.status?.toLowerCase();
      const serviceName = item.service?.name?.toLowerCase();

      // Show if status is paused or pending (any service type)
      if (status === "paused" || status === "pending") {
        return true;
      }

      // Show if status is in_progress AND service is delivery
      if (status === "in_progress" && serviceName === "delivery") {
        return true;
      }

      return false;
    }) || [];

  const transformedData =
    filteredData?.map((item: any, index: number) => ({
      key: item.id || index,
      srNo: (pagination.current - 1) * pagination.pageSize + index + 1,
      mrNo: item.mr_no || "-",
      cnic: item.cnic || "-",
      status: item.status || "-",
      serviceType: formatServiceName(item.service.name) || "-",
      name:
        `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim() ||
        "-",
      staffName:
        `${item.appointment.doctor.first_name || ""} ${item.appointment.doctor.last_name || ""}`.trim() ||
        "-",
      userRole: item.appointment.doctor.role?.name
        ? formatRoleName(item.appointment.doctor.role.name)
        : "-",
      phone: item.phone_number || "-",
      originalData: item, // Store the original data for the modal
    })) || [];

  return (
    <div>
      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search by Staff's First Name"
            prefix={<SearchOutlined />}
            value={searchFilters.first_name}
            onChange={(e) => handleSearch("first_name", e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search by Staff's Last Name"
            prefix={<SearchOutlined />}
            value={searchFilters.last_name}
            onChange={(e) => handleSearch("last_name", e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={transformedData}
        size="small"
        scroll={{ x: "max-content" }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredData?.length || 0,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
          },
        }}
        className="shadow-md rounded-lg"
      />

      <TransferPatientModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        patientData={selectedPatientData}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
};

export default AppointmentsTrackerTable;
