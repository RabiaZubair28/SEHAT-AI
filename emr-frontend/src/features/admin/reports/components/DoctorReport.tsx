import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  Typography,
  Avatar,
  Select,
  Row,
  Col,
  Alert,
  DatePicker,
  Button,
  Space,
  Empty,
} from "antd";
import {
  ExperimentOutlined,
  UserOutlined,
  FilterOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSelector } from "react-redux";

import ReportCard from "./shared/ReportCard";
import ReportHeader from "./shared/ReportHeader";
import StatsRow from "./shared/StatsRow";
import { GREEN, GREEN_SOFT } from "./shared/constants";

import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useGetDoctorsByFacilityQuery } from "@/services/doctorsByFacilityApi";

import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  type ExportParams,
} from "../../services/reports";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PAGE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DoctorRecord {
  doctorId: number;
  doctorName: string;
  patientsTreated: number;
  servicesProvided: string[];
  servicesProvidedCount: number;
  medicinesPrescribedCount: number;
}

interface FacilitySummary {
  totalDoctors: number;
  totalPatientsTreated: number;
  totalPrescriptionsGiven: number;
  totalServicesProvided: number;
}

interface ApiResponse {
  data: {
    records: DoctorRecord[];
    facilitySummary: FacilitySummary;
  };
  count: number;
  page: number;
  lastPage: number;
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: "Doctor",
    dataIndex: "doctorName",
    key: "doctorName",
    render: (v: string) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar
          icon={<UserOutlined />}
          style={{ background: GREEN }}
          size={32}
        />
        <Text strong>{v}</Text>
      </div>
    ),
  },
  {
    title: "Patients Treated",
    dataIndex: "patientsTreated",
    key: "patientsTreated",
    render: (v: number) => (
      <Text style={{ color: GREEN, fontWeight: 600 }}>{v}</Text>
    ),
  },
  {
    title: "Services Provided",
    dataIndex: "servicesProvidedCount",
    key: "servicesProvidedCount",
  },
  {
    title: "Services",
    dataIndex: "servicesProvided",
    key: "servicesProvided",
    render: (services: string[]) => (
      <>
        {services.map((s) => (
          <Tag
            key={s}
            color="green"
            style={{ borderRadius: 6, marginBottom: 2 }}
          >
            {s}
          </Tag>
        ))}
      </>
    ),
  },
  {
    title: "Medicines Prescribed",
    dataIndex: "medicinesPrescribedCount",
    key: "medicinesPrescribedCount",
    render: (v: number) => (
      <Tag color="blue" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const DoctorReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isFacilityLocked = Boolean(isFacilityIncharge && userFacilityId);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    isFacilityLocked ? (userFacilityId ?? null) : null,
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  const {
    page,
    pageSize,
    onChange: handlePageChange,
    reset: resetPage,
  } = useTablePagination(
    (nextPage, nextPageSize) =>
      triggerGet(buildParams({ page: nextPage, limit: nextPageSize })),
    PAGE_SIZE,
  );

  // ── Facility dropdown (super admin only) ─────────────────────────────────────
  const facPagination = useDropDownPagination();

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: facPagination.currentPage,
      limit: 10,
      name: facilitySearch,
    });

  useEffect(() => {
    if (facilitiesResponse?.lastPage)
      facPagination.setLastPage(facilitiesResponse.lastPage);
  }, [facilitiesResponse, facPagination]);

  const facilities = useMemo(
    () =>
      facilitiesResponse
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  useEffect(() => {
    if (!facilities.length) return;
    if (facPagination.currentPage === 1) setFacilityOptions(facilities);
    else setFacilityOptions((prev) => [...prev, ...facilities]);
  }, [facilities, facPagination.currentPage]);

  useEffect(() => {
    if (facilitySearch !== "" && facPagination.currentPage === 1)
      setFacilityOptions(facilities);
  }, [facilitySearch, facilities, facPagination.currentPage]);

  // Pre-select & lock for facility incharge
  useEffect(() => {
    if (isFacilityLocked && userFacilityId && adminUser?.facility) {
      setFacilityOptions([
        { label: adminUser.facility.name, value: userFacilityId },
      ]);
      setSelectedFacilityId(userFacilityId);
    }
  }, [isFacilityLocked, userFacilityId, adminUser]);

  const handleFacilitySearch = useCallback(
    (value: string) => {
      if (isFacilityLocked) return;
      setFacilitySearch(value);
      facPagination.reset();
      refetchFacilities();
      // Clear doctor when facility changes
      setSelectedDoctorId(null);
    },
    [isFacilityLocked, facPagination, refetchFacilities],
  );

  const handleFacilityChange = useCallback(
    (value: any) => {
      if (isFacilityLocked) return;
      setSelectedFacilityId(value ?? null);
      setSelectedDoctorId(null); // reset doctor on facility change
    },
    [isFacilityLocked],
  );

  // ── Doctors dropdown — fetched once a facility is selected ───────────────────
  const facilityIdForDoctors = selectedFacilityId ?? userFacilityId;

  const { data: doctorsResponse } = useGetDoctorsByFacilityQuery(
    { facility_id: facilityIdForDoctors!, page: 1, limit: 100 },
    { skip: !facilityIdForDoctors },
  );

  const doctorOptions = useMemo(
    () =>
      (doctorsResponse?.data ?? []).map((d) => ({
        label: `${d.first_name} ${d.last_name}`,
        value: d.id,
      })),
    [doctorsResponse],
  );

  // ── Report API ───────────────────────────────────────────────────────────────
  const [triggerGet, { data: rawData, isLoading, isFetching, isError, error }] =
    useLazyGetReportQuery();
  const [triggerExport] = useLazyExportReportQuery();

  const response = rawData as ApiResponse | undefined;
  const records = Array.isArray(response?.data?.records)
    ? response!.data.records
    : [];
  const facilitySummary = response?.data?.facilitySummary;
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Chart data ───────────────────────────────────────────────────────────────
  const chartData = records.map((d) => ({
    name: d.doctorName,
    Patients: d.patientsTreated,
    Services: d.servicesProvidedCount,
    Prescriptions: d.medicinesPrescribedCount,
  }));

  // ── Param builder ─────────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "doctor" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...(selectedDoctorId && { doctorId: selectedDoctorId }),
      ...overrides,
    }),
    [dateRange, selectedFacilityId, selectedDoctorId],
  );

  // ── Auto-fetch for facility incharge on mount ─────────────────────────────────
  useEffect(() => {
    if (isFacilityLocked && userFacilityId) {
      triggerGet({
        reportType: "doctor",
        page: 1,
        limit: PAGE_SIZE,
        facilityId: userFacilityId,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    resetPage();
    triggerGet(buildParams({ page: 1, limit: pageSize }));
  };

  const handleReset = () => {
    setDateRange(null);
    setSelectedDoctorId(null);
    resetPage();
    if (!isFacilityLocked) setSelectedFacilityId(null);
  };

  const handleExport = async (type: "PDF" | "EXCEL") => {
    const result = await triggerExport(
      buildParams({ exportType: type }) as ExportParams,
    );
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `doctor-report.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(result.data.downloadUrl);
    }
  };

  const loading = isLoading || isFetching;

  // Super admin must select a facility first before seeing doctor dropdown
  const showDoctorDropdown = Boolean(facilityIdForDoctors);

  // Stats — from server-side facilitySummary (full dataset, not page-derived)
  const totalPatients =
    facilitySummary?.totalPatientsTreated ??
    records.reduce((s, r) => s + r.patientsTreated, 0);
  const totalServices =
    facilitySummary?.totalServicesProvided ??
    records.reduce((s, r) => s + r.servicesProvidedCount, 0);
  const totalPrescriptions =
    facilitySummary?.totalPrescriptionsGiven ??
    records.reduce((s, r) => s + r.medicinesPrescribedCount, 0);
  const totalDoctors = facilitySummary?.totalDoctors ?? total;

  return (
    <ReportCard>
      <ReportHeader
        icon={<ExperimentOutlined />}
        title="Doctor Report"
        subtitle="Doctor-wise activity and performance metrics"
        onExportPDF={generated ? () => handleExport("PDF") : undefined}
        onExportExcel={generated ? () => handleExport("EXCEL") : undefined}
      />

      {/* ── Filters ── */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid #deeee5",
          background: "#f7fbf8",
        }}
      >
        <Row gutter={[12, 12]} align="middle" wrap>
          {/* Date Range */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <RangePicker
              size="large"
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(val) => setDateRange(val as [Dayjs, Dayjs] | null)}
            />
          </Col>

          {/* Facility */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder={
                isFacilityLocked
                  ? (adminUser?.facility?.name ?? "N/A")
                  : "Select Facility"
              }
              options={facilityOptions}
              showSearch={!isFacilityLocked}
              onChange={handleFacilityChange}
              onSearch={handleFacilitySearch}
              filterOption={false}
              disabled={isFacilityLocked}
              value={selectedFacilityId ?? undefined}
              allowClear={!isFacilityLocked}
              onClear={() => {
                setSelectedFacilityId(null);
                setSelectedDoctorId(null);
              }}
              onPopupScroll={(e) => {
                const t = e.target as HTMLDivElement;
                if (
                  t.scrollTop + t.clientHeight >= t.scrollHeight - 20 &&
                  !facPagination.isLoadingMore
                )
                  facPagination.fetchMore();
              }}
              notFoundContent={
                facPagination.isLoadingMore
                  ? "Loading..."
                  : "No facilities found"
              }
            />
          </Col>

          {/* Doctor — only shown once a facility is selected */}
          {showDoctorDropdown && (
            <Col xs={24} sm={12} md={8} lg={6}>
              <Select
                size="large"
                style={{ width: "100%" }}
                placeholder="All Doctors"
                options={doctorOptions}
                value={selectedDoctorId ?? undefined}
                onChange={(v) => setSelectedDoctorId(v ?? null)}
                allowClear
                onClear={() => setSelectedDoctorId(null)}
                showSearch
                filterOption={(input, opt) =>
                  ((opt?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                notFoundContent="No doctors found"
              />
            </Col>
          )}

          {/* Buttons */}
          <Col xs={24} sm={12} md={8} lg="auto">
            <Space>
              <Button
                size="large"
                type="primary"
                icon={<FilterOutlined />}
                onClick={handleGenerate}
                loading={loading}
                style={{
                  background: GREEN,
                  borderColor: GREEN,
                  borderRadius: 8,
                }}
              >
                Apply
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleReset}
                style={{ borderRadius: 8 }}
              >
                Reset
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Super admin hint */}
        {!isFacilityLocked && !selectedFacilityId && (
          <div style={{ marginTop: 10, color: "#888", fontSize: 12 }}>
            Select a facility above to filter by doctor
          </div>
        )}

        <Row justify="end" style={{ marginTop: 14 }}>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleGenerate}
              loading={loading}
              style={{
                background: GREEN,
                borderColor: GREEN,
                borderRadius: 8,
                paddingInline: 28,
                fontWeight: 600,
              }}
            >
              Generate Report
            </Button>
          </Col>
        </Row>
      </div>

      {isError && (
        <div style={{ padding: "16px 24px" }}>
          <Alert
            type="error"
            showIcon
            message="Failed to load report"
            description={(error as any)?.message ?? "Please try again."}
          />
        </div>
      )}

      {generated && !isError && (
        <>
          {/* Stats */}
          <div
            style={{ padding: "20px 24px", borderBottom: "1px solid #deeee5" }}
          >
            <StatsRow
              stats={[
                {
                  label: "Available Doctor(s)",
                  value: totalDoctors,
                  highlight: true,
                },
                { label: "Total Patient(s) Seen", value: totalPatients },
                { label: "Total Service(s) provided", value: totalServices },
                { label: "Total Prescription(s)", value: totalPrescriptions },
              ]}
            />
          </div>

          {/* Chart */}
          {records.length > 0 ? (
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #deeee5",
                background: "#fafcfb",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "18px 20px",
                  border: "1px solid #deeee5",
                }}
              >
                <Text
                  strong
                  style={{
                    color: "#1a3d2b",
                    display: "block",
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  Doctor Performance Comparison
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#888" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#888" }}
                      allowDecimals={false}
                    />
                    <RTooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #deeee5",
                        fontSize: 13,
                      }}
                      cursor={{ fill: GREEN_SOFT }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="Patients"
                      fill="#064526"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                    />
                    <Bar
                      dataKey="Services"
                      fill="#2196f3"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                    />
                    <Bar
                      dataKey="Prescriptions"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No doctor data found for the selected filters"
              />
            </div>
          )}

          {/* Table */}
          <div style={{ padding: "20px 24px" }}>
            <Table
              columns={COLUMNS}
              dataSource={records.map((r) => ({ ...r, key: r.doctorId }))}
              loading={loading}
              size="middle"
              scroll={{ x: "max-content" }}
              rowHoverable
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: handlePageChange,
                size: "small",
                showTotal: (t) => `${t} doctors`,
              }}
            />
          </div>
        </>
      )}
    </ReportCard>
  );
};

export default DoctorReport;
