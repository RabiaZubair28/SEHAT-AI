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
  Progress,
} from "antd";
import {
  MedicineBoxOutlined,
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
import { useGetMedicinesQuery } from "@/services/medicineApi";

import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  type ExportParams,
} from "../../services/reports";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PAGE_SIZE = 10;
const MED_PAGE_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────
interface MedicineRecord {
  medicineId: number;
  medicineVariantId: number;
  medicineName: string;
  variant?: { id: number; strength: string; unit: string };
  totalQuantityDispensed: number;
  remainingStock: number;
}

interface ApiResponse {
  data: {
    records: MedicineRecord[];
    top5MedicinesByQuantityDispensed: MedicineRecord[];
  };
  count: number;
  page: number;
  lastPage: number;
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    title: "Medicine",
    key: "medicineName",
    render: (_: any, r: MedicineRecord) => (
      <div>
        <Text strong>{r.medicineName}</Text>
        {(r.variant?.strength || r.variant?.unit) && (
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {[r.variant?.strength, r.variant?.unit].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    ),
  },
  {
    title: "Total Dispensed",
    dataIndex: "totalQuantityDispensed",
    key: "totalQuantityDispensed",
    render: (v: number) => (
      <Text style={{ color: GREEN, fontWeight: 600 }}>{v}</Text>
    ),
  },
  {
    title: "Remaining Stock",
    key: "remainingStock",
    render: (_: any, r: MedicineRecord) => {
      const total = r.totalQuantityDispensed + r.remainingStock;
      const percent =
        total > 0 ? Math.round((r.remainingStock / total) * 100) : 0;
      const isLow = percent < 20;
      return (
        <div style={{ minWidth: 150 }}>
          <Progress
            percent={percent}
            size="small"
            strokeColor={isLow ? "#cf1322" : GREEN}
            trailColor="#f0f0f0"
            format={() => (
              <span style={{ fontSize: 11, color: isLow ? "#cf1322" : GREEN }}>
                {r.remainingStock} units
              </span>
            )}
          />
        </div>
      );
    },
  },
  {
    title: "Stock Status",
    dataIndex: "remainingStock",
    key: "status",
    render: (v: number, r: MedicineRecord) => {
      const total = r.totalQuantityDispensed + r.remainingStock;
      const percent = total > 0 ? Math.round((v / total) * 100) : 0;
      if (percent < 20)
        return (
          <Tag color="red" style={{ borderRadius: 6 }}>
            Low Stock
          </Tag>
        );
      if (percent < 40)
        return (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            Moderate
          </Tag>
        );
      return (
        <Tag color="green" style={{ borderRadius: 6 }}>
          Adequate
        </Tag>
      );
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const MedicineReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
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

  // ── Medicine dropdown state (paginated on scroll) ─────────────────────────────
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicinePage, setMedicinePage] = useState(1);
  const [medicineOptions, setMedicineOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [medLastPage, setMedLastPage] = useState(1);

  const { data: medicinesResponse } = useGetMedicinesQuery({
    name: medicineSearch || undefined,
    page: medicinePage,
    limit: MED_PAGE_SIZE,
  });

  // Accumulate medicine pages — no dedup, value = variantId, label = name + strength + unit
  useEffect(() => {
    if (!medicinesResponse?.data?.length) return;
    if (medicinesResponse.lastPage) setMedLastPage(medicinesResponse.lastPage);
    const incoming = (medicinesResponse.data as any[]).map((m) => {
      const name = m.medicine?.name ?? m.name ?? "";
      const strength = m.strength ? ` ${m.strength}` : "";
      const unit = m.unit ? ` ${m.unit}` : "";
      return {
        label: `${name}${strength}${unit}`.trim(),
        value: m.id ?? m.medicineVariantId,
      };
    });
    if (medicinePage === 1) setMedicineOptions(incoming);
    else setMedicineOptions((prev) => [...prev, ...incoming]);
  }, [medicinesResponse, medicinePage]);

  // Reset on new search
  useEffect(() => {
    setMedicinePage(1);
  }, [medicineSearch]);

  const handleMedicineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    const nearBottom = t.scrollTop + t.clientHeight >= t.scrollHeight - 20;
    if (nearBottom && medicinePage < medLastPage) {
      setMedicinePage((p) => p + 1);
    }
  };

  // ── Facility dropdown ────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (isDropdownDisabled && userFacilityId && adminUser?.facility) {
      setFacilityOptions([
        { label: adminUser.facility.name, value: userFacilityId },
      ]);
      setSelectedFacilityId(userFacilityId);
    }
  }, [isDropdownDisabled, userFacilityId, adminUser]);

