import React from "react";
import { Col, Row } from "antd";
import { GREEN, GREEN_SOFT } from "./constants";

export interface StatItem {
  label: string;
  value: string | number;
  highlight?: boolean; // uses green bg
  danger?: boolean; // red value
  suffix?: string;
}

interface StatsRowProps {
  stats: StatItem[];
}

const StatCard: React.FC<StatItem> = ({
  label,
  value,
  highlight,
  danger,
  suffix,
}) => (
  <div
    style={{
      background: highlight ? GREEN : GREEN_SOFT,
      borderRadius: 12,
      padding: "18px 20px",
      textAlign: "center",
      height: "100%",
      border: highlight ? "none" : `1px solid #d4ead9`,
    }}
  >
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: highlight ? "#fff" : danger ? "#cf1322" : GREEN,
        lineHeight: 1.2,
      }}
    >
      {value}
      {suffix && (
        <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>
          {suffix}
        </span>
      )}
    </div>
    <div
      style={{
        fontSize: 12,
        color: highlight ? "rgba(255,255,255,0.75)" : "#5a8a6a",
        marginTop: 6,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  </div>
);

const StatsRow: React.FC<StatsRowProps> = ({ stats }) => (
  <Row gutter={[14, 14]}>
    {stats.map((s, i) => (
      <Col key={i} xs={12} sm={6} flex="1">
        <StatCard {...s} />
      </Col>
    ))}
  </Row>
);

export { StatCard };
export default StatsRow;
