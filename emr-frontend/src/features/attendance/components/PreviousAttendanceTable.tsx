import React from "react";
import { Table } from "antd";
import type { TableProps } from "antd";
import { formatDate } from "@/utils/formats/generalFormatters";

interface PreviousAttendanceTableProps {
  attendanceData?: any;
  page?: number;
  limit?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
}

const PreviousAttendanceTable: React.FC<PreviousAttendanceTableProps> = ({
  attendanceData,
  page = 1,
  limit = 10,
  onPageChange,
}) => {
  const calculateWorkingHours = (
    checkInTime: string,
    checkOutTime?: string,
  ) => {
    if (!checkOutTime) return "--";

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(totalMinutes / 60);
    const diffMinutes = totalMinutes % 60;

    return `${diffHours}h ${diffMinutes}m`;
  };

  const transformedData =
    attendanceData?.data.map((item: any, index: number) => {
      const checkInDate = new Date(item.checkInTime);
      const dayOfWeek = checkInDate.toLocaleDateString("en-GB", {
        weekday: "long",
      });

      // Format check-in time
      const checkInTime = checkInDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Format check-out time if exists
      const checkOutTime = item.checkOutTime
        ? new Date(item.checkOutTime).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--";

      const workingHours = calculateWorkingHours(
        item.checkInTime,
        item.checkOutTime,
      );

      return {
        key: item.id || index,
        date: formatDate(item.checkInTime),
        day: dayOfWeek,
        checkedInTime: checkInTime,
        checkedOutTime: checkOutTime,
        status: item.status || "-",
        workinghours: workingHours || "--",
      };
    }) || [];

  const columns: TableProps<any>["columns"] = [
    {
      title: "DAY",
      dataIndex: "day",
      key: "day",
      width: 120,
    },
    {
      title: "DATE",
      dataIndex: "date",
      key: "date",
      width: 150,
    },
    {
      title: "CHECK IN TIME",
      dataIndex: "checkedInTime",
      key: "checkedInTime",
      width: 150,
    },
    {
      title: "CHECK OUT TIME",
      dataIndex: "checkedOutTime",
      key: "checkedOutTime",
      width: 150,
    },
    {
      title: "WORKING HOURS",
      dataIndex: "workinghours",
      key: "workinghours",
      width: 150,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === "Checked In"
              ? "bg-green-100 text-green-800"
              : status === "Checked Out"
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {status}
        </span>
      ),
    },
  ];

  const total =
    attendanceData?.count ??
    attendanceData?.total ??
    attendanceData?.meta?.total ??
    transformedData.length;

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      scroll={{ x: "max-content" }}
      className="shadow-md rounded-lg"
      pagination={{
        current: page,
        pageSize: limit,
        total,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} items`,
      }}
    />
  );
};

export default PreviousAttendanceTable;
