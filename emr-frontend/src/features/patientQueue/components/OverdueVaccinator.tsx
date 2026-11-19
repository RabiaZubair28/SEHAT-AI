import React, { useState } from "react";
import { Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useGetPatientImmunisationsQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import {
  getImmunisationStatusColor,
  IMMUNISATION_STATUSES,
} from "@/data/constants";
import RemarksModal from "./RemarksModal";
import { useAuthUser } from "@/hooks/useAuthUser";


interface SelectedPatient {
  id: number;
  name: string;
  remarks?: string | null;
}

const Overdue: React.FC = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState<SelectedPatient | null>(null);
  const { user } = useAuthUser();

  const handleAddComment = (record: any) => {
    setSelectedPatient({
      id: record.patientId,
      name: record.name,
      remarks: record.remarks ?? null,
    });
    setRemarksModalOpen(true);
  };

  const handleCloseModal = () => {
    setRemarksModalOpen(false);
    setSelectedPatient(null);
  };

  

  const columns: TableProps<any>["columns"] = [
    {
      title: "TOKEN",
      dataIndex: "token",
      key: "token",
      width: 100,
    },
    {
      title: "MR#",
      dataIndex: "mrNo",
      key: "mrNo",
      width: 140,
    },
    {
      title: "PATIENT NAME",
      dataIndex: "name",
      key: "name",
      width: 140,
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "PHONE NUMBER",
      dataIndex: "phone",
      key: "phone",
      width: 140,
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 140,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getImmunisationStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "REMARKS",
      key: "actions",
      width: 160,
      render: (_, record) => {
        const hasRemarks =
          typeof record.remarks === "string" &&
          record.remarks.trim().length > 0;
        const isDefaulter = record.status === IMMUNISATION_STATUSES.OVER_DUE;

        return (
          <Button
            type={hasRemarks ? "default" : "primary"}
            size="small"
            disabled={!isDefaulter}
            onClick={() => handleAddComment(record)}
          >
            {hasRemarks ? "View Remarks" : "Add Remarks"}
          </Button>
        );
      },
    },
  ];

  const {
    data: immunisationsData,
    isLoading,
    isError,
  } = useGetPatientImmunisationsQuery(
    {
      page: pagination.current,
      limit: pagination.pageSize,
      statuses: [
        IMMUNISATION_STATUSES.OVER_DUE,
        IMMUNISATION_STATUSES.SCHEDULED,
      ],
      uc_id: user?.facility.uc_id,
    },
    { refetchOnMountOrArgChange: true },
  );

  if (isLoading) return <Loader />;

  if (isError)
    return (
      <div className="text-red-600">Failed to load immunisation records</div>
    );

  const transformedData =
    immunisationsData?.data?.map((item: any, index: number) => {
      return {
        key: item.patient?.id || index,
        patientId: item.patient?.id,
        token: `#${item.id || "-"}`,
        mrNo: item.patient?.mr_no || "-",
        name:
          `${item.patient?.first_name || ""} ${
            item.patient?.last_name || ""
          }`.trim() || "-",
        phone: item.patient?.phone_number || "-",
        dueDate: item.nextDueDate,
        status: item.status || IMMUNISATION_STATUSES.OVER_DUE,
        patientData: item.patient || {},
        dob: item.patient?.dob,
        remarks: item.remarks,
      };
    }) || [];

    

  return (
    <>
      <Table
        columns={columns}
        dataSource={transformedData}
        size="small"
        scroll={{ x: "max-content" }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: immunisationsData?.count || 0,
          showTotal: (total) => `Total ${total} immunisation records`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
          },
        }}
        className="shadow-md rounded-lg"
      />
      {selectedPatient && (
        <RemarksModal
          open={remarksModalOpen}
          onClose={handleCloseModal}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          remarks={selectedPatient.remarks}
        />
      )}
    </>
  );
};

export default Overdue;
