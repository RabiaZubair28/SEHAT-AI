import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Table, Tag, Typography, Row, Col, Alert, Select } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSelector } from "react-redux";

import ReportCard from "./shared/ReportCard";
import ReportHeader from "./shared/ReportHeader";
import StatsRow from "./shared/StatsRow";
import { GREEN, GREEN_SOFT } from "./shared/constants";

// ── Your existing shared utilities (same as AppointmentTracker) ───────────────
import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";

// ── Antd shared ───────────────────────────────────────────────────────────────
import { DatePicker, Button, Space } from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

// ── Report API ────────────────────────────────────────────────────────────────
import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  type ExportParams,
} from "../../services/reports";

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Option } = Select;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientRecord {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  phoneNumber: string;
  cnic: string;
  address: string;
  registrationDate: string;
  facilityName?: string;
}

interface ApiResponse {
  data: PatientRecord[];
  count: number;
  page: number;
  lastPage: number;
  summary: {
    totalMaleCount: number;
    totalFemaleCount: number;
    facilityWiseGenderCount: {
      facilityId: number;
      facilityName: string;
      maleCount: number;
      femaleCount: number;
    }[];
  };
}

// ─── Table columns ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: "MR NO",
    dataIndex: "mrNo",
    key: "mrNo",
    render: (v: number) => (
      <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Name",
    dataIndex: "fullName",
    key: "fullName",
    render: (v: string) => <Text strong>{v}</Text>,
  },
  { title: "Age", dataIndex: "age", key: "age", width: 70 },
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
  { title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber" },
  { title: "CNIC", dataIndex: "cnic", key: "cnic" },
  {
    title: "Registered On",
    dataIndex: "registrationDate",
    key: "registrationDate",
    render: (v: string) => dayjs(v).format("DD MMM YYYY"),
  },
];

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────
const AllPatientsReport: React.FC = () => {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [gender, setGender] = useState<string>("");
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
  // ── Facility dropdown (same pattern as AppointmentTracker) ──────────────────
  const pagination = useDropDownPagination();

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearch,
    });

  useEffect(() => {
    if (facilitiesResponse?.lastPage) {
      pagination.setLastPage(facilitiesResponse.lastPage);
    }
  }, [facilitiesResponse, pagination]);

  const facilities = useMemo(
    () =>
      facilitiesResponse
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  // Accumulate pages (infinite scroll in dropdown)
  useEffect(() => {
    if (!facilities.length) return;
    if (pagination.currentPage === 1) {
      setFacilityOptions(facilities);
    } else {
      setFacilityOptions((prev) => [...prev, ...facilities]);
    }
  }, [facilities, pagination.currentPage]);

  // Reset list on new search term
  useEffect(() => {
    if (facilitySearch !== "" && pagination.currentPage === 1) {
      setFacilityOptions(facilities);
    }
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
  const patients = Array.isArray(response?.data) ? response!.data : [];
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Derived chart data ───────────────────────────────────────────────────────
  const maleCount =
    response?.summary?.totalMaleCount ??
    patients.filter((p) => p.gender === "Male").length;
  const femaleCount =
    response?.summary?.totalFemaleCount ??
    patients.filter((p) => p.gender === "Female").length;
  const genderChartData = [
    { name: "Female", value: femaleCount },
    { name: "Male", value: maleCount },
  ];
  const facilityChartData = (
    response?.summary?.facilityWiseGenderCount ?? []
  ).map((f) => ({
    name: f.facilityName,
    Male: f.maleCount,
    Female: f.femaleCount,
  }));

  // ── Param builder ────────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "patients" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(gender && { gender: capitalize(gender) as any }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...overrides,
    }),
    [dateRange, gender, selectedFacilityId],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    resetPage();
    triggerGet(buildParams({ page: 1, limit: pageSize }));
  };

  const handleReset = () => {
    setDateRange(null);
    setGender("");
    resetPage();
    // Don't reset facility for incharge — keep it locked
    if (!isDropdownDisabled) setSelectedFacilityId(null);
  };

  const handleExport = async (type: "PDF" | "EXCEL") => {
    const result = await triggerExport(
      buildParams({ exportType: type }) as ExportParams,
    );
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `all-patients-report.${type === "PDF" ? "pdf" : "xlsx"}`;
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
        icon={<TeamOutlined />}
        title="All Patients Report"
        subtitle="Complete patient registry with demographics"
        onExportPDF={generated ? () => handleExport("PDF") : undefined}
        onExportExcel={generated ? () => handleExport("EXCEL") : undefined}
      />

      {/* ── Filter Bar ── */}
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
                const target = e.target as HTMLDivElement;
                const nearBottom =
                  target.scrollTop + target.clientHeight >=
                  target.scrollHeight - 20;
                if (nearBottom && !pagination.isLoadingMore) {
                  pagination.fetchMore();
                }
              }}
              notFoundContent={
                pagination.isLoadingMore ? "Loading..." : "No facilities found"
              }
            />
          </Col>

          {/* Gender */}
          <Col xs={12} sm={8} md={4} lg={3}>
            <Select
              placeholder="Gender"
              size="large"
              style={{ width: "100%" }}
              allowClear
              value={gender || undefined}
              onChange={(v) => setGender(v ?? "")}
            >
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
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

        {/* Generate button row */}
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
                { label: "Total Patient(s)", value: total, highlight: true },
                { label: "Male(s)", value: maleCount },
                { label: "Female(s)", value: femaleCount },
                { label: "Showing (this page)", value: patients.length },
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
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={15}>
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
                    Facility-wise Gender Breakdown
                  </Text>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={facilityChartData} barSize={20}>
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
                      <Legend
                        formatter={(v) => (
                          <span style={{ fontSize: 12, color: "#555" }}>
                            {v}
                          </span>
                        )}
                      />
                      <Bar
                        dataKey="Male"
                        fill={GREEN}
                        radius={[4, 4, 0, 0]}
                        name="Male"
                      />
                      <Bar
                        dataKey="Female"
                        fill="#e8a0b4"
                        radius={[4, 4, 0, 0]}
                        name="Female"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              <Col xs={24} lg={9}>
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
                    Gender Distribution
                  </Text>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill={GREEN} />
                        <Cell fill="#e8a0b4" />
                      </Pie>
                      <Legend
                        formatter={(v) => (
                          <span style={{ fontSize: 12, color: "#555" }}>
                            {v}
                          </span>
                        )}
                      />
                      <RTooltip
                        contentStyle={{ borderRadius: 8, fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </div>

          {/* Table */}
          <div style={{ padding: "20px 24px" }}>
            <Table<PatientRecord>
              columns={COLUMNS}
              dataSource={patients}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: "max-content" }}
              rowHoverable
              pagination={{
                current: page,
                pageSize: pageSize,
                total,
                onChange: handlePageChange,
                size: "small",
                showTotal: (t) => `${t} patients`,
              }}
            />
          </div>
        </>
      )}
    </ReportCard>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default AllPatientsReport;
