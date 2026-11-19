import React, { useState } from "react";
import { Button, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { useGetPatientImmunisationsQuery } from "@/features/patientQueue/services/queueApi";
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
  status?: string;
}

const ImmunisationTable: React.FC = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState<SelectedPatient | null>(null);
  const {user} = useAuthUser()

  const {
    data: immunisationsData,
    isLoading,
    isError,
    refetch,
  } = useGetPatientImmunisationsQuery(
    {
      page: pagination.current,
      limit: pagination.pageSize,
      statuses: [IMMUNISATION_STATUSES.OVER_DUE],
      has_remarks: true,
      uc_id: user?.facility.uc_id,
    },
    { refetchOnMountOrArgChange: true }
  );

  const handleViewRemarks = (record: any) => {
    setSelectedPatient({
      id: record.patientId,
      name: record.name,
      remarks: record.remarks ?? null,
      status: record.status,
    });
    setRemarksModalOpen(true);
  };

  const handleCloseModal = () => {
    setRemarksModalOpen(false);
    setSelectedPatient(null);
  };

  const columns: TableProps<any>["columns"] = [
    { title: "TOKEN", dataIndex: "token", key: "token", width: 100 },
    { title: "MR#", dataIndex: "mrNo", key: "mrNo", width: 140 },
    {
      title: "PATIENT NAME",
      dataIndex: "name",
      key: "name",
      width: 140,
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    { title: "PHONE NUMBER", dataIndex: "phone", key: "phone", width: 140 },
    { title: "DUE DATE", dataIndex: "dueDate", key: "dueDate", width: 140 },
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
        const isClosed =
          typeof record.status === "string" &&
          record.status === IMMUNISATION_STATUSES.CLOSED;
        return (
          <Button
            type="default"
            size="small"
            onClick={() => handleViewRemarks(record)}
            disabled={isClosed}
          >
            View Remarks
          </Button>
        );
      },
    },
  ];

  if (isLoading) return <Loader />;
  if (isError)
    return (
      <div className="text-red-600">Failed to load immunisation records</div>
    );

  const transformedData =
    (immunisationsData?.data || [])
      .map((item: any, index: number) => ({
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
        status: item.status || "Over Due",
        patientData: item.patient || {},
        dob: item.patient?.dob,
        remarks: item.remarks,
      })) || [];

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
          onChange: (page, pageSize) =>
            setPagination({ current: page, pageSize }),
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
          onCaseClosed={refetch}
        />
      )}
    </>
  );
};

export default ImmunisationTable;
