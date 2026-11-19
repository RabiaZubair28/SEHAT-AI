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
  Modal,
  Form,
} from "antd";
import dayjs from "dayjs";
import {
  HeartOutlined,
  FilterOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { useSelector } from "react-redux";

import ReportCard from "./shared/ReportCard";
import Loader from "@/components/shared/Loader";
import ReportHeader from "./shared/ReportHeader";
import StatsRow from "./shared/StatsRow";
import { GREEN } from "./shared/constants";
import SindhDistrictMap from "./SindhDistrictMap";

import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useGetVaccinesQuery } from "@/features/admin/services/getVaccinesApi";
import { useGetUsersQuery } from "@/features/admin/services/usersApiService";
import {
  useGetAllDivisionsQuery,
  useGetDistrictsByDivisionIdQuery,
  useGetTalukasByDistrictIdQuery,
  useGetUCsByTalukaIdQuery,
} from "@/services/locationsApiServices";
import {
  useLazyGetReportQuery,
  useLazyExportReportQuery,
  useLazySearchPatientsQuery,
  type ExportParams,
} from "../../services/reports";
const { RangePicker } = DatePicker;
const { Text } = Typography;
import { debounce } from "lodash";

const PAGE_SIZE = 10;

const CLINICAL_ROLES = [
  Roles.MEDICAL_OFFICER_FEMALE,
  Roles.VACCINATOR,
  Roles.SBA,
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImmunisationRecord {
  doseId: number;
  patientId: number;
  search: string;
  vaccineCode: string;
  vaccineName: string;
  doseNumber: number | null;
  dateAdministered: string;
  doctorId: number;
  doctorName: string;
}

interface DistrictAdministeredPatientCount {
  districtId: number;
  districtName: string;
  administeredPatientCount: number;
}

interface ApiResponse {
  data: {
    records: ImmunisationRecord[];
    distinctPatientCount: number;
    distinctVaccineCount: number;
    mostUsedVaccine: { vaccineName: string; doseCount: number };
    districtAdministeredPatientCount?: DistrictAdministeredPatientCount[];
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
    title: "Vaccine",
    dataIndex: "vaccineName",
    key: "vaccineName",
    render: (v: string) => (
      <Tag color="cyan" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Code",
    dataIndex: "vaccineCode",
    key: "vaccineCode",
    render: (v: string) => (
      <Tag color="blue" style={{ borderRadius: 6 }}>
        {v}
      </Tag>
    ),
  },
  {
    title: "Date Administered",
    dataIndex: "dateAdministered",
    key: "dateAdministered",
    render: (v: string) => v?.split("T")[0] ?? "—",
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
const ImmunizationReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );

  // ── Export modal ──────────────────────────────────────────────────────────────
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<
    "PDF" | "EXCEL" | null
  >(null);
  const [modalImmunisationType, setModalImmunisationType] = useState<
    "Defaulter" | "Scheduled" | "No Dose" | undefined
  >(undefined);
  const [modalDateRange, setModalDateRange] = useState<[Dayjs, Dayjs] | null>(
    null,
  );
  const [modalFacilityId, setModalFacilityId] = useState<number | null>(null);
  const [modalError, setModalError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [vaccineId, setVaccineId] = useState<number | null>(null);
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [talukaId, setTalukaId] = useState<number | null>(null);
  const [ucId, setUcId] = useState<number | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorOptions, setDoctorOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [doctorLastPage, setDoctorLastPage] = useState(1);

  const [
    searchPatients,
    { data: patientResults, isFetching: patientsLoading },
  ] = useLazySearchPatientsQuery();

  const debouncedPatientSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value.trim().length >= 2) {
          searchPatients({
            first_name: value,
            limit: 20,
            ...((isDropdownDisabled && userFacilityId)
              ? { facility_id: userFacilityId }
              : selectedFacilityId
                ? { facility_id: selectedFacilityId }
                : {}),
          });
        }
      }, 500),
    [searchPatients, isDropdownDisabled, userFacilityId, selectedFacilityId],
  );

  // cancel any pending call on unmount
  useEffect(
    () => () => debouncedPatientSearch.cancel(),
    [debouncedPatientSearch],
  );

  const { data: doctorData } = useGetUsersQuery({
    page: doctorPage,
    limit: 20,
    roles: CLINICAL_ROLES,
    ...((isDropdownDisabled && userFacilityId)
      ? { facility_id: userFacilityId }
      : selectedFacilityId
        ? { facility_id: selectedFacilityId }
        : {}),
    ...(doctorSearch.trim().length >= 2 && { first_name: doctorSearch }),
  });

  useEffect(() => {
    setDoctorPage(1);
    setDoctorOptions([]);
  }, [selectedFacilityId]);

  useEffect(() => {
    if (!doctorData?.data) return;
    const newOptions = doctorData.data.map((u) => ({
      label: `${u.first_name} ${u.last_name}${u.role ? ` (${u.role})` : ""}`,
      value: u.id as number,
    }));
    if (doctorPage === 1) setDoctorOptions(newOptions);
    else setDoctorOptions((prev) => [...prev, ...newOptions]);
    setDoctorLastPage(doctorData.lastPage);
  }, [doctorData, doctorPage]);

  const debouncedDoctorSearch = useMemo(
    () =>
      debounce((_value: string) => {
        setDoctorPage(1);
      }, 500),
    [],
  );

  useEffect(
    () => () => debouncedDoctorSearch.cancel(),
    [debouncedDoctorSearch],
  );

  const { data: vaccinesData, isFetching: vaccinesLoading } =
    useGetVaccinesQuery({ limit: 100, applies_to: 'Child' });

  const patientOptions = (patientResults?.data ?? []).map((p) => ({
    label: `${p.first_name} ${p.last_name} (${p.mr_no})`,
    value: p.id,
  }));

  const { data: divisions = [] } = useGetAllDivisionsQuery();
  const { currentData: districts = [], isFetching: isDistrictsFetching } =
    useGetDistrictsByDivisionIdQuery(divisionId!, { skip: !divisionId });
  const { currentData: talukas = [], isFetching: isTalukasFetching } =
    useGetTalukasByDistrictIdQuery(districtId!, { skip: !districtId });
  const { currentData: ucResponse, isFetching: isUCsFetching } =
    useGetUCsByTalukaIdQuery(
      { talukaId: talukaId! },
      { skip: !talukaId },
    );
  const ucs = ucResponse?.data ?? [];
  const isLocationLoading =
    (!!divisionId && isDistrictsFetching) ||
    (!!districtId && isTalukasFetching) ||
    (!!talukaId && isUCsFetching);
  const vaccineOptions = useMemo(
    () =>
      (vaccinesData?.data ?? []).map((v: any) => ({
        label: v.display_name,
        value: v.id,
      })),
    [vaccinesData],
  );

  const { page, pageSize, onChange: handlePageChange, reset: resetPage } =
    useTablePagination(
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
  const total = response?.count ?? 0;
  const generated = !!rawData;

  // ── Map: server-side per-district patient counts (full dataset) ─────────────
  const districtMapData = (
    response?.data?.districtAdministeredPatientCount ?? []
  ).map((d) => ({
    districtName: d.districtName,
    count: d.administeredPatientCount,
  }));

  // ── Auto-fetch on mount ───────────────────────────────────────────────────────
  const buildParams = useCallback(
    (overrides: Record<string, any> = {}) => ({
      reportType: "immunisation" as const,
      page: 1,
      limit: PAGE_SIZE,
      ...(dateRange?.[0] && { dateFrom: dateRange[0].format("YYYY-MM-DD") }),
      ...(dateRange?.[1] && { dateTo: dateRange[1].format("YYYY-MM-DD") }),
      ...(selectedFacilityId && { facilityId: selectedFacilityId }),
      ...(vaccineId && { vaccineId }),
      ...(divisionId && { divisionId }),
      ...(districtId && { districtId }),
      ...(talukaId && { talukaId }),
      ...(ucId && { ucId }),
      ...(patientId && { patientId }),
      ...(doctorId && { doctorId }),
      ...overrides,
    }),
    [
      dateRange,
      selectedFacilityId,
      vaccineId,
      divisionId,
      districtId,
      talukaId,
      ucId,
      patientId,
      doctorId,
    ],
  );

  // ── Auto-fetch on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    triggerGet({
      reportType: "immunisation",
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
    setVaccineId(null);
    setDivisionId(null);
    setDistrictId(null);
    setTalukaId(null);
    setUcId(null);
    setPatientId(null);
    setPatientSearch("");
    setDoctorId(null);
    setDoctorSearch("");
    setDoctorPage(1);
    setDoctorOptions([]);
    if (!isDropdownDisabled) setSelectedFacilityId(null);
  };
  const handleExport = async (type: "PDF" | "EXCEL") => {
    setPendingExportType(type);
    setModalDateRange(null);
    setModalImmunisationType(undefined);
    setModalFacilityId(null);
    setModalError("");
    setDateRange(null);
    if (!isDropdownDisabled) setSelectedFacilityId(null);
    setExportModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (modalImmunisationType) {
      if (!modalDateRange) {
        setModalError(
          "Date range is required when immunisation type is selected.",
        );
        return;
      }
      const [start, end] = modalDateRange;
      if (end.isAfter(start.add(2, "month"))) {
        setModalError("Date range cannot exceed 2 months.");
        return;
      }
    }
    setModalError("");
    setIsExporting(true);
    const effectiveFacilityId =
      modalFacilityId ?? (isDropdownDisabled ? userFacilityId : null);
    const result = await triggerExport({
      ...buildParams({ exportType: pendingExportType! }),
      ...(modalImmunisationType && { immunisationType: modalImmunisationType }),
      ...(modalDateRange && {
        dateFrom: modalDateRange[0].format("YYYY-MM-DD"),
        dateTo: modalDateRange[1].format("YYYY-MM-DD"),
      }),
      ...(effectiveFacilityId && { facilityId: effectiveFacilityId }),
    } as ExportParams);
    setIsExporting(false);
    if (result.data?.downloadUrl) {
      const a = document.createElement("a");
      a.href = result.data.downloadUrl;
      a.download = `immunisation-report.${pendingExportType === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(result.data.downloadUrl);
      setExportModalOpen(false);
    }
  };

  const loading = isLoading || isFetching;

  // Stats — from server-side aggregates (full dataset, not page-derived)
  const uniquePatients =
    response?.data?.distinctPatientCount ??
    new Set(records.map((r) => r.patientId)).size;
  const uniqueVaccines =
    response?.data?.distinctVaccineCount ??
    new Set(records.map((r) => r.vaccineName)).size;
  const mostUsedVaccine = response?.data?.mostUsedVaccine?.vaccineName ?? "—";

  return (
    <ReportCard>
      {isLocationLoading && <Loader />}
      <ReportHeader
        icon={<HeartOutlined />}
        title="Immunisation Report"
        subtitle="Vaccination records within the selected period"
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
          <Col xs={24} sm={12} md={7} lg={6}>
            <RangePicker
              size="large"
              style={{ width: "100%" }}
              value={dateRange}
              onChange={(val) => setDateRange(val as [Dayjs, Dayjs] | null)}
            />
          </Col>

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

          {!isFacilityIncharge && (
            <>
              <Col xs={12} sm={8} md={5} lg={4}>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Division"
                  allowClear
                  showSearch
                  filterOption={(input, opt) =>
                    (opt?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={divisions.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                  value={divisionId ?? undefined}
                  onChange={(v) => {
                    setDivisionId(v ?? null);
                    setDistrictId(null);
                    setTalukaId(null);
                    setUcId(null);
                  }}
                />
              </Col>

              <Col xs={12} sm={8} md={5} lg={4}>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="District"
                  allowClear
                  showSearch
                  disabled={!divisionId}
                  filterOption={(input, opt) =>
                    (opt?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={districts.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                  value={districtId ?? undefined}
                  onChange={(v) => {
                    setDistrictId(v ?? null);
                    setTalukaId(null);
                    setUcId(null);
                  }}
                />
              </Col>

              <Col xs={12} sm={8} md={5} lg={4}>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Taluka"
                  allowClear
                  showSearch
                  disabled={!districtId}
                  filterOption={(input, opt) =>
                    (opt?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={talukas.map((t) => ({ label: t.name, value: t.id }))}
                  value={talukaId ?? undefined}
                  onChange={(v) => {
                    setTalukaId(v ?? null);
                    setUcId(null);
                  }}
                />
              </Col>

              <Col xs={12} sm={8} md={5} lg={4}>
                <Select
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="UC"
                  allowClear
                  showSearch
                  disabled={!talukaId}
                  filterOption={(input, opt) =>
                    (opt?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={ucs.map((u) => ({ label: u.name, value: u.id }))}
                  value={ucId ?? undefined}
                  onChange={(v) => setUcId(v ?? null)}
                />
              </Col>
            </>
          )}

          <Col xs={12} sm={10} md={6} lg={5}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Search Patient"
              showSearch
              filterOption={false}
              allowClear
              loading={patientsLoading}
              options={patientSearch.trim().length >= 2 ? patientOptions : []}
              value={patientId ?? undefined}
              onSearch={(v) => {
                setPatientSearch(v);
                debouncedPatientSearch(v);
              }}
              onChange={(v) => setPatientId(v ?? null)}
              onClear={() => {
                setPatientId(null);
                setPatientSearch("");
              }}
              notFoundContent={
                patientSearch.trim().length < 2
                  ? "Type at least 2 characters"
                  : patientsLoading
                    ? "Searching..."
                    : "No patients found"
              }
            />
          </Col>

          <Col xs={12} sm={10} md={6} lg={5}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Search Doctor"
              showSearch
              filterOption={false}
              allowClear
              options={doctorOptions}
              value={doctorId ?? undefined}
              onSearch={(v) => {
                setDoctorSearch(v);
                debouncedDoctorSearch(v);
              }}
              onChange={(v) => setDoctorId(v ?? null)}
              onClear={() => {
                setDoctorId(null);
                setDoctorSearch("");
                setDoctorPage(1);
              }}
              onPopupScroll={(e) => {
                const t = e.target as HTMLDivElement;
                if (
                  t.scrollTop + t.clientHeight >= t.scrollHeight - 20 &&
                  doctorPage < doctorLastPage
                )
                  setDoctorPage((p) => p + 1);
              }}
              notFoundContent="No doctors found"
            />
          </Col>

          <Col xs={12} sm={10} md={6} lg={6}>
            <Select
              size="large"
              style={{ width: "100%" }}
              placeholder="Filter by Vaccine Name"
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              allowClear
              loading={vaccinesLoading}
              options={vaccineOptions}
              value={vaccineId ?? undefined}
              onChange={(v) => setVaccineId(v ?? null)}
              onClear={() => setVaccineId(null)}
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
                { label: "Total Dose(s)", value: total, highlight: true },
                { label: "Unique Patient(s)", value: uniquePatients },
                { label: "Vaccine Type(s)", value: uniqueVaccines },
                { label: "Most Used", value: mostUsedVaccine },
              ]}
            />
          </div>

          {/* Map: patients by district (Sindh) */}
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
                Patients by District
              </Text>
              <SindhDistrictMap data={districtMapData} />
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <Table
              columns={COLUMNS}
              dataSource={records.map((r) => ({ ...r, key: r.doseId }))}
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

      {/* ── Export Modal ── */}
      <Modal
        title={`Export as ${pendingExportType} — Immunisation Report`}
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        onOk={handleModalSubmit}
        okText={isExporting ? "Exporting…" : "Export"}
        confirmLoading={isExporting}
        okButtonProps={{ style: { background: GREEN, borderColor: GREEN } }}
        destroyOnHidden
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Immunisation Type">
            <Select
              placeholder="Select type (optional)"
              allowClear
              value={modalImmunisationType}
              onChange={(v) => setModalImmunisationType(v)}
              options={[
                { label: "Defaulter", value: "Defaulter" },
                { label: "Scheduled", value: "Scheduled" },
                { label: "No Dose", value: "No Dose" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Facility">
            <Select
              placeholder={
                isDropdownDisabled
                  ? (adminUser?.facility?.name ?? "N/A")
                  : "Select facility (optional)"
              }
              allowClear={!isDropdownDisabled}
              showSearch={!isDropdownDisabled}
              disabled={isDropdownDisabled}
              value={
                isDropdownDisabled
                  ? (userFacilityId ?? undefined)
                  : (modalFacilityId ?? undefined)
              }
              options={facilityOptions}
              filterOption={false}
              onSearch={handleFacilitySearch}
              onChange={(v) => setModalFacilityId(v ?? null)}
              onClear={() => setModalFacilityId(null)}
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
          </Form.Item>

          <Form.Item
            label="Date Range (max 2 months)"
            required={!!modalImmunisationType}
            validateStatus={modalError ? "error" : ""}
            help={
              modalError ||
              "Select start and end date — no future dates allowed."
            }
          >
            <RangePicker
              style={{ width: "100%" }}
              value={modalDateRange}
              disabledDate={(current) =>
                current && current.isAfter(dayjs(), "day")
              }
              onChange={(val) => {
                setModalDateRange(val as [Dayjs, Dayjs] | null);
                setModalError("");
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </ReportCard>
  );
};

export default ImmunizationReport;
