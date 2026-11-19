import React from "react";
import { Row, Col } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  HeartOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { GREEN, GREEN_SOFT } from "./shared/constants";

export interface ReportType {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export const REPORT_TYPES: ReportType[] = [
  { key: "all_patients",    label: "All Patients",    icon: <TeamOutlined /> },
  { key: "single_patient",  label: "Single Patient",  icon: <UserOutlined /> },
  { key: "service",         label: "Service Report",  icon: <FileTextOutlined /> },
  { key: "medicine",        label: "Medicine Count",  icon: <MedicineBoxOutlined /> },
  { key: "doctor",          label: "Doctor Report",   icon: <ExperimentOutlined /> },
  { key: "immunization",    label: "Immunization",    icon: <HeartOutlined /> },
  { key: "delivery",        label: "Delivery Report", icon: <GiftOutlined /> },
];

interface ReportSelectorProps {
  selected: string | null;
  onSelect: (key: string) => void;
}

const ReportSelector: React.FC<ReportSelectorProps> = ({ selected, onSelect }) => (
  <Row gutter={[10, 10]} style={{ marginBottom: 20 }}>
    {REPORT_TYPES.map((r) => {
      const active = selected === r.key;
      return (
        // xs=8 → 3 per row on phone
        // sm=6 → 4 per row on small tablet
        // md=4 → 6 per row on tablet
        // lg=3 → all 7 in one row on desktop
        <Col key={r.key} xs={8} sm={6} md={6} lg={3}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect(r.key)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(r.key)}
            style={{
              background: active
                ? `linear-gradient(135deg, #064526 0%, #0d8a4a 100%)`
                : "#fff",
              border: `2px solid ${active ? GREEN : "#d4ead9"}`,
              borderRadius: 12,
              padding: "12px 6px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s ease",
              boxShadow: active
                ? "0 4px 16px rgba(6,69,38,0.25)"
                : "0 1px 3px rgba(0,0,0,0.05)",
              transform: active ? "translateY(-2px)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              minHeight: 80,
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: active ? "rgba(255,255,255,0.15)" : GREEN_SOFT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: active ? "#fff" : GREEN,
                border: active ? "1px solid rgba(255,255,255,0.2)" : "none",
                flexShrink: 0,
              }}
            >
              {r.icon}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: active ? "#fff" : "#1a3d2b",
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
            >
              {r.label}
            </span>
          </div>
        </Col>
      );
    })}
  </Row>
);

export default ReportSelector;