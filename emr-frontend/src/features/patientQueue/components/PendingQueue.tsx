import React, { useState, useEffect } from "react";
import { Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetPendingAppointmentsQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import { ROUTES } from "@/data/routes";
import { useDispatch } from "react-redux";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { socketService } from "@/services/socketServices";
import { getAgeInYears } from "@/utils/ageCalculator";
import { VisitStatus } from "..";
import { formatServiceName } from "@/utils/formats/generalFormatters";

const PendingQueue: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleViewProfile = (record: any) => {
    const age = getAgeInYears(record.dob);

    dispatch(
      setSelectedPatientData({
        id: record.patientId,
        appointmentId: record.appointmentId,
        appointmentServices: record?.appointmentServices,
        selectedServiceRoute: record.selectedServiceRoute,
        selectedServiceIdFromCard: undefined,
        visit: record.visit,
        patientData: record.patientData,
        name: record.name,
        mrNo: record.mrNo,
        vitals: record?.vitals,
        appointmentStatus: record.appointmentStatus,
        age: age,
      }),
    );

    navigate(
      `${ROUTES.PATIENT_MODULE}/${record.patientId}/${ROUTES.PATIENT_PROFILE}`,
    );
  };

  // Columns configuration
  const columns: TableProps<any>["columns"] = [
    {
      title: "TOKEN",
      dataIndex: "token",
      key: "token",
    },
    {
      title: "MR#",
      dataIndex: "mrNo",
      key: "mrNo",
    },
    {
      title: "PATIENT NAME",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "SERVICE",
      dataIndex: "serviceType",
      key: "serviceType",
    },
    {
      title: "DATE OF VISIT",
      dataIndex: "datetime",
      key: "datetime",
    },
    {
      title: "APPOINTMENT STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let text = "";

        switch (status?.toLowerCase()) {
          case VisitStatus.PENDING:
            color = "orange";
            text = "Pending";
            break;
          case VisitStatus.IN_PROGRESS:
            color = "blue";
            text = "In Progress";
            break;
          case VisitStatus.PAUSED:
            color = "red";
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
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewProfile(record)}>
          Visit Profile
        </Button>
      ),
    },
  ];

  const {
    data: pendingData,
    isLoading,
    isError,
    refetch,
  } = useGetPendingAppointmentsQuery(
    { page: pagination.current, limit: pagination.pageSize },
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    const handleQueueAddedCallback = () => {
      refetch();
    };
    socketService.on("added_to_queue", handleQueueAddedCallback);
    return () => {
      socketService.off("added_to_queue", handleQueueAddedCallback);
    };
  }, []);

  if (isLoading) return <Loader />;

  if (isError)
    return <div className="text-red-600">Failed to load appointments</div>;
  const transformedData =
    pendingData?.data?.map((item: any) => {
      const dt = new Date(item?.createdAt);
      const formattedDate = dt
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-"); // 15-Oct-2025
      const currentService = item.appointmentServices?.[0];
      return {
        key: item.id,
        patientId: item.patient.id,
        token: item?.token_number ? `#${item.token_number}` : `-`,
        mrNo: item.patient?.mr_no || "-",
        dob: item.patient?.dob || "-",
        status: item?.status,
        visit: item?.visit,
        serviceType: formatServiceName(currentService?.service?.name) || "-",
        selectedServiceRoute: currentService?.service?.name.toLowerCase(),
        appointmentServices: item?.appointmentServices,
        appointmentStatus: item.status,
        appointmentId: item?.id,
        patientData: item.patient || {},
        vitals: item?.vitalAssessment,
        name:
          `${item.patient?.first_name || ""} ${
            item.patient?.last_name || ""
          }`.trim() || "-",
        phone: item.patient?.phone_number || "-",
        datetime: formattedDate,
      };
    }) || [];

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pendingData?.count || 0,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize });
        },
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default PendingQueue;
