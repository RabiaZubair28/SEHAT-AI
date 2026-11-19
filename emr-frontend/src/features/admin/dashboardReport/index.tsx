import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Typography,
  Select,
  Row,
  Col,
  Button,
  Spin,
  Alert,
  DatePicker,
} from "antd";
import { ReloadOutlined, DashboardOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import { RootState } from "@/redux/store";
import { Roles } from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { useGetFacilitiesByDistrictIdQuery } from "@/features/admin/services/facilitiesApi";
import { useGetAllDistrictsQuery } from "@/services/locationsApiServices";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import {
  useGetDashboardQuery,
  useGetDashboardOverallQuery,
} from "../services/dashboardService";
import LivePatientFlow from "./components/LivePatientFlow";
import PatientFlowSwitcher from "./components/PatientFlowSwitcher";
import StaffAttendance from "./components/StaffAttendance";
import { GREEN, GREEN_BORDER } from "./components/shared/constants";
import { dimWhen } from "./components/shared/dimWhen";
import {
  DATE_FORMATS,
  isToday,
  dayLabel,
} from "@/utils/formats/dateFormatters";

const { Title, Text } = Typography;

const POLLING_INTERVAL_MS = 60_000;

const today = dayjs();

const STRINGS = {
  headerSubtitle: (d: Dayjs) =>
    isToday(d)
      ? "Today's live summary of patient flow and staff availability."
      : `Summary of patient flow and staff availability for ${dayLabel(d)}.`,
};

const DashboardReport: React.FC = () => {
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const isHeadOffice = adminUser?.role?.name === Roles.HEAD_OFFICE;
  const userFacilityId = adminUser?.facility?.id as number | undefined;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  const [selectedDistrictId, setSelectedDistrictId] = useState<
    number | undefined
  >(undefined);
  const [selectedFacilityId, setSelectedFacilityId] = useState<
    number | undefined
  >(isFacilityIncharge ? userFacilityId : undefined);
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearch, setFacilitySearch] = useState("");
  const [date, setDate] = useState<Dayjs>(today);

  const facilityOptionsDistrictRef = useRef<number | undefined>(undefined);

  const pagination = useDropDownPagination();

  // ─── District ──────────────────────────────────────────────────────────────
  const { data: allDistricts } = useGetAllDistrictsQuery();
  const districtOptions = useMemo(
    () => allDistricts?.map((d) => ({ label: d.name, value: d.id })) ?? [],
    [allDistricts],
  );

  // ─── Facilities queries ────────────────────────────────────────────────────
  const { data: allFacilitiesResponse, refetch: refetchAllFacilities } =
    useGetFacilitiesQuery(
      {
        page: pagination.currentPage,
        limit: 10,
        name: facilitySearch,
        ...(isHeadOffice ? { managedByPPHI: true } : {}),
      },
      { skip: !!selectedDistrictId },
    );

  const {
    data: districtFacilitiesResponse,
    refetch: refetchDistrictFacilities,
  } = useGetFacilitiesByDistrictIdQuery(
    {
      districtId: selectedDistrictId!,
      page: pagination.currentPage,
      limit: 10,
      ...(isHeadOffice ? { managedByPPHI: true } : {}),
    },
    { skip: !selectedDistrictId },
  );

  const activeFacilitiesResponse = selectedDistrictId
    ? districtFacilitiesResponse
    : allFacilitiesResponse;

  const refetchFacilities = selectedDistrictId
    ? refetchDistrictFacilities
    : refetchAllFacilities;

  // ─── Pagination lastPage sync ──────────────────────────────────────────────
  useEffect(() => {
    if (activeFacilitiesResponse?.lastPage)
      pagination.setLastPage(activeFacilitiesResponse.lastPage);
  }, [activeFacilitiesResponse, pagination]);

  // ─── Format facilities to options (deduplicated) ───────────────────────────
  const facilities = useMemo(() => {
    const raw = activeFacilitiesResponse
      ? formatFacilitiesToOptions(activeFacilitiesResponse.data)
      : [];
    const seen = new Set();
    return raw.filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [activeFacilitiesResponse, selectedDistrictId]);

  // ─── Accumulate facility options ───────────────────────────────────────────
  useEffect(() => {
    if (!facilities.length) return;

    const sourceDistrict = selectedDistrictId;

    if (pagination.currentPage === 1) {
      facilityOptionsDistrictRef.current = sourceDistrict;
      setFacilityOptions(facilities);
    } else {
      if (facilityOptionsDistrictRef.current === sourceDistrict) {
        setFacilityOptions((prev) => {
          const existingIds = new Set(prev.map((o) => o.value));
          const newOnes = facilities.filter((f) => !existingIds.has(f.value));
          return [...prev, ...newOnes];
        });
      }
    }
  }, [facilities, pagination.currentPage, selectedDistrictId]);

  // ─── Reset options on search ───────────────────────────────────────────────
  useEffect(() => {
    if (facilitySearch !== "" && pagination.currentPage === 1)
      setFacilityOptions(facilities);
  }, [facilitySearch, facilities, pagination.currentPage]);

  // ─── Facility incharge lock ────────────────────────────────────────────────
  useEffect(() => {
    if (isFacilityIncharge && userFacilityId && adminUser?.facility) {
      setFacilityOptions([
        { label: adminUser.facility.name, value: userFacilityId },
      ]);
      setSelectedFacilityId(userFacilityId);
    }
  }, [isFacilityIncharge, userFacilityId, adminUser]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleDistrictChange = useCallback(
    (value: number | undefined) => {
      facilityOptionsDistrictRef.current = value;
      setSelectedDistrictId(value ?? undefined);
      setSelectedFacilityId(undefined);
      setFacilityOptions([]);
      setFacilitySearch("");
      pagination.reset();
    },
    [pagination],
  );

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
      setSelectedFacilityId(value ?? undefined);
    },
    [isDropdownDisabled],
  );

  // ─── Dashboard query ───────────────────────────────────────────────────────
  const handleDateChange = useCallback((value: Dayjs | null) => {
    if (value) setDate(value);
  }, []);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetDashboardQuery(
      {
        facilityId: selectedFacilityId,
        districtId: selectedDistrictId,
        date: date.format(DATE_FORMATS.API_DATE),
      },
      { pollingInterval: isToday(date) ? POLLING_INTERVAL_MS : 0 },
    );

  const loading = isLoading || isFetching;

  const {
    data: overallTotals,
    isFetching: isOverallFetching,
    isError: isOverallError,
    refetch: refetchOverall,
  } = useGetDashboardOverallQuery(
    {
      facilityId: selectedFacilityId,
      districtId: selectedDistrictId,
    },
    { pollingInterval: POLLING_INTERVAL_MS },
  );

  return (
    <div
      data-page-bg="tint"
      style={{
        minHeight: "100vh",
        padding: "8px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <DashboardOutlined style={{ color: GREEN, fontSize: 20 }} />
            <Title
              level={3}
              style={{ margin: 0, color: "#0d2b1a", fontWeight: 700 }}
            >
              Dashboard
            </Title>
          </div>
          <Text style={{ color: "#5a8a6a", fontSize: 13 }}>
            {STRINGS.headerSubtitle(date)}
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {/* Date picker */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${GREEN_BORDER}`,
              borderRadius: 8,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <DatePicker
              value={date}
              onChange={handleDateChange}
              format={DATE_FORMATS.DAY_WITH_WEEKDAY}
              allowClear={false}
              suffixIcon={null}
              disabledDate={(d) => d.isAfter(today, "day")}
              className="w-[150px] !border-none !p-0 [&_input]:!text-[#1a3d2b]"
            />
          </div>

          {/* District dropdown */}
          {!isDropdownDisabled && (
            <div
              style={{
                background: "#fff",
                border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 8,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: 260,
                minWidth: 260,
                maxWidth: 260,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#5a8a6a",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                District:
              </Text>
              <Select
                size="small"
                variant="borderless"
                style={{ minWidth: 0, flex: 1 }}
                placeholder="All Districts"
                options={districtOptions}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={handleDistrictChange}
                value={selectedDistrictId ?? undefined}
                allowClear
                onClear={() => handleDistrictChange(undefined)}
              />
            </div>
          )}

          {/* Facility dropdown */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${GREEN_BORDER}`,
              borderRadius: 8,
              padding: "4px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: 260,
              minWidth: 260,
              maxWidth: 260,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#5a8a6a",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Facility:
            </Text>
            <Select
              size="small"
              variant="borderless"
              style={{ flex: 1, minWidth: 0 }}
              placeholder={
                selectedDistrictId ? "All in District" : "All Facilities"
              }
              options={facilityOptions}
              showSearch={!isDropdownDisabled}
              searchValue={facilitySearch}
              onChange={handleFacilityChange}
              onSearch={handleFacilitySearch}
              filterOption={false}
              disabled={isDropdownDisabled}
              value={selectedFacilityId ?? undefined}
              allowClear={!isDropdownDisabled}
              onClear={() => setSelectedFacilityId(undefined)}
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
          </div>

          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => {
              refetch();
              refetchOverall();
            }}
            style={{ borderRadius: 8, borderColor: GREEN_BORDER }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load dashboard"
          description={(error as any)?.message ?? "Please try refreshing."}
          style={{ marginBottom: 24, borderRadius: 10 }}
        />
      )}

      {loading && !data && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: "#5a8a6a" }}>
            Loading dashboard...
          </div>
        </div>
      )}

      {data && (
        <Row gutter={[0, 32]}>
          <Col xs={24} style={dimWhen(loading)}>
            <LivePatientFlow data={data.livePatientFlow} date={date} />
          </Col>
          <Col xs={24}>
            <PatientFlowSwitcher
              monthly={data.monthlyPatientFlow}
              overall={overallTotals}
              isOverallError={isOverallError}
              monthlyLoading={loading}
              overallLoading={isOverallFetching}
              date={date}
            />
          </Col>
          <Col xs={24} style={dimWhen(loading)}>
            <StaffAttendance
              data={data.staffAttendance}
              facilityId={selectedFacilityId}
              districtId={selectedDistrictId}
              date={date}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardReport;
