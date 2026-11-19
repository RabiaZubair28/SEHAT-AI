import React, { useState } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { DATE_FORMATS } from "@/utils/formats/dateFormatters";
import DashboardCard from "./shared/DashboardCard";
import {
  type StaffAttendanceCollection,
  type StaffAttendanceRecord,
  useGetDashboardQuery,
} from "../../services/dashboardService";

interface Props {
  date: string;
  facilityId?: number;
  districtId?: number;
  // First page, already returned by the main dashboard query.
  initialCollection: StaffAttendanceCollection;
  checkedInCount: number;
  absentCount: number;
}

const formatTime = (value?: string | null) =>
  value ? dayjs(value).format(DATE_FORMATS.TIME_12H) : "N/A";

const AttendanceSummaryCard: React.FC<Props> = ({
  date,
  facilityId,
  districtId,
  initialCollection,
  checkedInCount,
  absentCount,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = initialCollection.pagination.limit;

  // Page 1 comes from the main dashboard query, so only fetch other pages.
  const { data: pageData, isFetching } = useGetDashboardQuery(
    {
      date,
      facilityId,
      districtId,
      totalFacilityStaffRecordsPage: page,
      totalFacilityStaffRecordsLimit: pageSize,
    },
    { skip: page === 1 },
  );

  let collection = initialCollection;

  if (page !== 1) {
    collection = pageData?.staffAttendance.allUsers ?? initialCollection;
  }

  const { records, pagination } = collection;
  const showFacility = !facilityId;

  const columns: ColumnsType<StaffAttendanceRecord> = [
    {
      title: "Staff",
      dataIndex: "name",
      render: (name: string, record) => (
        <>
          <div className="font-medium text-green-custom">{name}</div>
          {showFacility && record.facilityName && (
            <div className="text-[11px] text-gray-500">
              {record.facilityName}
            </div>
          )}
        </>
      ),
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_, record) => {
        if (record.checkInTime) {
          return (
              <span className="text-green-custom">
                {formatTime(record.checkInTime)} –{" "}
                {formatTime(record.checkOutTime)}
              </span>
          );
        }

        return (
          <Tag color="red" className="!m-0">
            Absent
          </Tag>
        );
      },
    },
  ];

  return (
    <DashboardCard style={{ width: "100%" }}>
      <div className="px-[22px] py-5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-green-custom">
            Attendance Summary
          </span>
          <span>
            <Tag color="green">Present: {checkedInCount}</Tag>
            <Tag color="red">Absent: {absentCount}</Tag>
          </span>
        </div>
        <Table<StaffAttendanceRecord>
          size="small"
          rowKey="userId"
          columns={columns}
          dataSource={records}
          loading={isFetching}
          locale={{ emptyText: "No staff records available." }}
          pagination={{
            current: page,
            pageSize,
            total: pagination.total,
            onChange: setPage,
            showSizeChanger: false,
            hideOnSinglePage: true,
            size: "small",
          }}
        />
      </div>
    </DashboardCard>
  );
};

export default AttendanceSummaryCard;
