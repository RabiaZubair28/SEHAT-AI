import React, { useState } from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import FacilityAttendanceTable from "./components/AttendanceTable";
import { useGetFacilityAttendanceRecordsQuery } from "./services/attendanceApiServices";
import Loader from "@/components/shared/Loader";
import { debounce } from "lodash";

const FacilityAttendance: React.FC = () => {
  const [form] = Form.useForm();
  const admin = useSelector((state: RootState) => state?.authAdmin?.admin);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const {
    data: attendanceData,
    isLoading: isAttendanceFetchLoading,
    isError,
    refetch,
  } = useGetFacilityAttendanceRecordsQuery(
    {
      facilityId: admin?.facility?.id!,
      page,
      limit,
      search,
    },
    {
      skip: !admin?.facility?.id,
    },
  );

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setLimit(newPageSize);
  };

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on new search
  }, 500);

  if (isError)
    return (
      <div className="text-red-600">Failed to load attendance records</div>
    );

  const tabItems = [
    {
      key: "1",
      label: "Facility Attendance",
      children: (
        <FacilityAttendanceTable
          attendanceData={attendanceData}
          isLoading={isAttendanceFetchLoading}
          onPageChange={handlePageChange}
          onSearch={handleSearch}
          refetchAttendance={refetch}
        />
      ),
    },
  ];

  if (isAttendanceFetchLoading && !attendanceData) {
    return <Loader />;
  }

  return (
    <>
      <TopBar title="Facility Attendance" />

      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Form>
    </>
  );
};

export default FacilityAttendance;
