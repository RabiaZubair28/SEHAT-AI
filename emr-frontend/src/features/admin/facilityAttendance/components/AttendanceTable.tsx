import React from "react";
import { Table, Input, Popconfirm, Button, message } from "antd";
import type { TableProps } from "antd";
import { LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { formatDate } from "@/utils/formats/generalFormatters";
import { useForceCheckoutDoctorMutation } from "../services/attendanceApiServices";

interface FacilityAttendanceTableProps {
  attendanceData?: any;
  isLoading?: boolean;
  onPageChange?: (page: number, pageSize: number) => void;
  onSearch?: (value: string) => void;
  refetchAttendance?: () => void;
}

const FacilityAttendanceTable: React.FC<FacilityAttendanceTableProps> = ({
  attendanceData,
  isLoading = false,
  onPageChange,
  onSearch,
  refetchAttendance,
}) => {
  const [forceCheckout, { isLoading: isCheckoutLoading }] =
    useForceCheckoutDoctorMutation();

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

  const handleForceCheckout = async (userId: number, userName: string) => {
    try {
      await forceCheckout({ doctorId: userId }).unwrap();
      message.success(`${userName} has been checked out successfully`);
      if (refetchAttendance) {
        refetchAttendance();
      }
    } catch (error: any) {
      message.error(error?.data?.message || "Failed to checkout user");
    }
  };

  const transformedData =
    attendanceData?.data?.map((item: any, index: number) => {
      const checkInDate = new Date(item.checkInTime);
      const dayOfWeek = checkInDate.toLocaleDateString("en-GB", {
        weekday: "long",
      });

      // Format check-in time (just the time part)
      const checkInTimeOnly = checkInDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Format check-out time if exists
      const checkOutTimeOnly = item.checkOutTime
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
        userId: item.user.id,
        name: `${item.user?.first_name || ""} ${
          item.user?.last_name || ""
        }`.trim(),
        email: item.user?.email || "-",
        date: formatDate(item.checkInTime),
        day: dayOfWeek,
        checkedInTime: checkInTimeOnly,
        checkedOutTime: checkOutTimeOnly,
        status: item.status || "-",
        workingHours: workingHours,
        hasCheckedOut: !!item.checkOutTime,
      };
    }) || [];

  const columns: TableProps<any>["columns"] = [
    {
      title: "NAME",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
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
      dataIndex: "workingHours",
      key: "workingHours",
      width: 150,
      render: (hours: string) => <span className="font-medium">{hours}</span>,
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
    {
      title: "ACTION",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Popconfirm
          title="Force Checkout"
          description={`Are you sure you want to force checkout ${record.name}?`}
          onConfirm={() => handleForceCheckout(record.userId, record.name)}
          okText="Yes"
          cancelText="No"
          disabled={record.hasCheckedOut}
        >
          <Button
            type={record.hasCheckedOut ? "default" : "primary"}
            danger
            size="small"
            icon={<LogoutOutlined />}
            disabled={record.hasCheckedOut}
            loading={isCheckoutLoading}
          >
            Checkout
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          placeholder="Search by user name"
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => onSearch?.(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={transformedData}
        loading={isLoading}
        size="small"
        scroll={{ x: "max-content" }}
        className="shadow-md rounded-lg"
        pagination={{
          total: attendanceData?.total || 0,
          pageSize: attendanceData?.limit || 10,
          current: attendanceData?.page || 1,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: onPageChange,
        }}
      />
    </div>
  );
};

export default FacilityAttendanceTable;
