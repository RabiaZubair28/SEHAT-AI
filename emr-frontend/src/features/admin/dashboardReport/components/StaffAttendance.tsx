import React, { useEffect, useMemo, useRef, useState } from "react";
import { Col, Row } from "antd";
import type { Dayjs } from "dayjs";
import { UserOutlined, LoginOutlined, LogoutOutlined } from "@ant-design/icons";
import { debounce } from "lodash";

import DashboardCard from "./shared/DashboardCard";
import AttendanceSummaryCard from "./AttendanceSummaryCard";
import MetricCard from "./shared/MetricCard";
import SectionHeading from "./shared/SectionHeading";
import {
  DATE_FORMATS,
  isToday,
  dayLabel,
} from "@/utils/formats/dateFormatters";
import StaffAttendanceModal, {
  type AttendanceModalView,
} from "./StaffAttendanceModal";
import {
  useGetDashboardQuery,
  type DashboardParams,
  type StaffAttendance as StaffAttendanceType,
  type StaffAttendanceCollection,
} from "../../services/dashboardService";

interface Props {
  data: StaffAttendanceType;
  facilityId?: number;
  districtId?: number;
  date: Dayjs;
}

interface ModalQueryState {
  page: number;
  limit: number;
  search: string;
}

const DEFAULT_QUERY_STATE: ModalQueryState = {
  page: 1,
  limit: 10,
  search: "",
};

const STRINGS = {
  subtitle: (d: Dayjs) =>
    isToday(d)
      ? "Today's attendance for this facility"
      : `Attendance on ${dayLabel(d)} for this facility`,
};

