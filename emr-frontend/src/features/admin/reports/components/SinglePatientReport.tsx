import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Input,
  Button,
  Row,
  Col,
  Tag,
  Typography,
  Descriptions,
  Table,
  Empty,
  Alert,
  Select,
  Space,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  GiftOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import ReportCard from "./shared/ReportCard";
import ReportHeader from "./shared/ReportHeader";
import StatsRow from "./shared/StatsRow";
import { GREEN } from "./shared/constants";

import { RootState } from "@/redux/store";
import {
  PatientSearchAppointment,
  PatientSearchResult,
  Roles,
} from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";

import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  useLazySearchPatientsQuery,
  type ExportParams,
  type SearchPatientParams,
} from "../../services/reports";
import VisitReportModal from "@/features/patient-journey/patientProfile/components/VisitReportModal";

const { Text, Title } = Typography;

// ─── Report response types ────────────────────────────────────────────────────
interface Patient {
  id: number;
  mrNo: string;
  fullName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  cnic: string;
  address: string;
  registrationDate: string;
  additionalInfo: { marital_status: string; blood_group: string } | null;
  socialDeterminants: {
    dwelling_type: string;
    occupation_head_of_household: string;
    household_members_count: number;
    mother_tongue: string;
    years_of_education: string;
  } | null;
}
interface VisitRecord {
  appointmentId: number;
  visitId: number;
  visitDate: string;
  doctorName: string;
  status: string;
  services: string[];
}
interface ServiceTaken {
  serviceName: string;
  usageCount: number;
}
interface MedicinePrescribed {
  prescriptionId: number;
  medicineName: string;
  quantity: number | null;
  dosage: string | null;
  duration: number | null;
  prescribedOn: string;
  serviceName: string;
}
interface ImmunisationRecord {
  doseId: number;
  vaccineName: string;
  vaccineCode: string;
  doseNumber: number;
  dateAdministered: string;
  administeredBy: string;
}
interface DeliveryRecord {
  deliveryId: number;
  deliveryDate: string;
  deliveryType: string;
  doctorName: string;
  notes?: string;
}

interface SinglePatientData {
  patient: Patient;
  visitHistory: VisitRecord[];
  servicesTaken: ServiceTaken[];
  medicinesPrescribed: MedicinePrescribed[];
  immunisationRecords: ImmunisationRecord[];
  deliveryHistory: DeliveryRecord[];
}