  const handleFacilitySearch = useCallback(
    (value: string) => {
      if (isDropdownDisabled) return;
      setFacilitySearch(value);
      facPagination.reset();
      refetchFacilities();
    },
    [isDropdownDisabled, facPagination, refetchFacilities],
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
  const records = Array.isArray(response?.data?.records)
    ? response!.data.records
    : [];
  const top5 = Array.isArray(response?.data?.top5MedicinesByQuantityDispensed)
    ? response!.data.top5MedicinesByQuantityDispensed
    : records.slice(0, 5);
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Chart data ───────────────────────────────────────────────────────────────
  const formatMedLabel = (r: MedicineRecord) =>
    [r.medicineName, r.variant?.strength, r.variant?.unit]
      .filter(Boolean)
      .join(" · ");

  // Bar — use server-provided top5 (already sorted by dispensed desc)
  const barChartData = top5.map((r) => ({
    name: formatMedLabel(r),
    dispensed: r.totalQuantityDispensed,
  }));

  // Area — remaining stock from current page records, top 7 by stock
  const areaChartData = [...records]
    .sort((a, b) => b.remainingStock - a.remainingStock)
    .slice(0, 7)
    .map((r) => ({
      name: formatMedLabel(r),
      stock: r.remainingStock,
    }));

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalDispensed = records.reduce(
    (s, r) => s + r.totalQuantityDispensed,
    0,
  );
  const lowStockCount = records.filter((r) => {
    const t = r.totalQuantityDispensed + r.remainingStock;
    return t > 0 && (r.remainingStock / t) * 100 < 20;
  }).length;
  const topMedicine = top5[0] ? formatMedLabel(top5[0]) : "—";

  // ── Param builder ─────────────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "medicine" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(selectedVariantId && { variantId: selectedVariantId }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...overrides,
    }),
    [dateRange, selectedVariantId, selectedFacilityId],
  );

  // ── Auto-fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    triggerGet({
      reportType: "medicine",
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
    setSelectedVariantId(null);
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
      a.download = `medicine-report.${type === "PDF" ? "pdf" : "xlsx"}`;
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
        icon={<MedicineBoxOutlined />}
        title="Medicine Count Report"
        subtitle="Medicine dispensing and stock usage analytics"
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

          {/* Medicine */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Search Medicine"
              showSearch
              allowClear
              filterOption={false}
              value={selectedVariantId ?? undefined}
              onChange={(v) => setSelectedVariantId(v ?? null)}
              onClear={() => setSelectedVariantId(null)}
              onSearch={(v) => setMedicineSearch(v)}
              onPopupScroll={handleMedicineScroll}
              options={medicineOptions}
              notFoundContent="No medicines found"
            />
          </Col>

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
                  label: "Total Dispensed",
                  value: totalDispensed,
                  highlight: true,
                },
                { label: "Unique Medicine(s)", value: records.length },
                { label: "Low Stock Item(s)", value: lowStockCount },
                { label: "Top Medicine", value: topMedicine },
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
              {/* Bar — top dispensed */}
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
                    Top Medicines by Quantity Dispensed
                  </Text>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                      data={barChartData}
                      barSize={28}
                      margin={{ bottom: 60 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={(props: any) => {
                          const nx = Number(props.x);
                          const ny = Number(props.y);
                          const val = String(props.payload?.value ?? "");
                          return (
                            <text
                              x={nx}
                              y={ny + 8}
                              textAnchor="end"
                              transform={`rotate(-35, ${nx}, ${ny + 8})`}
                              style={{ fontSize: 11, fill: "#888" }}
                            >
                              {val.length > 20 ? `${val.slice(0, 18)}…` : val}
                            </text>
                          );
                        }}
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
                        formatter={(value: any, _: any, props: any) => [
                          value,
                          props.payload?.name,
                        ]}
                      />
                      <Bar
                        dataKey="dispensed"
                        fill={GREEN}
                        radius={[6, 6, 0, 0]}
                        name="Units Dispensed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Col>

              {/* Bar — remaining stock (area was flat/uninformative for unrelated medicines) */}
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
                    Remaining Stock Overview
                  </Text>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart
                      data={areaChartData}
                      barSize={24}
                      margin={{ bottom: 60 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={(props: any) => {
                          const nx = Number(props.x);
                          const ny = Number(props.y);
                          const val = String(props.payload?.value ?? "");
                          return (
                            <text
                              x={nx}
                              y={ny + 8}
                              textAnchor="end"
                              transform={`rotate(-35, ${nx}, ${ny + 8})`}
                              style={{ fontSize: 11, fill: "#888" }}
                            >
                              {val.length > 20 ? `${val.slice(0, 18)}…` : val}
                            </text>
                          );
                        }}
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
                        formatter={(value: any, _: any, props: any) => [
                          value,
                          props.payload?.name,
                        ]}
                      />
                      <Bar
                        dataKey="stock"
                        fill="#2196f3"
                        radius={[6, 6, 0, 0]}
                        name="Remaining Stock"
                      />
                    </BarChart>
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
                key: r.medicineVariantId,
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
                showTotal: (t) => `${t} medicines`,
              }}
            />
          </div>
        </>
      )}
    </ReportCard>
  );
};

export default MedicineReport;
