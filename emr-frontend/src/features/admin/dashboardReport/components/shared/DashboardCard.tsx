import React from "react";
import { Card } from "antd";
import { GREEN_BORDER } from "./constants";

interface DashboardCardProps {
  children:   React.ReactNode;
  style?:     React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  onClick?:   () => void;
  ariaLabel?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  children,
  style,
  bodyStyle,
  onClick,
  ariaLabel,
}) => (
  <Card
    style={{
      borderRadius: 16,
      border:       `1.5px solid ${GREEN_BORDER}`,
      boxShadow:    "0 4px 24px rgba(6,69,38,0.07)",
      cursor:       onClick ? "pointer" : undefined,
      ...style,
    }}
    hoverable={!!onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-label={ariaLabel}
    onClick={onClick}
    onKeyDown={(event) => {
      if (!onClick) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    styles={{ body: { padding: 0, ...bodyStyle } }}
  >
    {children}
  </Card>
);

export default DashboardCard;