// ─── Table columns ────────────────────────────────────────────────────────────
const SEARCH_COLS = (onSelect: (p: PatientSearchResult) => void) => [
  {
    title: "MR No",
    dataIndex: "mr_no",
    key: "mr_no",
    render: (v: string) => (
      <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Name",
    key: "name",
    render: (_: string, r: PatientSearchResult) => (
      <Text strong>
        {r.first_name} {r.last_name}
      </Text>
    ),
  },
  { title: "CNIC", dataIndex: "cnic", key: "cnic" },
  {
    title: "Gender",
    dataIndex: "gender",
    key: "gender",
    render: (v: string) => (
      <Tag color={v === "Female" ? "pink" : "blue"} style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  { title: "Phone", dataIndex: "phone_number", key: "phone_number" },
  {
    title: "Visits",
    dataIndex: "appointments",
    key: "appointments",
    render: (a: PatientSearchAppointment[]) => (
      <Text style={{ color: GREEN, fontWeight: 600 }}>{a?.length ?? 0}</Text>
    ),
  },
  {
    title: "Action",
    key: "action",
    render: (_: any, r: PatientSearchResult) => (
      <Button
        size="small"
        type="primary"
        onClick={() => onSelect(r)}
        style={{ background: GREEN, borderColor: GREEN, borderRadius: 6 }}
      >
        View Report
      </Button>
    ),
  },
];

const VISIT_COLS = (
  onViewReport: (visitId: number, seqNo: number) => void,
) => [
  {
    title: "Visit",
    dataIndex: "seqNo",
    key: "seqNo",
    render: (v: number) => <Text strong>#{v}</Text>,
  },
  { title: "Visit Date", dataIndex: "visitDate", key: "visitDate" },
  { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
  {
    title: "Services",
    dataIndex: "services",
    key: "services",
    render: (s: string[]) =>
      s?.map((x) => (
        <Tag key={x} color="blue" style={{ borderRadius: 6, marginBottom: 2 }}>
          {x}
        </Tag>
      )),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (v: string) => (
      <Tag
        color={v === "completed" ? "green" : "orange"}
        style={{ borderRadius: 6, textTransform: "capitalize" }}
      >
        {v}
      </Tag>
    ),
  },
  {
    title: "Action",
    key: "action",
    render: (_: any, record: { visitId: number; seqNo: number }) => (
      <Button
        size="small"
        type="primary"
        icon={<EyeOutlined />}
        onClick={() => onViewReport(record.visitId, record.seqNo)}
        style={{ background: GREEN, borderColor: GREEN, borderRadius: 6 }}
      >
        View Report
      </Button>
    ),
  },
];

const MEDICINE_COLS = [
  {
    title: "Medicine",
    dataIndex: "medicineName",
    key: "medicineName",
    render: (v: string) => <Text strong>{v}</Text>,
  },
  {
    title: "Service",
    dataIndex: "serviceName",
    key: "serviceName",
    render: (v: string) => (
      <Tag color="blue" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Qty",
    dataIndex: "quantity",
    key: "quantity",
    render: (v: number | null) => v ?? "—",
  },
  {
    title: "Dosage",
    dataIndex: "dosage",
    key: "dosage",
    render: (v: string | null) => v ?? "—",
  },
  {
    title: "Duration",
    dataIndex: "duration",
    key: "duration",
    render: (v: number | null) => (v ? `${v} day(s)` : "—"),
  },
  {
    title: "Prescribed On",
    dataIndex: "prescribedOn",
    key: "prescribedOn",
    render: (v: string) => v?.split("T")[0],
  },
];

const IMMU_COLS = [
  {
    title: "Vaccine",
    dataIndex: "vaccineName",
    key: "vaccineName",
    render: (v: string) => <Text strong>{v}</Text>,
  },
  {
    title: "Code",
    dataIndex: "vaccineCode",
    key: "vaccineCode",
    render: (v: string) => (
      <Tag color="cyan" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  { title: "Dose #", dataIndex: "doseNumber", key: "doseNumber" },
  { title: "Date", dataIndex: "dateAdministered", key: "dateAdministered" },
  {
    title: "Administered By",
    dataIndex: "administeredBy",
    key: "administeredBy",
  },
];

const DELIVERY_COLS = [
  { title: "Date", dataIndex: "deliveryDate", key: "deliveryDate" },
  {
    title: "Type",
    dataIndex: "deliveryType",
    key: "deliveryType",
    render: (v: string) => (
      <Tag
        color={v === "Normal" ? "green" : "orange"}
        style={{ borderRadius: 6 }}
      >
        {v ?? "Not Recorded"}
      </Tag>
    ),
  },
  { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
  {
    title: "Notes",
    dataIndex: "notes",
    key: "notes",
    render: (v: string) => v ?? "—",
  },
];

const SERVICE_COLS = [
  {
    title: "Service Name",
    dataIndex: "serviceName",
    key: "serviceName",
    render: (v: string) => (
      <Tag color="purple" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Times Used",
    dataIndex: "usageCount",
    key: "usageCount",
    render: (v: number) => (
      <Text strong style={{ color: GREEN }}>
        {v}
      </Text>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const SinglePatientReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mrNo, setMrNo] = useState("");
  const [cnic, setCnic] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  // Step: "search" | "results" | "report"
  const [step, setStep] = useState<"search" | "results" | "report">("search");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [isVisitReportOpen, setIsVisitReportOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [selectedVisitSeqNo, setSelectedVisitSeqNo] = useState<number | null>(null);

  // ── Facility dropdown ─────────────────────────────────────────────────────────
  const pagination = useDropDownPagination();
  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearch,
    });

  useEffect(() => {
    if (facilitiesResponse?.lastPage)
      pagination.setLastPage(facilitiesResponse.lastPage);
  }, [facilitiesResponse, pagination]);

  const facilities = useMemo(
    () =>
      facilitiesResponse
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  useEffect(() => {
    if (!facilities.length) return;
    if (pagination.currentPage === 1) setFacilityOptions(facilities);
    else setFacilityOptions((prev) => [...prev, ...facilities]);
  }, [facilities, pagination.currentPage]);

  useEffect(() => {
    if (isFacilityIncharge && userFacilityId && adminUser?.facility) {
      setFacilityOptions([
        { label: adminUser.facility.name, value: userFacilityId },
      ]);
      setSelectedFacilityId(userFacilityId);
    }
  }, [isFacilityIncharge, userFacilityId, adminUser]);

  const handleFacilitySearch = useCallback(
    (value: string) => {
      if (isDropdownDisabled) return;
      setFacilitySearch(value);
      pagination.reset();
      refetchFacilities();
    },
    [isDropdownDisabled, pagination, refetchFacilities],
  );

  // ── Search API ────────────────────────────────────────────────────────────────
  const [
    triggerSearch,
    { data: searchRaw, isLoading: searchLoading, isError: searchError },
  ] = useLazySearchPatientsQuery();

  const searchResults = searchRaw?.data ?? [];

  const handleSearch = () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedMrNo = mrNo.trim();
    const trimmedCnic = cnic.trim().replace(/-/g, "");

    if (!trimmedFirstName && !trimmedLastName && !trimmedMrNo && !trimmedCnic) {
      return;
    }

    const facilityId = isFacilityIncharge ? userFacilityId : selectedFacilityId;
    const params: SearchPatientParams = {
      ...(trimmedFirstName ? { first_name: trimmedFirstName } : {}),
      ...(trimmedLastName ? { last_name: trimmedLastName } : {}),
      ...(trimmedMrNo ? { mr_no: trimmedMrNo } : {}),
      ...(trimmedCnic ? { cnic: trimmedCnic } : {}),
      ...(facilityId ? { facility_id: facilityId } : {}),
      page: 1,
      limit: 20,
    };

    triggerSearch(params);
    setStep("results");
  };


  // ── Report API ────────────────────────────────────────────────────────────────
  const [triggerGet, { data: rawData, isError: reportError, error }] =
    useLazyGetReportQuery();
  const [triggerExport] = useLazyExportReportQuery();

  const response = rawData as { data: SinglePatientData } | undefined;
  const report = response?.data;
  const patient = report?.patient;
  const groupedVisitHistory = useMemo(() => {
    const visits = report?.visitHistory || [];
    const visitMap = new Map<
      number,
      {
        key: number;
        visitId: number;
        visitDate: string;
        doctorNames: string[];
        status: string;
        services: string[];
      }
    >();

    visits.forEach((visit) => {
      const existing = visitMap.get(visit.visitId);

      if (!existing) {
        visitMap.set(visit.visitId, {
          key: visit.visitId,
          visitId: visit.visitId,
          visitDate: visit.visitDate,
          doctorNames: visit.doctorName ? [visit.doctorName] : [],
          status: visit.status,
          services: [...new Set(visit.services || [])],
        });
        return;
      }

      if (visit.doctorName && !existing.doctorNames.includes(visit.doctorName)) {
        existing.doctorNames.push(visit.doctorName);
      }

      existing.services = [...new Set([...existing.services, ...(visit.services || [])])];
      existing.status = existing.status || visit.status;
    });

    return Array.from(visitMap.values())
      .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime())
      .map((visit, index) => ({
        ...visit,
        doctorName: visit.doctorNames.join(", "),
        seqNo: index + 1,
      }));
  }, [report?.visitHistory]);

  const handleSelectPatient = (p: PatientSearchResult) => {
    setSelectedPatientId(p.id);
    setStep("report");
    const facilityId = isFacilityIncharge ? userFacilityId : selectedFacilityId;
    triggerGet({
      reportType: "single-patient" as const,
      patientId: p.id,
      ...(facilityId ? { facilityId } : {}),
    });
  };

  const handleBack = () => {
    setStep("results");
    setSelectedPatientId(null);
  };

  const handleViewVisitReport = (visitId: number, seqNo: number) => {
    setSelectedVisitId(visitId);
    setSelectedVisitSeqNo(seqNo);
    setIsVisitReportOpen(true);
  };

  const handleExport = async (type: "PDF" | "EXCEL") => {
    if (!selectedPatientId) return;
    const facilityId = isFacilityIncharge ? userFacilityId : selectedFacilityId;
    const result = await triggerExport({
      reportType: "single-patient" as const,
      patientId: selectedPatientId,
      exportType: type,
      ...(facilityId ? { facilityId } : {}),
    } as ExportParams);
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `single-patient-report.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(result.data.downloadUrl);
    }
  };

  return (
    <ReportCard>
      <ReportHeader
        icon={<UserOutlined />}
        title="Single Patient Report"
        subtitle="Search by name, MR number, or CNIC to view patient history"
        onExportPDF={
          step === "report" && patient ? () => handleExport("PDF") : undefined
        }
        onExportExcel={
          step === "report" && patient ? () => handleExport("EXCEL") : undefined
        }
      />

      {/* ── Search bar ── */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #deeee5",
          background: "#f7fbf8",
        }}
      >
        <Row gutter={[12, 12]} align="middle" wrap>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: "#aaa" }} />}
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Input
              size="large"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Input
              size="large"
              placeholder="MR No"
              value={mrNo}
              onChange={(e) => setMrNo(e.target.value)}
              onPressEnter={handleSearch}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Input
              size="large"
              placeholder="CNIC"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              onPressEnter={handleSearch}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Facility */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder={
                isDropdownDisabled
                  ? (adminUser?.facility?.name ?? "N/A")
                  : "Select Facility"
              }
              options={facilityOptions}
              showSearch={!isDropdownDisabled}
              onChange={(v) => {
                if (!isDropdownDisabled) setSelectedFacilityId(v ?? null);
              }}
              onSearch={handleFacilitySearch}
              filterOption={false}
              disabled={isDropdownDisabled}
              value={selectedFacilityId ?? undefined}
              allowClear={!isDropdownDisabled}
              onClear={() => setSelectedFacilityId(null)}
              onPopupScroll={(e) => {
                const t = e.target as HTMLDivElement;
                if (
                  t.scrollTop + t.clientHeight >= t.scrollHeight - 20 &&
                  !pagination.isLoadingMore
                )
                  pagination.fetchMore();
              }}
              notFoundContent={
                pagination.isLoadingMore ? "Loading..." : "No facilities found"
              }
            />
          </Col>

          {/* Search button */}
          <Col xs={24} sm="auto">
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                loading={searchLoading}
                onClick={handleSearch}
                style={{
                  background: GREEN,
                  borderColor: GREEN,
                  borderRadius: 8,
                  paddingInline: 24,
                }}
              >
                Search
              </Button>
              {step !== "search" && (
                <Button
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    setStep("search");
                    setFirstName("");
                    setLastName("");
                    setMrNo("");
                    setCnic("");
                  }}
                  style={{ borderRadius: 8 }}
                >
                  New Search
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* ── Step 1: empty state ── */}
      {step === "search" && (
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text style={{ color: "#888" }}>
                Enter first/last name, MR number, or CNIC to search patients
              </Text>
            }
          />
        </div>
      )}

      {/* ── Step 2: search results table ── */}
      {step === "results" && (
        <div style={{ padding: "20px 24px" }}>
          {searchError && (
            <Alert
              type="error"
              showIcon
              message="Search failed"
              style={{ marginBottom: 16 }}
              description="Could not fetch patients. Please try again."
            />
          )}
          {!searchError && searchResults.length === 0 && !searchLoading && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ color: "#888" }}>
                  No patients found for the entered criteria
                </Text>
              }
            />
          )}
          {searchResults.length > 0 && (
            <>
              <Text
                style={{ display: "block", marginBottom: 12, color: "#555" }}
              >
                Found{" "}
                <Text strong style={{ color: GREEN }}>
                  {searchResults.length}
                </Text>{" "}
                patient(s) — click <Text strong>View Report</Text> to load their
                full report
              </Text>
              <Table
                columns={SEARCH_COLS(handleSelectPatient)}
                dataSource={searchResults.map((p) => ({ ...p, key: p.id }))}
                loading={searchLoading}
                size="middle"
                pagination={false}
                scroll={{ x: "max-content" }}
                rowHoverable
              />
            </>
          )}
        </div>
      )}

      {/* ── Step 3: full patient report ── */}
      {step === "report" && (
        <>
          {/* Back to results */}
          <div
            style={{
              padding: "12px 24px",
              borderBottom: "1px solid #deeee5",
              background: "#f7fbf8",
            }}
          >
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ borderRadius: 8 }}
            >
              Back to Results
            </Button>
          </div>

          {reportError && (
            <div style={{ padding: "20px 24px" }}>
              <Alert
                type="error"
                showIcon
                message="Report not found"
                description={
                  (error as any)?.message ??
                  "Could not load report for this patient."
                }
              />
            </div>
          )}

          {patient && !reportError && (
            <>
              {/* Stats */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                }}
              >
                <StatsRow
                  stats={[
                    {
                      label: "Total Visits",
                      value: groupedVisitHistory.length,
                      highlight: true,
                    },
                    {
                      label: "Services Taken",
                      value: report!.servicesTaken.length,
                    },
                    {
                      label: "Medicines",
                      value: report!.medicinesPrescribed.length,
                    },
                    {
                      label: "Immunisations",
                      value: report!.immunisationRecords.length,
                    },
                  ]}
                />
              </div>

              {/* Patient Profile */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                  background: "#fafcfb",
                }}
              >
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  Patient Profile
                </Title>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #deeee5",
                    padding: "16px 20px",
                  }}
                >
                  <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
                    <Descriptions.Item label="MR No">
                      <Tag
                        color="green"
                        style={{ borderRadius: 6, fontWeight: 600 }}
                      >
                        {patient.mrNo}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Full Name">
                      <Text strong>{patient.fullName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Age">
                      {patient.age} years
                    </Descriptions.Item>
                    <Descriptions.Item label="Gender">
                      <Tag
                        color={patient.gender === "Female" ? "pink" : "blue"}
                        style={{ borderRadius: 6 }}
                      >
                        {patient.gender}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Blood Group">
                      <Tag color="red" style={{ borderRadius: 6 }}>
                        {patient.additionalInfo?.blood_group ?? "—"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Marital Status">
                      {patient.additionalInfo?.marital_status ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {patient.phoneNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="CNIC">
                      {patient.cnic}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      {patient.address}
                    </Descriptions.Item>
                    <Descriptions.Item label="Registered On">
                      {dayjs(patient.registrationDate).format("DD MMM YYYY")}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              </div>

              {/* Social Determinants */}
              {patient.socialDeterminants && (
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #deeee5",
                  }}
                >
                  <Title
                    level={5}
                    style={{ color: "#1a3d2b", marginBottom: 16 }}
                  >
                    Social Determinants
                  </Title>
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #deeee5",
                      padding: "16px 20px",
                    }}
                  >
                    <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
                      <Descriptions.Item label="Dwelling Type">
                        {patient.socialDeterminants.dwelling_type}
                      </Descriptions.Item>
                      <Descriptions.Item label="Occupation (HoH)">
                        {
                          patient.socialDeterminants
                            .occupation_head_of_household
                        }
                      </Descriptions.Item>
                      <Descriptions.Item label="Household Members">
                        {patient.socialDeterminants.household_members_count}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mother Tongue">
                        {patient.socialDeterminants.mother_tongue}
                      </Descriptions.Item>
                      <Descriptions.Item label="Education">
                        {patient.socialDeterminants.years_of_education}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>
              )}

              {/* Services Taken */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                  background: "#fafcfb",
                }}
              >
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Services Taken
                </Title>
                <Table
                  columns={SERVICE_COLS}
                  dataSource={report!.servicesTaken.map((s, i) => ({
                    ...s,
                    key: i,
                  }))}
                  pagination={false}
                  size="small"
                />
              </div>

              {/* Visit History */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                }}
              >
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Visit History
                </Title>
                <Table
                  columns={VISIT_COLS(handleViewVisitReport)}
                  dataSource={groupedVisitHistory}
                  pagination={false}
                  size="small"
                />
              </div>

              {/* Medicines */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                  background: "#fafcfb",
                }}
              >
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <MedicineBoxOutlined style={{ marginRight: 8 }} />
                  Medicines Prescribed
                </Title>
                <Table
                  columns={MEDICINE_COLS}
                  dataSource={report!.medicinesPrescribed.map((m) => ({
                    ...m,
                    key: m.prescriptionId,
                  }))}
                  pagination={false}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>

              {/* Immunisations */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #deeee5",
                }}
              >
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <HeartOutlined style={{ marginRight: 8 }} />
                  Immunisation Records
                </Title>
                <Table
                  columns={IMMU_COLS}
                  dataSource={report!.immunisationRecords.map((r) => ({
                    ...r,
                    key: r.doseId,
                  }))}
                  pagination={false}
                  size="small"
                />
              </div>

              {/* Delivery History */}
              <div style={{ padding: "20px 24px" }}>
                <Title level={5} style={{ color: "#1a3d2b", marginBottom: 16 }}>
                  <GiftOutlined style={{ marginRight: 8 }} />
                  Delivery History
                </Title>
                {report!.deliveryHistory.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No delivery records found"
                  />
                ) : (
                  <Table
                    columns={DELIVERY_COLS}
                    dataSource={report!.deliveryHistory.map((d, i) => ({
                      ...d,
                      key: i,
                    }))}
                    pagination={false}
                    size="small"
                  />
                )}
              </div>

              <VisitReportModal
                open={isVisitReportOpen}
                visitId={selectedVisitId}
                visitNumber={selectedVisitSeqNo}
                onClose={() => {
                  setIsVisitReportOpen(false);
                  setSelectedVisitId(null);
                  setSelectedVisitSeqNo(null);
                }}
              />
            </>
          )}
        </>
      )}
    </ReportCard>
  );
};

export default SinglePatientReport;
