import React, { useState } from "react";
import { Button, Table } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetAllAppointmentsQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import { ROUTES } from "@/data/routes";
import { useDispatch } from "react-redux";
import { setSelectedPatientData } from "@/redux/store/slices/patientSlice";
// import u{ socketService } from "@/services/socketServices";
import { calculateAge } from "@/utils/ageCalculator";

const PatientQueueFDO: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleViewProfile = (record: any) => {
    console.log(record);
    const age = calculateAge(record.dob);

    dispatch(
      setSelectedPatientData({
        id: record.key,
        appointmentId: record.appointmentId,
        // appointmentServices: record?.appointmentServices,
        selectedServiceRoute: record.selectedServiceRoute,
        selectedServiceIdFromCard: undefined,
        visit: record.visit,
        patientData: record.patientData,
        name: record.name,
        mrNo: record.mrNo,
        appointmentStatus: record.appointmentStatus,
        age: age,
      })
    );

    navigate(
      `${ROUTES.PATIENT_MODULE}/${record.key}/${ROUTES.PATIENT_PROFILE}`
    );
  };

  // Columns configuration
  const columns: TableProps<any>["columns"] = [
    {
      title: "S.NO",
      dataIndex: "serial",
      key: "serial",
    },
    {
      title: "Patient NAME",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "TOKEN NUMBER",
      dataIndex: "token",
      key: "token",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "DOCTOR NAME",
      dataIndex: "doctor_name",
      key: "doctor_name",
    },
    {
      title: "MR#",
      dataIndex: "mr_no",
      key: "mr_no",
    },
    {
      title: "DATE OF VISIT",
      dataIndex: "datetime",
      key: "datetime",
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleViewProfile(record)}>
          Visit Profile
        </Button>
      ),
    },
  ];

  const {
    data: allData,
    isLoading,
    isError,
  } = useGetAllAppointmentsQuery(
    { page: pagination.current, limit: pagination.pageSize },
    { refetchOnMountOrArgChange: true }
  );
  //   useEffect(() => {
  //     const handleQueueAddedCallback = () => {
  //       refetch();
  //     };
  //     socketService.on("added_to_queue", handleQueueAddedCallback);
  //     return () => {
  //       socketService.off("added_to_queue", handleQueueAddedCallback);
  //     };
  //   }, []);

  if (isLoading) return <Loader />;

  if (isError)
    return <div className="text-red-600">Failed to load appointments</div>;

  const transformedData =
    allData?.data?.map((item: any, index: number) => {
      const dt = new Date(item?.createdAt);
      const formattedDate = dt
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");
      return {
        key: item.patient.id || index,
        serial: index + 1,
        token: `#${item.id}`,
        mr_no: item.patient?.mr_no || "-",
        doctor_name:
          `${item.doctor?.first_name || ""} ${
            item.doctor?.last_name || ""
          }`.trim() || "-",
        name:
          `${item.patient?.first_name || ""} ${
            item.patient?.last_name || ""
          }`.trim() || "-",
        datetime: formattedDate || "-",
      };
    }) || [];

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: allData?.count || 0,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize });
        },
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default PatientQueueFDO;
