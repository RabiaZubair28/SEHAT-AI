import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
} from "antd";
import type { TableProps } from "antd";
import Loader from "@/components/shared/Loader";
import { useGlobalNotification } from "@/hooks/useNotification";
import placeholderImage from "@/assets/layout/girl.png";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import {
  useCreateTelehealthRequestMutation,
  useGetPendingAppointmentsQuery,
  useLazyGetTelehealthRequestByAppointmentServiceQuery,
  useGetTelehealthQueueQuery,
} from "../services/queueApi";
import { VisitStatus } from "..";
import { formatServiceName } from "@/utils/formats/generalFormatters";
import { RootState } from "@/redux/store";
import { socketService } from "@/services/socketServices";

const AVAILABILITY_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Available", value: "available" },
  { label: "Busy", value: "busy" },
  { label: "Offline", value: "offline" },
  { label: "Unavailable", value: "unavailable" },
];

const formatTagLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getHeroColors = (availability: string) => {
  const normalizedValue = availability?.toLowerCase();

  switch (normalizedValue) {
    case "available":
      return {
        background: "bg-gradient-to-br from-emerald-50 via-emerald-50 to-white",
        text: "text-emerald-900",
        accent: "bg-emerald-600",
        border: "border-emerald-100",
        badge: "bg-emerald-700 text-white",
        softAccent: "bg-emerald-100 text-emerald-700",
      };
    case "busy":
      return {
        background: "bg-gradient-to-br from-amber-50 via-amber-50 to-white",
        text: "text-amber-900",
        accent: "bg-amber-600",
        border: "border-amber-100",
        badge: "bg-amber-700 text-white",
        softAccent: "bg-amber-100 text-amber-700",
      };
    case "offline":
      return {
        background: "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
        text: "text-slate-900",
        accent: "bg-slate-700",
        border: "border-slate-200",
        badge: "bg-slate-700 text-white",
        softAccent: "bg-slate-200 text-slate-700",
      };
    case "unavailable":
      return {
        background: "bg-gradient-to-br from-rose-50 via-rose-50 to-white",
        text: "text-rose-900",
        accent: "bg-rose-600",
        border: "border-rose-100",
        badge: "bg-rose-700 text-white",
        softAccent: "bg-rose-100 text-rose-700",
      };
    default:
      return {
        background: "bg-gradient-to-br from-orange-50 via-orange-50 to-white",
        text: "text-stone-900",
        accent: "bg-stone-900",
        border: "border-stone-200",
        badge: "bg-stone-900 text-white",
        softAccent: "bg-stone-100 text-stone-700",
      };
  }
};

interface TelehealthDoctorCard {
  key: string | number;
  serial: number;
  doctorName: string;
  email: string;
  specialty: string;
  availability: string;
  currentCallStatus: string;
  isCheckedIn: boolean;
  fullData: any;
}

interface TelehealthPatientRow {
  key: number | string;
  patientId: number;
  appointmentId: number;
  appointmentServiceId?: number;
  token: string;
  mrNo: string;
  name: string;
  serviceType: string;
  serviceName?: string;
  status: string;
  datetime: string;
}


