import React, { useState } from "react";
import { Button, Table } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { useGetEmergencyQueueByDoctorQuery } from "../services/queueApi";
import Loader from "@/components/shared/Loader";
import { generateEmergencyPatientPDF } from "../helpers/generatePdf";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGlobalNotification } from "@/hooks/useNotification";

const EmergencyQueue: React.FC = () => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const user = useSelector((state: RootState) => state.authUser?.user);
  const doctorId = user?.id ?? 0;
  const showNotification = useGlobalNotification();

  const handleDownloadPDF = async (record: any) => {
    try {
      await generateEmergencyPatientPDF(record.fullData);
      showNotification(
        "success",
        "PDF Generation",
        "PDF downloaded successfully!",
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification(
        "error",
        "PDF Generation",
        "Failed to generate PDF. Please try again.",
      );
    }
  };

  // Columns configuration
  const columns: TableProps<any>["columns"] = [
    {
      title: "S.NO",
      dataIndex: "serial",
      key: "serial",
    },
    {
      title: "ER#",
      dataIndex: "er",
      key: "id",
      render: (text) => `${text}`,
    },
    {
      title: "PATIENT NAME",
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "PHONE NUMBER",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "GENDER",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "DATE OF VISIT",
      dataIndex: "dateOfVisit",
      key: "dateOfVisit",
    },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadPDF(record)}
        >
          Download PDF
        </Button>
      ),
    },
  ];

  const {
    data: emergencyData,
    isLoading,
    isError,
  } = useGetEmergencyQueueByDoctorQuery(
    {
      doctorId,
      page: pagination.current,
      limit: pagination.pageSize,
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !doctorId,
    },
  );

  if (isLoading) return <Loader />;

  if (isError)
    return (
      <div className="text-red-600">Failed to load emergency patients</div>
    );

  const transformedData =
    emergencyData?.data?.map((item: any, index: number) => {
      const dt = new Date(item?.created_at);
      const formattedDate = dt
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");

      return {
        key: item.id,
        serial: index + 1,
        id: item.id,
        name: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "-",
        phone: item.mobile_no || "-",
        gender: item.gender || "-",
        er: item.er_no || "-",
        dateOfVisit: formattedDate,
        // Store full record for PDF generation
        fullData: item,
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
        total: emergencyData?.count || 0,
        onChange: (page, pageSize) => {
          setPagination({ current: page, pageSize });
        },
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default EmergencyQueue;
