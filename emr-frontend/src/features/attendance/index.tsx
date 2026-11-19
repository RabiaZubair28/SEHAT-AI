import React, { useState } from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import PreviousAttendanceTable from "./components/PreviousAttendanceTable";
import { useGetAttendanceRecordsQuery } from "./services/attendanceApiServices";
import AttendanceToggle from "./components/AttendanceToggle";
import Loader from "@/components/shared/Loader";

const UserAttendance: React.FC = () => {
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    data: attendanceData,
    isLoading: isAttendanceFetchLoading,
    isError,
  } = useGetAttendanceRecordsQuery(
    { page, limit },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  if (isError)
    return (
      <div className="text-red-600">Failed to load attendance records</div>
    );

  if (isAttendanceFetchLoading) {
    return <Loader />;
  }

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== limit) {
      setLimit(newPageSize);
    }
  };

  const tabItems = [
    {
      key: "1",
      label: "Attendance list",
      children: (
        <PreviousAttendanceTable
          attendanceData={attendanceData}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
        />
      ),
    },
  ];

  return (
    <>
      <TopBar title="Mark attendance" />

      <div className="flex justify-center sm:justify-end mt-10">
        <AttendanceToggle />
      </div>

      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Form>
    </>
  );
};

export default UserAttendance;
