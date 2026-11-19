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
  GiftOutlined,
  FilterOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";

import ReportCard from "./shared/ReportCard";
import ReportHeader from "./shared/ReportHeader";
import StatsRow from "./shared/StatsRow";
import { GREEN, GREEN_SOFT, CHART_COLORS } from "./shared/constants";

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

const PAGE_SIZE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DeliveryRecord {
  appointmentServiceId: number;
  patientId: number;
  patientName: string;
  deliveryDate: string;
  deliveryType: string | null;
  status: string | null;
  doctorId: number;
  doctorName: string;
  notes: string | null;
}

interface TypeSummary {
  deliveryType: string;
  count: number;
}

interface DailySummary {
  date: string;
  count: number;
}

interface ApiResponse {
  data: {
    records: DeliveryRecord[];
    deliverySummary: {
      typeSummary: TypeSummary[];
      dailySummary: DailySummary[];
    };
  };
  count: number;
  page: number;
  lastPage: number;
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: "Patient",
    dataIndex: "patientName",
    key: "patientName",
    render: (v: string) => <Text strong>{v}</Text>,
  },
  {
    title: "Delivery Date",
    dataIndex: "deliveryDate",
    key: "deliveryDate",
    render: (v: string) => v?.split("T")[0] ?? "—",
  },
  {
    title: "Delivery Type",
    dataIndex: "deliveryType",
    key: "deliveryType",
    render: (v: string | null) =>
      v ? (
        <Tag
          color={v.toLowerCase().includes("normal") ? "green" : "orange"}
          style={{ borderRadius: 6 }}
        >
          {v}
        </Tag>
      ) : (
        <Tag color="default" style={{ borderRadius: 6 }}>
          Not recorded
        </Tag>
      ),
  },
  {
    title: "Progress Status",
    dataIndex: "status",
    key: "status",
    render: (v: string | null) => {
      if (!v)
        return (
          <Tag color="default" style={{ borderRadius: 6 }}>
            Not recorded
          </Tag>
        );
      const colorMap: Record<string, string> = {
        Discharged: "green",
        Continue: "blue",
        LAMA: "orange",
        "False labor": "purple",
        "Refer to CEmONC facility": "red",
      };
      const labelMap: Record<string, string> = { Continue: "In Progress" };
      return (
        <Tag color={colorMap[v] ?? "default"} style={{ borderRadius: 6 }}>
          {labelMap[v] ?? v}
        </Tag>
      );
    },
  },
  {
    title: "Doctor",
    dataIndex: "doctorName",
    key: "doctorName",
    render: (v: string) => (
      <Tag color="green" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const DeliveryReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
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
  const [deliveryProgressStatus, setDeliveryProgressStatus] = useState<
    string | null
  >(null);
  const [typeOfDelivery, setTypeOfDelivery] = useState<string | null>(null);

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

  // ── API ───────────────────────────────────────────────────────────────────────
  const [triggerGet, { data: rawData, isLoading, isFetching, isError, error }] =
    useLazyGetReportQuery();
  const [triggerExport] = useLazyExportReportQuery();

  const response = rawData as ApiResponse | undefined;
  const records = Array.isArray(response?.data?.records)
    ? response!.data.records
    : [];
  const deliverySummary = response?.data?.deliverySummary;
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Charts — server-side aggregates (full dataset, not page-derived) ─────────
  const typeBreakdown = (deliverySummary?.typeSummary ?? [])
    .filter((t) => t.deliveryType !== "Unknown")
    .map((t) => ({
      name: t.deliveryType,
      value: t.count,
    }));

  const dailyTrend = (deliverySummary?.dailySummary ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: d.date.split("T")[0],
      count: d.count,
    }));

  // ── Param builder ─────────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "delivery" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...(deliveryProgressStatus && { deliveryProgressStatus }),
      ...(typeOfDelivery && { TypeOfDelivery: typeOfDelivery }),
      ...overrides,
    }),
    [dateRange, selectedFacilityId, deliveryProgressStatus, typeOfDelivery],
  );

  // ── Auto-fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    triggerGet({
      reportType: "delivery",
      page: 1,
      limit: PAGE_SIZE,
      ...(isFacilityIncharge && userFacilityId
        ? { facilityId: userFacilityId }
        : {}),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    resetPage();
    triggerGet(buildParams({ page: 1, limit: pageSize }));
  };
  const handleReset = () => {
    setDateRange(null);
    resetPage();
    setDeliveryProgressStatus(null);
    setTypeOfDelivery(null);
    if (!isDropdownDisabled) setSelectedFacilityId(null);
    triggerGet({
      reportType: "delivery",
      page: 1,
      limit: pageSize,
      ...(isFacilityIncharge && userFacilityId
        ? { facilityId: userFacilityId }
        : {}),
    });
  };
  const handleExport = async (type: "PDF" | "EXCEL") => {
    const result = await triggerExport(
      buildParams({ exportType: type }) as ExportParams,
    );
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `delivery-report.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(result.data.downloadUrl);
    }
  };

  const loading = isLoading || isFetching;
  const deliveryTypes = typeBreakdown.length;
  const mostCommonType = typeBreakdown[0]?.name ?? "—";

  return (
    <ReportCard>
      <ReportHeader
        icon={<GiftOutlined />}
        title="Delivery Report"
        subtitle="Delivery records within the selected period"
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
          <Col xs={24} sm={12} md={10} lg={6}>
            <RangePicker
              size="large"
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(val) => setDateRange(val as [Dayjs, Dayjs] | null)}
            />
          </Col>

          <Col xs={24} sm={12} md={10} lg={6}>
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

          <Col xs={24} sm={12} md={10} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Delivery Progress Status"
              allowClear
              value={deliveryProgressStatus ?? undefined}
              onChange={(v) => setDeliveryProgressStatus(v ?? null)}
              options={[
                { label: "False Labor", value: "False labor" },
                { label: "In Progress", value: "Continue" },
                {
                  label: "Refer to CEmONC Facility",
                  value: "Refer to CEmONC facility",
                },
                { label: "LAMA", value: "LAMA" },
                { label: "Discharged", value: "Discharged" },
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={10} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Type of Delivery"
              allowClear
              value={typeOfDelivery ?? undefined}
              onChange={(v) => setTypeOfDelivery(v ?? null)}
              options={[
                {
                  label: "Normal Vaginal Delivery",
                  value: "Normal Vaginal Delivery",
                },
                {
                  label: "Assisted Delivery (Vacuum/Forceps)",
                  value: "Assisted Delivery (Vacuum/Forceps)",
                },
                { label: "C-Section", value: "C-Section" },
                { label: "Miscarriage", value: "Miscarriage" },
                { label: "Induced Abortion", value: "Induced Abortion" },
              ]}
            />
          </Col>

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
          <div
            style={{ padding: "20px 24px", borderBottom: "1px solid #deeee5" }}
          >
            <StatsRow
              stats={[
                { label: "Total Deliveries", value: total, highlight: true },
                { label: "Most Common Type", value: mostCommonType },
                { label: "Delivery Type(s)", value: deliveryTypes },
                { label: "This Page", value: records.length },
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
              {/* Pie — delivery type breakdown */}
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
                    Delivery Type Breakdown
                  </Text>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={typeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
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

              {/* Bar — daily deliveries */}
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
                    Daily Delivery Cases
                  </Text>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyTrend} barSize={32}>
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
                      <Bar
                        dataKey="count"
                        fill={GREEN}
                        radius={[6, 6, 0, 0]}
                        name="Deliveries"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>
            </Row>
          </div>

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

export default DeliveryReport;
