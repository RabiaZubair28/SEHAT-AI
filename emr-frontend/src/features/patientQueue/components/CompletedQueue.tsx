import React, { useState } from "react";
import { Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetCompletedAppointmentsQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import { ROUTES } from "@/data/routes";
import { getAgeInYears } from "@/utils/ageCalculator";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
import { useDispatch } from "react-redux";
import { VisitStatus } from "..";
import { formatServiceName } from "@/utils/formats/generalFormatters";

const CompletedQueue: React.FC = () => {
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
      title: "DATE OF VIST",
      dataIndex: "datetime",
      key: "datetime",
    },
    {
      title: "VISIT STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "";
        let text = "";

        switch (status?.toLowerCase()) {
          case VisitStatus.IN_PROGRESS:
            color = "processing";
            text = "In Progress";
            break;
          case VisitStatus.PAUSED:
            color = "purple";
            text = "Paused";
            break;
          case VisitStatus.DISPATCHED:
            color = "green";
            text = "Dispatched";
            break;
          case VisitStatus.REFERRED_OUT:
            color = "cyan";
            text = "Referred Out";
            break;
          default:
            color = "default";
            text = status || "Unknown";
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
    data: completedData,
    isLoading,
    isError,
  } = useGetCompletedAppointmentsQuery(
    { page: pagination.current, limit: pagination.pageSize },
    { refetchOnMountOrArgChange: true },
  );

  if (isLoading) return <Loader />;

  if (isError)
    return <div className="text-red-600">Failed to load appointments</div>;

  const transformedData = completedData?.data?.map((visit: any) => {
    const firstAppointment = visit.appointments?.[0];

    const dt = new Date(firstAppointment?.createdAt);
    const formattedDate = dt
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");

    const allServices =
      visit.appointments
        ?.flatMap((appointment: any) => appointment.appointmentServices || [])
        .map((service: any) => formatServiceName(service?.service?.name))
        .filter(Boolean)
        .filter(
          (value: string, index: number, self: string[]) =>
            self.indexOf(value) === index,
        )
        .reverse()
        .join(", ") || "-";

    return {
      key: visit.id || firstAppointment?.id,
      patientId: visit.patient.id,
      token: firstAppointment?.token_number
        ? `#${firstAppointment.token_number}`
        : `-`,
      mrNo: visit.patient?.mr_no || "-",
      dob: visit.patient?.dob || "-",
      status: visit?.status,
      visit: visit,
      selectedServiceRoute:
        firstAppointment?.appointmentServices?.[0]?.service?.name.toLowerCase(),
      appointmentServices: firstAppointment?.appointmentServices,
      appointmentStatus: firstAppointment?.status,
      appointmentId: firstAppointment?.id,
      serviceType: allServices,
      patientData: visit.patient || {},
      vitals: firstAppointment?.vitalAssessment,
      name:
        `${visit.patient?.first_name || ""} ${
          visit.patient?.last_name || ""
        }`.trim() || "-",
      phone: visit.patient?.phone_number || "-",
      datetime: formattedDate,
    };
  });

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: completedData?.count || 0,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize });
        },
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default CompletedQueue;