const StaffAttendance: React.FC<Props> = ({
  data,
  facilityId,
  districtId,
  date,
}) => {
  const queryDate = date.format(DATE_FORMATS.API_DATE);
  const pastDate = !isToday(date);
  const [activeView, setActiveView] = useState<AttendanceModalView | null>(null);
  const [queryStateByView, setQueryStateByView] = useState<
    Record<AttendanceModalView, ModalQueryState>
  >({
    all: {
      page: data.allUsers.pagination.page,
      limit: DEFAULT_QUERY_STATE.limit,
      search: data.allUsers.pagination.search ?? "",
    },
    checkedIn: {
      page: data.checkedInUsers.pagination.page,
      limit: DEFAULT_QUERY_STATE.limit,
      search: data.checkedInUsers.pagination.search ?? "",
    },
    checkedOut: {
      page: data.checkedOutUsers.pagination.page,
      limit: DEFAULT_QUERY_STATE.limit,
      search: data.checkedOutUsers.pagination.search ?? "",
    },
  });
  const [searchInputByView, setSearchInputByView] = useState<
    Record<AttendanceModalView, string>
  >({
    all: data.allUsers.pagination.search ?? "",
    checkedIn: data.checkedInUsers.pagination.search ?? "",
    checkedOut: data.checkedOutUsers.pagination.search ?? "",
  });

  const searchDebounceRef = useRef(
    debounce((view: AttendanceModalView, value: string) => {
      setQueryStateByView((prev) => ({
        ...prev,
        [view]: {
          ...prev[view],
          page: 1,
          search: value,
        },
      }));
    }, 400),
  );

  useEffect(() => {
    return () => {
      searchDebounceRef.current.cancel();
    };
  }, []);

  const activeQueryState = activeView
    ? queryStateByView[activeView]
    : DEFAULT_QUERY_STATE;

  const modalQueryParams = useMemo<DashboardParams>(
    () =>
      activeView === "all"
        ? {
            date: queryDate,
            facilityId,
            districtId,
            totalFacilityStaffRecordsPage: activeQueryState.page,
            totalFacilityStaffRecordsLimit: activeQueryState.limit,
            totalFacilityStaffRecordsSearch: activeQueryState.search || undefined,
          }
        : activeView === "checkedIn"
          ? {
              date: queryDate,
              facilityId,
              districtId,
              checkedInUsersPage: activeQueryState.page,
              checkedInUsersLimit: activeQueryState.limit,
              checkedInUsersSearch: activeQueryState.search || undefined,
            }
          : activeView === "checkedOut"
            ? {
                date: queryDate,
                facilityId,
                districtId,
                checkedOutUsersPage: activeQueryState.page,
                checkedOutUsersLimit: activeQueryState.limit,
                checkedOutUsersSearch: activeQueryState.search || undefined,
              }
            : { date: queryDate, facilityId, districtId },
    [activeQueryState, activeView, districtId, facilityId, queryDate],
  );

  const { data: modalDashboardData, isFetching: isModalFetching } =
    useGetDashboardQuery(modalQueryParams, {
      skip: activeView === null,
      refetchOnMountOrArgChange: true,
    });

  const modalAttendance = modalDashboardData?.staffAttendance ?? data;

  const activeCollection = useMemo<StaffAttendanceCollection>(() => {
    if (activeView === "checkedIn") return modalAttendance.checkedInUsers;
    if (activeView === "checkedOut") return modalAttendance.checkedOutUsers;
    return modalAttendance.allUsers;
  }, [activeView, modalAttendance]);

  const resetViewState = (view: AttendanceModalView) => {
    setQueryStateByView((prev) => ({
      ...prev,
      [view]: {
        ...DEFAULT_QUERY_STATE,
      },
    }));

    setSearchInputByView((prev) => ({
      ...prev,
      [view]: "",
    }));
  };

  const handleOpen = (view: AttendanceModalView) => {
    setActiveView(view);
  };

  const handleSearchChange = (value: string) => {
    if (!activeView) return;

    setSearchInputByView((prev) => ({
      ...prev,
      [activeView]: value,
    }));

    searchDebounceRef.current(activeView, value.trim());
  };

  const handlePageChange = (page: number, pageSize: number) => {
    if (!activeView) return;

    setQueryStateByView((prev) => ({
      ...prev,
      [activeView]: {
        ...prev[activeView],
        page,
        limit: pageSize,
      },
    }));
  };

  const handleClose = () => {
    if (activeView) {
      searchDebounceRef.current.cancel();
      resetViewState(activeView);
    }

    setActiveView(null);
  };

  return (
    <div>
      <SectionHeading
        title="Staff Attendance"
        subtitle={STRINGS.subtitle(date)}
      />
      <Row gutter={[16, 16]} align="stretch">
        <Col
          xs={24}
          sm={12}
          lg={8}
          className="self-start"
          style={{ display: "flex" }}
        >
          <DashboardCard
            style={{ width: "100%" }}
            onClick={() => handleOpen("all")}
            ariaLabel="Open all staff attendance details"
          >
            <MetricCard
              label="Total Facility Staff"
              value={data.totalFacilityStaff}
              icon={<UserOutlined />}
              highlight
            />
          </DashboardCard>
        </Col>

        {pastDate ? (
          <Col xs={24} lg={16} style={{ display: "flex" }}>
            <AttendanceSummaryCard
              key={`${queryDate}-${facilityId}-${districtId}`}
              date={queryDate}
              facilityId={facilityId}
              districtId={districtId}
              initialCollection={data.allUsers}
              checkedInCount={data.checkedInRange}
              absentCount={Math.max(
                data.totalFacilityStaff - data.checkedInRange,
                0,
              )}
            />
          </Col>
        ) : (
          <>
            <Col xs={24} sm={12} lg={8} style={{ display: "flex" }}>
              <DashboardCard
                style={{ width: "100%" }}
                onClick={() => handleOpen("checkedIn")}
                ariaLabel="Open checked-in staff details"
              >
                <MetricCard
                  label="Checked-In Now"
                  value={data.checkedInNow}
                  icon={<LoginOutlined />}
                />
              </DashboardCard>
            </Col>

            <Col xs={24} sm={12} lg={8} style={{ display: "flex" }}>
              <DashboardCard
                style={{ width: "100%" }}
                onClick={() => handleOpen("checkedOut")}
                ariaLabel="Open checked-out staff details"
              >
                <MetricCard
                  label="Checked-Out / Absent"
                  value={data.checkedOutOrAbsent}
                  icon={<LogoutOutlined />}
                  danger={data.checkedOutOrAbsent > 0}
                />
              </DashboardCard>
            </Col>
          </>
        )}
      </Row>

      <StaffAttendanceModal
        open={activeView !== null}
        view={activeView}
        records={activeCollection.records}
        pagination={activeCollection.pagination}
        searchValue={activeView ? searchInputByView[activeView] : ""}
        loading={isModalFetching}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onClose={handleClose}
      />
    </div>
  );
};

export default StaffAttendance;
