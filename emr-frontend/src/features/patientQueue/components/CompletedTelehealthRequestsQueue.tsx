import React, { useEffect, useMemo, useState } from "react";
import { Form, Select, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import Loader from "@/components/shared/Loader";
import { useSelector } from "react-redux";
import { useGetIncomingTelehealthRequestsQuery } from "../services/queueApi";
import { RootState } from "@/redux/store";
import { socketService } from "@/services/socketServices";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

const formatTagLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "green";
    case "rejected":
      return "red";
    default:
      return "default";
  }
};

interface CompletedTelehealthRequestRow {
  key: number;
  requestId: number;
  patientName: string;
  requestingDoctorName: string;
  consultantDoctorName: string;
  specialty: string;
  reason: string;
  consultationNote: string;
  rejectedReason: string;
  status: string;
  requestedAt: string;
}

const CompletedTelehealthRequestsQueue: React.FC = () => {
  const [form] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState("");
  const user = useSelector((state: RootState) => state.authUser.user);

  const {
    data: completedRequestsData,
    isLoading,
    isError,
    refetch,
  } = useGetIncomingTelehealthRequestsQuery(
    { status: statusFilter || undefined },
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const handleTelehealthRequestCompleted = () => {
      refetch();
    };

    socketService.emit("telehealth_request_completed", { user_id: user.id });
    socketService.on(
      "telehealth_request_completed",
      handleTelehealthRequestCompleted,
    );

    return () => {
      socketService.off(
        "telehealth_request_completed",
        handleTelehealthRequestCompleted,
      );
    };
  }, [refetch, user?.id]);

  const dataSource = useMemo<CompletedTelehealthRequestRow[]>(() => {
    const rows = Array.isArray(completedRequestsData?.data)
      ? completedRequestsData.data
      : [];

    const ALLOWED_STATUSES = ["completed", "rejected"];

    const filtered = statusFilter
      ? rows.filter(
          (item: any) => item?.status?.toLowerCase() === statusFilter,
        )
      : rows.filter((item: any) =>
          ALLOWED_STATUSES.includes(item?.status?.toLowerCase()),
        );

    return filtered.map((item: any) => ({
        key: item.id,
        requestId: item.id,
        patientName: item.patientName || "-",
        requestingDoctorName: item.requestingDoctorName || "-",
        consultantDoctorName: item.consultantDoctorName || "-",
        specialty: item.specialty || "-",
        reason: item.reason || "-",
        consultationNote:
          item.consultation_note?.note || item.consultationNote?.note || "-",
        rejectedReason: item.rejectedReason || item.rejected_reason || "-",
        status: item.status || "-",
        requestedAt: item.requestedAt
          ? new Date(item.requestedAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
      }));
  }, [completedRequestsData]);

  const columns: TableProps<CompletedTelehealthRequestRow>["columns"] = [
    {
      title: "PATIENT",
      dataIndex: "patientName",
      key: "patientName",
      width: 180,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "REQUESTING DOCTOR",
      dataIndex: "requestingDoctorName",
      key: "requestingDoctorName",
      width: 180,
    },
    {
      title: "CONSULTANT",
      dataIndex: "consultantDoctorName",
      key: "consultantDoctorName",
      width: 180,
    },
    {
      title: "REASON",
      dataIndex: "reason",
      key: "reason",
      width: 260,
      render: (text: string) => (
        <span className="block max-w-[240px] whitespace-normal">{text}</span>
      ),
    },
    {
      title: "CONSULTATION NOTE",
      key: "consultationNote",
      width: 320,
      render: (_: any, record: CompletedTelehealthRequestRow) => {
        if (record.status?.toLowerCase() === "rejected") {
          return (
            <span className="block max-w-[300px] whitespace-normal text-red-600">
              {record.rejectedReason !== "-" ? record.rejectedReason : "-"}
            </span>
          );
        }
        return (
          <span className="block max-w-[300px] whitespace-normal">
            {record.consultationNote}
          </span>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{formatTagLabel(status || "-")}</Tag>
      ),
    },
    {
      title: "REQUESTED AT",
      dataIndex: "requestedAt",
      key: "requestedAt",
      width: 200,
    },
  ];

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <div className="text-red-600">
        Failed to load completed telehealth requests
      </div>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Form form={form} layout="vertical" initialValues={{ status: statusFilter }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Item label="Status" name="status">
            <Select
              options={STATUS_OPTIONS}
              placeholder="Select status"
              onChange={(value) => setStatusFilter(value || "")}
              allowClear
            />
          </Form.Item>
        </div>
      </Form>

      <Table
        rowKey="key"
        columns={columns}
        dataSource={dataSource}
        size="small"
        scroll={{ x: "max-content" }}
        pagination={false}
        className="rounded-lg shadow-md"
      />
    </Space>
  );
};

export default CompletedTelehealthRequestsQueue;