const TelehealthQueue: React.FC = () => {
  const [form] = Form.useForm();
  const [requestForm] = Form.useForm();
  const [selectedPatient, setSelectedPatient] =
    useState<TelehealthPatientRow | null>(null);
  const [selectedDoctor, setSelectedDoctor] =
    useState<TelehealthDoctorCard | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [selectedRemarksPatient, setSelectedRemarksPatient] =
    useState<TelehealthPatientRow | null>(null);
  const [consultationRequests, setConsultationRequests] = useState<any[]>([]);
  const [patientPagination, setPatientPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [doctorPagination, setDoctorPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [filters, setFilters] = useState({
    specialty: "",
    availability: "",
  });
  const user = useSelector((state: RootState) => state.authUser.user);

  const showNotification = useGlobalNotification();
  const [createTelehealthRequest, { isLoading: isCreatingRequest }] =
    useCreateTelehealthRequestMutation();
  const [getTelehealthRequestByAppointmentService, { isFetching: isFetchingRemarks }] =
    useLazyGetTelehealthRequestByAppointmentServiceQuery();

  const {
    data: pendingData,
    isLoading: isPendingLoading,
    isError: isPendingError,
  } = useGetPendingAppointmentsQuery(
    { page: patientPagination.current, limit: patientPagination.pageSize },
    { refetchOnMountOrArgChange: true },
  );

  const telehealthQueryArgs = selectedPatient
    ? {
        page: doctorPagination.current,
        limit: doctorPagination.pageSize,
        specialty: filters.specialty || undefined,
        availability: filters.availability || undefined,
      }
    : skipToken;

  const {
    data: telehealthData,
    isLoading: isTelehealthLoading,
    isError: isTelehealthError,
    refetch: refetchTelehealthQueue,
  } = useGetTelehealthQueueQuery(telehealthQueryArgs, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const handleDoctorQueueRefetch = () => {
      if (selectedPatient) {
        refetchTelehealthQueue();
      }
    };

    socketService.emit("telehealth_request_accepted", { user_id: user.id });
    socketService.emit("telehealth_request_rejected", { user_id: user.id });
    socketService.emit("telehealth_request_completed", { user_id: user.id });

    socketService.on("telehealth_request_accepted", handleDoctorQueueRefetch);
    socketService.on("telehealth_request_rejected", handleDoctorQueueRefetch);
    socketService.on("telehealth_request_completed", handleDoctorQueueRefetch);

    return () => {
      socketService.off("telehealth_request_accepted", handleDoctorQueueRefetch);
      socketService.off("telehealth_request_rejected", handleDoctorQueueRefetch);
      socketService.off("telehealth_request_completed", handleDoctorQueueRefetch);
    };
  }, [refetchTelehealthQueue, selectedPatient, user?.id]);

  const patientRows = useMemo<TelehealthPatientRow[]>(() => {
    const queueRows = Array.isArray(pendingData?.data) ? pendingData.data : [];

    return queueRows
      .filter(
        (item: any) =>
          [VisitStatus.IN_PROGRESS, VisitStatus.PAUSED].includes(
            item?.status?.toLowerCase(),
          ),
      )
      .map((item: any) => {
        const dt = new Date(item?.createdAt);
        const formattedDate = dt
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-");
        const currentService = item?.appointmentServices?.[0];

        return {
          key: item?.id,
          patientId: item?.patient?.id,
          appointmentId: item?.id,
          appointmentServiceId: currentService?.id,
          token: item?.token_number ? `#${item.token_number}` : "-",
          mrNo: item?.patient?.mr_no || "-",
          name:
            `${item?.patient?.first_name || ""} ${
              item?.patient?.last_name || ""
            }`.trim() || "-",
          serviceType: formatServiceName(currentService?.service?.name) || "-",
          serviceName: currentService?.service?.name,
          status: item?.status || "-",
          datetime: formattedDate,
        };
      });
  }, [pendingData]);

  const cardsData = useMemo<TelehealthDoctorCard[]>(() => {
    const rows = Array.isArray(telehealthData?.data)
      ? telehealthData.data
      : [];

    return rows.map((item: any, index: number) => ({
      key: item?.doctor_id ?? `${doctorPagination.current}-${index}`,
      serial:
        (doctorPagination.current - 1) * doctorPagination.pageSize + index + 1,
      doctorName:
        `${item?.first_name || ""} ${item?.last_name || ""}`.trim() || "-",
      email: item?.email || "-",
      specialty: item?.specialty || "-",
      availability: item?.availability || "-",
      currentCallStatus: item?.current_call_status || "-",
      isCheckedIn: Boolean(item?.is_checked_in),
      fullData: item,
    }));
  }, [doctorPagination.current, doctorPagination.pageSize, telehealthData]);

  const patientColumns: TableProps<TelehealthPatientRow>["columns"] = [
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
      render: (text: string) => <span className="font-semibold">{text}</span>,
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
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const normalizedStatus = status?.toLowerCase();
        const color =
          normalizedStatus === VisitStatus.IN_PROGRESS
            ? "blue"
            : normalizedStatus === VisitStatus.PAUSED
              ? "red"
              : "default";

        return <Tag color={color}>{formatTagLabel(status || "-")}</Tag>;
      },
    },
    {
      title: "CONSULTATION NOTE",
      key: "consultationNote",
      render: (_, record) => (
        <Button onClick={() => handleViewRemarks(record)}>
          View Remarks
        </Button>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) => (
        <Button
          type={selectedPatient?.key === record.key ? "default" : "primary"}
          onClick={() => {
            setSelectedPatient(record);
            setDoctorPagination((prev) => ({ ...prev, current: 1 }));
          }}
        >
          {selectedPatient?.key === record.key ? "Selected" : "Select Patient"}
        </Button>
      ),
    },
  ];

  const handleValuesChange = (_: any, allValues: any) => {
    setDoctorPagination((prev) => ({ ...prev, current: 1 }));
    setFilters({
      specialty: allValues.specialty || "",
      availability: allValues.availability || "",
    });
  };

  const submitTelehealthRequest = async (reason: string) => {
    if (!selectedPatient?.patientId || !selectedPatient?.appointmentServiceId) {
      showNotification(
        "error",
        "Request Failed",
        "Selected patient is missing patient or appointment service information.",
      );
      return;
    }

    if (!selectedDoctor) {
      showNotification(
        "error",
        "Request Failed",
        "No consultant doctor is selected.",
      );
      return;
    }

    const consultantDoctorId = Number(selectedDoctor?.fullData?.doctor_id);

    if (!consultantDoctorId) {
      showNotification(
        "error",
        "Request Failed",
        "Selected consultant doctor information is invalid.",
      );
      return;
    }

    try {
      const response = await createTelehealthRequest({
        patient_id: Number(selectedPatient.patientId),
        appointment_service_id: Number(selectedPatient.appointmentServiceId),
        consultant_doctor_id: consultantDoctorId,
        specialty:
          selectedDoctor.specialty && selectedDoctor.specialty !== "-"
            ? selectedDoctor.specialty
            : undefined,
        reason,
      }).unwrap();

      setIsRequestModalOpen(false);
      setSelectedDoctor(null);
      requestForm.resetFields();

      showNotification(
        "success",
        "Request Sent",
        response?.message ||
          `Telehealth request sent to ${selectedDoctor.doctorName} for ${selectedPatient.name}.`,
      );
    } catch (error: any) {
      showNotification(
        "error",
        "Request Failed",
        error?.data?.message || "Failed to send telehealth request.",
      );
    }
  };

  const handleRequestClick = (record: TelehealthDoctorCard) => {
    setSelectedDoctor(record);
    requestForm.setFieldsValue({ reason: "" });
    setIsRequestModalOpen(true);
  };

  const handleRequestModalCancel = () => {
    setIsRequestModalOpen(false);
    setSelectedDoctor(null);
    requestForm.resetFields();
  };

  const handleViewRemarks = async (record: TelehealthPatientRow) => {
    if (!record.appointmentServiceId) {
      showNotification(
        "error",
        "Remarks Unavailable",
        "Selected patient is missing appointment service information.",
      );
      return;
    }

    try {
      const response = await getTelehealthRequestByAppointmentService(
        record.appointmentServiceId,
      ).unwrap();

      const requests = Array.isArray(response?.data) ? response.data : [];

      setSelectedRemarksPatient(record);
      setConsultationRequests(requests);
      setIsRemarksModalOpen(true);
    } catch (error: any) {
      showNotification(
        "error",
        "Remarks Fetch Failed",
        error?.data?.message || "Failed to fetch consultation remarks.",
      );
    }
  };

  const handleRemarksModalClose = () => {
    setIsRemarksModalOpen(false);
    setSelectedRemarksPatient(null);
    setConsultationRequests([]);
  };

  if (isPendingLoading) return <Loader />;

  if (isPendingError) {
    return (
      <div className="text-red-600">Failed to load telehealth patients</div>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <div className="rounded-xl bg-white p-4 shadow-md">
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-slate-900">
            Telehealth Patients
          </h3>
          <p className="mb-0 text-sm text-slate-500">
            Showing patients whose visit is currently in progress or paused.
          </p>
        </div>

        <Table
          rowKey="key"
          columns={patientColumns}
          dataSource={patientRows}
          size="small"
          scroll={{ x: "max-content" }}
          pagination={{
            current: patientPagination.current,
            pageSize: patientPagination.pageSize,
            total: pendingData?.count || 0,
            onChange: (page, pageSize) => {
              setPatientPagination({ current: page, pageSize });
            },
          }}
          rowClassName={(record) =>
            selectedPatient?.key === record.key ? "bg-blue-50" : ""
          }
        />
      </div>

      {selectedPatient ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div className="rounded-xl bg-white p-4 shadow-md">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">
                  Available Doctors for {selectedPatient.name}
                </h3>
                <p className="mb-0 text-sm text-slate-500">
                  Service: {selectedPatient.serviceType} | Status:{" "}
                  {formatTagLabel(selectedPatient.status)}
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedPatient(null);
                  form.resetFields();
                  setFilters({ specialty: "", availability: "" });
                  setDoctorPagination({ current: 1, pageSize: 10 });
                }}
              >
                Clear Selection
              </Button>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            initialValues={filters}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item label="Specialty" name="specialty">
                <Input placeholder="Enter specialty" allowClear />
              </Form.Item>
              <Form.Item label="Availability" name="availability">
                <Select
                  options={AVAILABILITY_OPTIONS}
                  placeholder="Select availability"
                />
              </Form.Item>
            </div>
          </Form>

          {isTelehealthLoading ? (
            <Loader />
          ) : isTelehealthError ? (
            <div className="text-red-600">
              Failed to load telehealth doctors
            </div>
          ) : cardsData.length ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cardsData.map((record) => {
                  const callStatusColorMap: Record<string, string> = {
                    idle: "blue",
                    busy: "orange",
                    in_call: "processing",
                    offline: "default",
                  };
                  const heroColors = getHeroColors(record.availability);

                  return (
                    <article
                      key={record.key}
                      className={`mx-auto w-full cursor-pointer rounded-2xl border bg-[#fefefe] p-2 text-[#141417] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${heroColors.border}`}
                    >
                      <section
                        className={`rounded-t-xl px-5 py-5 text-sm ${heroColors.background} ${heroColors.text}`}
                      >
                        <header className="flex items-center justify-between gap-4 font-bold">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] shadow-sm ${heroColors.badge}`}
                          >
                            {record.availability}
                          </span>
                          <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white/80 shadow-sm">
                            <img
                              src={placeholderImage}
                              alt="Doctor avatar"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </header>

                        <div className="mt-4 pr-2">
                          <p className="text-[1.2rem] !mb-2 font-semibold leading-tight">
                            {record.doctorName}
                          </p>
                          <p className="text-[15px] font-medium opacity-80">
                            {record.specialty}
                          </p>
                        </div>
                      </section>

                      <footer className="flex flex-col gap-3 p-3 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {record.email}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              <Tag
                                color={
                                  callStatusColorMap[
                                    record.currentCallStatus?.toLowerCase()
                                  ] || "default"
                                }
                              >
                                {formatTagLabel(record.currentCallStatus)}
                              </Tag>
                              <Tag
                                color={record.isCheckedIn ? "success" : "error"}
                                bordered={false}
                              >
                                {record.isCheckedIn
                                  ? "Checked In"
                                  : "Not Checked In"}
                              </Tag>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="primary"
                          className="w-full shrink-0 !rounded-2xl !border-none !bg-[var(--color-green-custom)] !px-5 !py-5 !font-normal !shadow-none sm:w-auto"
                          loading={isCreatingRequest}
                          onClick={() => handleRequestClick(record)}
                        >
                          Request
                        </Button>
                      </footer>
                    </article>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Pagination
                  current={doctorPagination.current}
                  pageSize={doctorPagination.pageSize}
                  total={telehealthData?.count || cardsData.length}
                  showSizeChanger={false}
                  onChange={(page, pageSize) => {
                    setDoctorPagination({ current: page, pageSize });
                  }}
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-white shadow-md">
              <div className="py-8 text-center text-gray-500">
                No telehealth doctors found for the selected patient and
                filters.
              </div>
            </div>
          )}
        </Space>
      ) : (
        <div className="rounded-xl bg-white shadow-md">
          <div className="py-8 text-center text-gray-500">
            Select a patient to view the telehealth doctor queue.
          </div>
        </div>
      )}

      <Modal
        title="Send Telehealth Request"
        open={isRequestModalOpen}
        onCancel={handleRequestModalCancel}
        onOk={() => requestForm.submit()}
        confirmLoading={isCreatingRequest}
        okText="Send Request"
        width={480}
        destroyOnHidden
      >
        <Form
          form={requestForm}
          layout="vertical"
          onFinish={(values) => submitTelehealthRequest(values.reason)}
        >
          <div className="mb-3 text-sm text-slate-600">
            {selectedDoctor && selectedPatient
              ? `Send request to ${selectedDoctor.doctorName} for ${selectedPatient.name}.`
              : "Enter the reason for this telehealth request."}
          </div>
          <Form.Item
            label="Reason"
            name="reason"
            rules={[
              { required: true, message: "Reason is required." },
              { whitespace: true, message: "Reason is required." },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter the reason for telehealth consultation request"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          selectedRemarksPatient
            ? `Consultation Remarks — ${selectedRemarksPatient.name}`
            : "Consultation Remarks"
        }
        open={isRemarksModalOpen}
        onCancel={handleRemarksModalClose}
        footer={[
          <Button key="close" onClick={handleRemarksModalClose}>
            Close
          </Button>,
        ]}
        width={560}
        destroyOnHidden
      >
        {isFetchingRemarks ? (
          <div className="py-6 text-center text-slate-500">Loading...</div>
        ) : consultationRequests.length === 0 ? (
          <div className="py-6 text-center text-slate-500">
            No consultation remarks available.
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-1 pt-2">
            <Timeline
              items={consultationRequests.map((req, idx) => ({
                color: "green",
                children: (
                  <div className="mb-1 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        #{idx + 1} — {req.consultantDoctorName || "-"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {req.requestedAt
                          ? new Date(req.requestedAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                    <p className="mb-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        Reason:
                      </span>{" "}
                      {req.reason || "-"}
                    </p>
                    <div className="mt-1.5 rounded-md bg-white px-3 py-2 text-sm text-slate-800 shadow-sm">
                      {req.consultation_note?.note || "No note provided."}
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default TelehealthQueue;
