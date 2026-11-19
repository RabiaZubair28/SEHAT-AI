import React from "react";
import { Typography } from "antd";
import { GREEN } from "./constants";

const { Text } = Typography;

interface SectionHeadingProps {
  title:    string;
  subtitle?:string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle }) => (
  <div style={{ marginBottom: 16 }}>
    <Text strong style={{ fontSize: 15, color: GREEN, display: "block" }}>
      {title}
    </Text>
    {subtitle && (
      <Text style={{ fontSize: 12, color: "#5a8a6a" }}>{subtitle}</Text>
    )}
  </div>
);

export default SectionHeading;