import React, { useState } from "react";
import { Table, Space } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useGetUnassignedReferralsQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import { ROUTES } from "@/data/routes";
import CustomButton from "@/components/ui/Button";
import {
  clearSelectedPatientData,
  setSelectedPatientData,
} from "@/redux/store/slices/patientSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const UnassignedQueue: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.authUser.user);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const {
    data: unassignedData,
    isLoading,
    isError,
  } = useGetUnassignedReferralsQuery(
    {
      page: pagination.current,
      limit: pagination.pageSize,
      facility_id: user?.facility?.id ?? 0,
    },
    { refetchOnMountOrArgChange: true },
  );

  if (isLoading) return <Loader />;

  if (isError)
    return (
      <div className="text-red-600">Failed to load unassigned patients</div>
    );

  // API response ko table format mein transform karna
  const transformedData =
    unassignedData?.data?.map((item: any, dataIndex: number) => ({
      key: item.patient.id,
      referralId: item.id,
      mrNo: item.patient?.mr_no || "-",
      serial: dataIndex + 1,
      name:
        `${item.patient?.first_name || ""} ${item.patient?.last_name || ""}`.trim() ||
        "-",
      cnic: item.patient?.cnic || "--",
      phone: item.patient?.phone_number || "-",
      facility: item.facility?.name || "-",
      patientData: item.patient,
    })) || [];

  const columns: TableProps<any>["columns"] = [
    {
      title: "S.NO",
      dataIndex: "serial",
      key: "serial",
    },
    {
      title: "MR No",
      dataIndex: "mrNo",
      key: "mrNo",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "CNIC",
      dataIndex: "cnic",
      key: "cnic",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Facility",
      dataIndex: "facility",
      key: "facility",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <CustomButton
            size="custom"
            variant="table"
            rounded="sm"
            title="Assign Service"
            className="px-2 py-0.5"
            onClick={() => {
              dispatch(clearSelectedPatientData());
              navigate(ROUTES.REFERRAL, {
                state: {
                  patientId: record.key,
                },
              });
            }}
          />
          <CustomButton
            size="custom"
            title="Visit Profile"
            variant="custom"
            className="border-1 cursor-pointer rounded-sm px-5 py-0.5"
            onClick={() => {
              dispatch(
                setSelectedPatientData({
                  id: record.key,
                  appointmentId: null,
                  appointmentServices: [],
                  selectedServiceRoute: undefined,
                  selectedServiceIdFromCard: undefined,
                  visit: null,
                  patientData: record.patientData,
                  name: record.name,
                  mrNo: record.mrNo,
                  vitals: null,
                  appointmentStatus: null,
                  age: undefined,
                }),
              );
              navigate(
                `${ROUTES.PATIENT_MODULE}/${record.key}/${ROUTES.PATIENT_PROFILE}`,
              );
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      bordered
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: unassignedData?.count || 0,
        showSizeChanger: false,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize });
        },
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default UnassignedQueue;
