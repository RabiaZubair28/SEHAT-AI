import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, Input, Modal, Select, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import Loader from "@/components/shared/Loader";
import { useGlobalNotification } from "@/hooks/useNotification";
import { useSelector } from "react-redux";
import {
  useAcceptTelehealthRequestMutation,
  useCompleteTelehealthRequestMutation,
  useGetIncomingTelehealthRequestsQuery,
  useRejectTelehealthRequestMutation,
} from "../services/queueApi";
import { RootState } from "@/redux/store";
import { socketService } from "@/services/socketServices";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "In Session", value: "in_session" },
];

const formatTagLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "orange";
    case "accepted":
      return "blue";
    case "rejected":
      return "red";
    case "cancelled":
      return "default";
    case "in_session":
      return "processing";
    case "completed":
      return "green";
    default:
      return "default";
  }
};

interface IncomingTelehealthRequestRow {
  key: number;
  requestId: number;
  patientName: string;
  requestingDoctorName: string;
  consultantDoctorName: string;
  specialty: string;
  reason: string;
  status: string;
  requestedAt: string;
}

const IncomingTelehealthRequestsQueue: React.FC = () => {
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<IncomingTelehealthRequestRow | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const showNotification = useGlobalNotification();
  const user = useSelector((state: RootState) => state.authUser.user);
  const [acceptTelehealthRequest, { isLoading: isAccepting }] =
    useAcceptTelehealthRequestMutation();
  const [completeTelehealthRequest, { isLoading: isCompleting }] =
    useCompleteTelehealthRequestMutation();
  const [rejectTelehealthRequest, { isLoading: isRejecting }] =
    useRejectTelehealthRequestMutation();
  const [acceptingRequestId, setAcceptingRequestId] = useState<number | null>(
    null,
  );
  const [completingRequestId, setCompletingRequestId] = useState<number | null>(
    null,
  );
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(
    null,
  );

  const {
    data: incomingRequestsData,
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

    const handleTelehealthRequestCreated = () => {
      refetch();
    };

    socketService.emit("telehealth_request_created", { user_id: user.id });
    socketService.on(
      "telehealth_request_created",
      handleTelehealthRequestCreated,
    );

    return () => {
      socketService.off(
        "telehealth_request_created",
        handleTelehealthRequestCreated,
      );
    };
  }, [refetch, user?.id]);

  const dataSource = useMemo<IncomingTelehealthRequestRow[]>(() => {
    const rows = Array.isArray(incomingRequestsData?.data)
      ? incomingRequestsData.data
      : [];

    const ALLOWED_STATUSES = ["pending", "in_session"];

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
  }, [incomingRequestsData]);

  const handleRequestAction = async (
    record: IncomingTelehealthRequestRow,
    action: "accept" | "reject",
  ) => {
    if (action === "accept") {
      try {
        setAcceptingRequestId(record.requestId);
        const response = await acceptTelehealthRequest(record.requestId).unwrap();
        const meetingUrl = response?.data?.session?.meetingUrl;

        await refetch();

        showNotification(
          "success",
          "Request Accepted",
          response?.message || `Telehealth request #${record.requestId} accepted successfully.`,
        );

        if (meetingUrl) {
          window.open(meetingUrl, "_blank", "noopener,noreferrer");
        } else {
          showNotification(
            "error",
            "Meeting Link Missing",
            "Request was accepted, but no meeting link was returned.",
          );
        }
      } catch (error: any) {
        showNotification(
          "error",
          "Accept Failed",
          error?.data?.message || "Failed to accept telehealth request.",
        );
      } finally { 
        setAcceptingRequestId(null);
      }

      return;
    }

    setSelectedRequest(record);
    rejectForm.resetFields();
    setIsRejectModalOpen(true);
  };

  const handleRejectModalCancel = () => {
    setIsRejectModalOpen(false);
    setSelectedRequest(null);
    rejectForm.resetFields();
  };

  const handleRejectConsultation = async (values: { reason?: string }) => {
    if (!selectedRequest?.requestId) return;

    try {
      setRejectingRequestId(selectedRequest.requestId);
      const response = await rejectTelehealthRequest({
        requestId: selectedRequest.requestId,
        reason: values.reason?.trim() || undefined,
      }).unwrap();

      setIsRejectModalOpen(false);
      setSelectedRequest(null);
      rejectForm.resetFields();
      await refetch();

      showNotification(
        "success",
        "Request Rejected",
        response?.message ||
          `Telehealth request #${selectedRequest.requestId} rejected.`,
      );
    } catch (error: any) {
      showNotification(
        "error",
        "Reject Failed",
        error?.data?.message || "Failed to reject telehealth request.",
      );
    } finally {
      setRejectingRequestId(null);
    }
  };

  const handleCompleteConsultationClick = (
    record: IncomingTelehealthRequestRow,
  ) => {
    setSelectedRequest(record);
    completeForm.setFieldsValue({ consultation_note: "" });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteModalCancel = () => {
    setIsCompleteModalOpen(false);
    setSelectedRequest(null);
    completeForm.resetFields();
  };

  const handleCompleteConsultation = async (values: {
    consultation_note: string;
  }) => {
    if (!selectedRequest?.requestId) {
      showNotification(
        "error",
        "Complete Failed",
        "No telehealth request is selected.",
      );
      return;
    }

    try {
      setCompletingRequestId(selectedRequest.requestId);
      const response = await completeTelehealthRequest({
        requestId: selectedRequest.requestId,
        consultation_note: values.consultation_note,
      }).unwrap();

      setIsCompleteModalOpen(false);
      setSelectedRequest(null);
      completeForm.resetFields();
      await refetch();

      showNotification(
        "success",
        "Consultation Completed",
        response?.message ||
          `Telehealth consultation #${selectedRequest.requestId} completed successfully.`,
      );
    } catch (error: any) {
      showNotification(
        "error",
        "Complete Failed",
        error?.data?.message || "Failed to complete telehealth consultation.",
      );
    } finally {
      setCompletingRequestId(null);
    }
  };

  const columns: TableProps<IncomingTelehealthRequestRow>["columns"] = [
    {
      title: "PATIENT",
      dataIndex: "patientName",
      key: "patientName",
      width: 200,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "REQUESTING DOCTOR",
      dataIndex: "requestingDoctorName",
      key: "requestingDoctorName",
      width: 200,
    },
    {
      title: "CONSULTANT",
      dataIndex: "consultantDoctorName",
      key: "consultantDoctorName",
      width: 200,
    },
    {
      title: "REASON",
      dataIndex: "reason",
      key: "reason",
      width: 300,
      render: (text: string) => (
        <span className="block max-w-[280px] whitespace-normal">{text}</span>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 150,
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
    {
      title: "ACTIONS",
      key: "actions",
      width: 240,
      render: (_, record) => {
        const isPending = record.status?.toLowerCase() === "pending";
        const isInSession = record.status?.toLowerCase() === "in_session";

        if (isInSession) {
          return (
            <Space size={8}>
              <Button
                type="primary"
                loading={
                  isCompleting && completingRequestId === record.requestId
                }
                onClick={() => handleCompleteConsultationClick(record)}
              >
                Finish
              </Button>
              <Button danger disabled loading={isRejecting && rejectingRequestId === record.requestId}>
                Reject
              </Button>
            </Space>
          );
        }

        return (
          <Space size={8}>
            <Button
              type="primary"
              disabled={!isPending}
              loading={isAccepting && acceptingRequestId === record.requestId}
              onClick={() => handleRequestAction(record, "accept")}
            >
              Accept
            </Button>
            <Button
              danger
              disabled={!isPending}
              loading={isRejecting && rejectingRequestId === record.requestId}
              onClick={() => handleRequestAction(record, "reject")}
            >
              Reject
            </Button>
          </Space>
        );
      },
    },
  ];

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <div className="text-red-600">Failed to load incoming telehealth requests</div>
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

      <Modal
        title="Complete Consultation"
        open={isCompleteModalOpen}
        onCancel={handleCompleteModalCancel}
        onOk={() => completeForm.submit()}
        confirmLoading={isCompleting}
        okText="Finish Consultation"
        width={520}
        destroyOnHidden
      >
      <Form
          form={completeForm}
          layout="vertical"
          onFinish={handleCompleteConsultation}
        >
          <div className="mb-3 text-sm text-slate-600">
            {selectedRequest
              ? `Add consultant notes for ${selectedRequest.patientName}.`
              : "Add consultant notes to finish this telehealth request."}
          </div>
          <Form.Item
            label="Consultation Notes"
            name="consultation_note"
            rules={[
              { required: true, message: "Consultation notes are required." },
              {
                whitespace: true,
                message: "Consultation notes are required.",
              },
            ]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Enter consultation notes"
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Reject Telehealth Request"
        open={isRejectModalOpen}
        onCancel={handleRejectModalCancel}
        onOk={() => rejectForm.submit()}
        confirmLoading={isRejecting}
        okText="Reject Request"
        okButtonProps={{ danger: true }}
        width={480}
        destroyOnHidden
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleRejectConsultation}
        >
          <div className="mb-3 text-sm text-slate-600">
            {selectedRequest
              ? `Rejecting request from ${selectedRequest.requestingDoctorName} for ${selectedRequest.patientName}.`
              : "Provide a reason for rejecting this request."}
          </div>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea
              rows={4}
              placeholder="e.g. Currently in emergency OT, will pick next request."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default IncomingTelehealthRequestsQueue;
