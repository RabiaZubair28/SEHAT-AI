import React, { useMemo, useState } from "react";
import { Table, Button } from "antd";
import type { TableProps } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  useGetPatientWithVisitsQuery,
  useLazyGetVisitDetailsQuery,
} from "@/features/patient-journey/services/patientProfileApi";
import VisitReportModal, { printVisitReport } from "./VisitReportModal";
import { useTablePagination } from "@/hooks/useTablePagination";

const VisitHistory: React.FC = () => {
  const { patientId } = useParams();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [selectedVisitNumber, setSelectedVisitNumber] = useState<number | null>(
    null,
  );
  const { page, pageSize, onChange } = useTablePagination(() => {});
  const { data: patientData, isLoading: isLoadingPatient } =
    useGetPatientWithVisitsQuery(
      {
        patientId: Number(patientId),
        page,
        limit: pageSize,
      },
      { skip: !patientId },
    );
  const [getVisitDetails] = useLazyGetVisitDetailsQuery();
  const totalVisits = patientData?.count || 0;

  const handleViewReport = (visitId: number, visitNumber?: number) => {
    setSelectedVisitId(visitId);
    setSelectedVisitNumber(visitNumber || null);
    setIsModalVisible(true);
  };

  const handleDownloadPDF = async (visitId: number, visitNumber?: number) => {
    const result = await getVisitDetails(visitId);
    const visitData = result.data;

    if (!visitData) return;

    printVisitReport(visitData, visitNumber || visitData.visitNumber || visitId);
  };

  const tableData = useMemo(() => {
    const visits = patientData?.data?.visits || patientData?.visits;

    if (!Array.isArray(visits)) {
      return [];
    }

    return visits
      .filter((visit: any) => visit.visitStatus === "dispatched")
      .map((visit: any) => ({
        key: visit.visitId,
        visitId: visit.visitId,
        visitNumber: visit.visitNumber,
        visitDate: visit.createdAt || visit.visitDate,
        visitStatus: visit.visitStatus,
        services: visit.services
          ? visit.services.split(",").map((service: string) => service.trim())
          : [],
      }));
  }, [patientData]);

  const columns: TableProps<any>["columns"] = [
    {
      title: "Visit",
      dataIndex: "visitNumber",
      key: "visitNumber",
      width: "8%",
      render: (visitNumber: number) => (
        <span
          style={{
            fontWeight: 600,
            color: "#262626",
            fontSize: "14px",
          }}
        >
          #{visitNumber}
        </span>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "visitDate",
      key: "visitDate",
      width: "16%",
      render: (date: string) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              color: "#262626",
              marginBottom: "2px",
            }}
          >
            {dayjs(date).format("DD MMM YYYY")}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#8c8c8c",
            }}
          >
            {dayjs(date).format("hh:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Services",
      dataIndex: "services",
      key: "services",
      width: "40%",
      align: "center",
      render: (services: string[]) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          {services && services.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                justifyContent: "center",
              }}
            >
              {services.map((service, index) => (
                <span
                  key={index}
                  style={{
                    padding: "2px 10px",
                    fontSize: "13px",
                    background: "#f0f5ff",
                    color: "#1890ff",
                    borderRadius: "4px",
                    fontWeight: 500,
                  }}
                >
                  {service.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: "#bfbfbf", fontSize: "13px" }}>No services</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "visitStatus",
      key: "visitStatus",
      width: "12%",
      render: (status: string) => (
        <span
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "4px",
            background: "#f6ffed",
            color: "#52c41a",
            textTransform: "uppercase",
          }}
        >
          {status || "Dispatched"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "24%",
      align: "center",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewReport(record.visitId, record.visitNumber)}
            size="middle"
          >
            View Report
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPDF(record.visitId, record.visitNumber)}
            size="middle"
          >
            Download PDF
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={tableData}
        loading={isLoadingPatient}
        rowKey="visitId"
        pagination={{
          current: page,
          pageSize,
          total: totalVisits,
          showTotal: (total) => `Total ${total} visits`,
          size: "small",
          onChange,
        }}
      />

      <VisitReportModal
        open={isModalVisible}
        visitId={selectedVisitId}
        visitNumber={selectedVisitNumber}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedVisitId(null);
          setSelectedVisitNumber(null);
        }}
      />
    </>
  );
};

export default VisitHistory;
