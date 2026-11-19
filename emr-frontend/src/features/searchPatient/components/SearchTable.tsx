import React from "react";
import { Table, Space } from "antd";
import CustomButton from "@/components/ui/Button";
import { PatientSearchResult, PatientSearchAppointment } from "@/data/types";
import { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import {
  clearSelectedPatientData,
  setSelectedPatientData,
} from "@/redux/store/slices/patientSlice";
import { useDispatch, useSelector } from "react-redux";
import { Roles } from "@/data/types";
import { RootState } from "@/redux/store";

interface PatientTableProps {
  data: PatientSearchResult[];
  loading: boolean;
  total: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PatientTable: React.FC<PatientTableProps> = ({
  data,
  loading,
  total,
  currentPage,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.authUser.user);
  const isFrontDesk = user?.role?.name === Roles.FRONT_DESK;

  const tableData = (data || []).map((patient) => ({
    key: patient.id,
    mrNo: patient.mr_no,
    name: `${patient.first_name} ${patient.last_name}`,
    cnic: patient.cnic ? `${patient.cnic}` : "--",
    phone: patient.phone_number,
    dob: patient.dob,
    gender: patient.gender,
    appointments: patient.appointments,
  }));

  const columns: ColumnsType<{
    key: number;
    mrNo: string;
    name: string;
    cnic: string;
    phone: string;
    dob?: string;
    gender?: string;
    appointments?: PatientSearchAppointment[];
  }> = [
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
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const isEnabled =
          !record.appointments ||
          record.appointments.length === 0 ||
          !record.appointments.some(
            (a) => a?.status === "in_progress" || a?.status === "pending",
          );

        return (
          <Space>
            <CustomButton
              size="custom"
              variant="table"
              rounded="sm"
              title="Assign Service"
              className="px-2 py-0.5"
              disabled={!isEnabled}
              onClick={() => {
                dispatch(clearSelectedPatientData());
                navigate(ROUTES.REFERRAL, {
                  state: { patientId: record.key },
                });
              }}
            />
            <CustomButton
              size="custom"
              title="Visit Profile"
              variant="custom"
              disabled={!isFrontDesk}
              className="border-1 cursor-pointer rounded-sm px-5 py-0.5"
              onClick={() => {
                const patientData = data.find((p) => p.id === record.key);
                if (patientData) {
                  dispatch(
                    setSelectedPatientData({
                      id: record.key,
                      appointmentId: null,
                      appointmentServices: [],
                      selectedServiceRoute: undefined,
                      selectedServiceIdFromCard: undefined,
                      visit: null,
                      patientData,
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
                }
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      loading={loading}
      bordered
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: currentPage,
        pageSize: 4,
        total: total,
        showSizeChanger: false,
        onChange: onPageChange,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default PatientTable;
