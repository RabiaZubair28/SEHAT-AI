import React from "react";
import { Card } from "antd";
import { GREEN_BORDER } from "./constants";

interface ReportCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const ReportCard: React.FC<ReportCardProps> = ({ children, style }) => (
  <Card
    style={{
      borderRadius: 16,
      border: `1.5px solid ${GREEN_BORDER}`,
      boxShadow: "0 4px 24px rgba(6,69,38,0.08)",
      overflow: "hidden",
      ...style,
    }}
    styles={{ body: { padding: 0 } }}
  >
    {children}
  </Card>
);

export default ReportCard;