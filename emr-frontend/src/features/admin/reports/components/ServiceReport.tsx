import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  Typography,
  Select,
  Row,
  Col,
  Alert,
  DatePicker,
  Button,
  Space,
} from "antd";
import {
  FileTextOutlined,
  FilterOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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

import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  type ExportParams,
} from "../../services/reports";

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ─── Service type options ─────────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { value: "OPD", label: "OPD" },
  { value: "ANC", label: "ANC" },
  { value: "PNC", label: "PNC" },
  { value: "NUTRITION", label: "Nutrition" },
  { value: "FAMILY_PLANNING", label: "Family Planning" },
  { value: "MEDICINE_DISPENSING", label: "Medicine Dispensing" },
  { value: "IMMUNISATION", label: "Immunisation" },
  { value: "DELIVERY", label: "Delivery" },
];

// ─── Chart colors per service ────────────────────────────────────────────────
const SERVICE_COLORS: Record<string, string> = {
  OPD: "#064526",
  ANC: "#2196f3",
  PNC: "#9c27b0",
  NUTRITION: "#f59e0b",
  FAMILY_PLANNING: "#e91e63",
  MEDICINE_DISPENSING: "#00bcd4",
  IMMUNISATION: "#4caf50",
  DELIVERY: "#ff5722",
};
const FALLBACK_COLORS = [
  "#064526",
  "#2196f3",
  "#9c27b0",
  "#f59e0b",
  "#e91e63",
  "#00bcd4",
  "#4caf50",
  "#ff5722",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceRecord {
  appointmentServiceId: number;
  serviceName: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  date: string;
}

interface UsageSummary {
  serviceName: string;
  usageCount: number;
}

interface UsagePerFacility {
  facilityId: number;
  facilityName: string;
  serviceName: string;
  usageCount: number;
}

interface FacilityCount {
  facilityId: number;
  facilityName: string;
  servicesCount: number;
}

interface ApiResponse {
  data: {
    records: ServiceRecord[];
    usageSummary: UsageSummary[];
    servicesCountPerFacility: FacilityCount[];
    usageCountPerServicePerFacility: UsagePerFacility[];
  };
  count: number;
  page: number;
  lastPage: number;
}

const PAGE_SIZE = 10;

// ─── Table columns ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: "Service",
    dataIndex: "serviceName",
    key: "serviceName",
    render: (v: string) => (
      <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Patient",
    dataIndex: "patientName",
    key: "patientName",
    render: (v: string) => <Text strong>{v}</Text>,
  },
  {
    title: "Doctor",
    dataIndex: "doctorName",
    key: "doctorName",
    render: (v: string) => (
      <Tag color="blue" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
    render: (v: string) => v?.split("T")[0] ?? "—",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ServiceReport: React.FC = () => {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [serviceType, setServiceType] = useState<string>("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );
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

  // ── Facility dropdown ────────────────────────────────────────────────────────
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
    if (facilitySearch !== "" && pagination.currentPage === 1)
      setFacilityOptions(facilities);
  }, [facilitySearch, facilities, pagination.currentPage]);

  // Pre-select & lock for facility incharge
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

  const handleFacilityChange = useCallback(
    (value: any) => {
      if (isDropdownDisabled) return;
      setSelectedFacilityId(value ?? null);
    },
    [isDropdownDisabled],
  );

  // ── Report API ───────────────────────────────────────────────────────────────
  const [triggerGet, { data: rawData, isLoading, isFetching, isError, error }] =
    useLazyGetReportQuery();

  const [triggerExport] = useLazyExportReportQuery();

  const response = rawData as ApiResponse | undefined;
  const records = response?.data?.records ?? [];
  const usageSummary = response?.data?.usageSummary ?? [];
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Chart data — use usageSummary from API (accurate across all pages) ───────
  const chartData = usageSummary.map((s) => ({
    name: s.serviceName,
    count: s.usageCount,
  }));

  // ── Auto-fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    triggerGet({
      reportType: "service" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(isFacilityIncharge && userFacilityId
        ? { facilityId: userFacilityId }
        : {}),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Param builder ─────────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "service" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(serviceType && { serviceType }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...overrides,
    }),
    [dateRange, serviceType, selectedFacilityId],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    resetPage();
    triggerGet(buildParams({ page: 1, limit: pageSize }));
  };

  const handleReset = () => {
    setDateRange(null);
    setServiceType("");
    resetPage();
    if (!isDropdownDisabled) setSelectedFacilityId(null);
  };

  const handleExport = async (type: "PDF" | "EXCEL") => {
    const result = await triggerExport(
      buildParams({ exportType: type }) as ExportParams,
    );
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `service-report.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(result.data.downloadUrl);
    }
  };

  const loading = isLoading || isFetching;

  return (
    <ReportCard>
      <ReportHeader
        icon={<FileTextOutlined />}
        title="Service Report"
        subtitle="Services rendered within the selected period"
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
          <Col xs={24} sm={12} md={7} lg={6}>
            <RangePicker
              size="large"
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(val) => setDateRange(val as [Dayjs, Dayjs] | null)}
            />
          </Col>

          {/* Facility */}
          <Col xs={12} sm={10} md={6} lg={5}>
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
              onChange={handleFacilityChange}
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

          {/* Service Type */}
          <Col xs={12} sm={8} md={5} lg={4}>
            <Select
              placeholder="Service Type"
              size="large"
              style={{ width: "100%" }}
              allowClear
              value={serviceType || undefined}
              onChange={(v) => setServiceType(v ?? "")}
              options={SERVICE_OPTIONS}
            />
          </Col>

          {/* Buttons */}
          <Col xs={24} sm="auto">
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

      {/* ── Error ── */}
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

      {/* ── Results ── */}
      {generated && !isError && (
        <>
          {/* Stats */}
          <div
            style={{ padding: "20px 24px", borderBottom: "1px solid #deeee5" }}
          >
            <StatsRow
              stats={[
                { label: "Total Records", value: total, highlight: true },
                { label: "Service Type(s)", value: usageSummary.length },
                { label: "This Page", value: records.length },
                {
                  label: "Most Used",
                  value:
                    [...usageSummary].sort(
                      (a, b) => b.usageCount - a.usageCount,
                    )[0]?.serviceName ?? "—",
                },
              ]}
            />
          </div>

          {/* Charts */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid #deeee5",
              background: "#fafcfb",
            }}
          >
            <Row gutter={[20, 20]}>
              {/* Horizontal bar — service usage */}
              <Col xs={24} lg={14}>
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
                    Service Usage Breakdown
                  </Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} layout="vertical" barSize={16}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#888" }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#555" }}
                        width={120}
                      />
                      <RTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #deeee5",
                          fontSize: 13,
                        }}
                        cursor={{ fill: GREEN_SOFT }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Usages">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              SERVICE_COLORS[entry.name] ??
                              FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              {/* Line — usage over time derived from dates in data */}
              <Col xs={24} lg={10}>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "18px 20px",
                    border: "1px solid #deeee5",
                    height: "100%",
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
                    Daily Service Activity
                  </Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={buildDailyTrend(records)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#888" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#888" }}
                      />
                      <RTooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid #deeee5",
                          fontSize: 13,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={GREEN}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: GREEN }}
                        name="Services"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </div>

          {/* Table */}
          <div style={{ padding: "20px 24px" }}>
            <Table
              columns={COLUMNS}
              dataSource={records.map((r) => ({
                ...r,
                key: r.appointmentServiceId,
              }))}
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
                showTotal: (t) => `${t} records`,
              }}
            />
          </div>
        </>
      )}
    </ReportCard>
  );
};

// ─── Build daily trend from live records ──────────────────────────────────────
function buildDailyTrend(records: ServiceRecord[]) {
  const counts: Record<string, number> = {};
  records.forEach((r) => {
    if (!r.date) return;
    const d = r.date.split("T")[0];
    counts[d] = (counts[d] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export default ServiceReport;
