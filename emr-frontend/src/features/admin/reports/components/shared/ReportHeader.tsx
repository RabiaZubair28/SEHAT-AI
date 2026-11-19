import React from "react";
import { Button, Space, Tooltip } from "antd";
import { FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import { GRADIENT } from "./constants";

interface ReportHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  icon,
  title,
  subtitle,
  onExportPDF,
  onExportExcel,
}) => {
  return (
    <div
      style={{
        background: GRADIENT,
        borderRadius: "14px 14px 0 0",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#fff",
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
      </div>

      <Space>
        <Tooltip title="Export as PDF">
          <Button
            icon={<FilePdfOutlined />}
            onClick={onExportPDF}
            style={{
              borderRadius: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            PDF
          </Button>
        </Tooltip>
        <Tooltip title="Export as Excel">
          <Button
            icon={<FileExcelOutlined />}
            onClick={onExportExcel}
            style={{
              borderRadius: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Excel
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
};

export default ReportHeader;