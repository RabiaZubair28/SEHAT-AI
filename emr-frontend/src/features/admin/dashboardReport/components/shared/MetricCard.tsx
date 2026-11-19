import React from "react";
import { GREEN } from "./constants";

interface MetricCardProps {
  label:      string;
  value:      string | number;
  icon?:      React.ReactNode;
  highlight?: boolean;
  danger?:    boolean;
  warning?:   boolean;
  subRows?:   { label: string; value: number | string }[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, icon, highlight, danger, warning, subRows,
}) => {
  const bg           = highlight ? GREEN      : "#ffffff";
  const numColor     = highlight ? "#ffffff"  : danger  ? "#cf1322" : warning ? "#d46b08" : GREEN;
  const labelColor   = highlight ? "#a8d5b5"  : "#6b7280";
  const iconColor    = highlight ? "#a8d5b5"  : "#9ca3af";
  const rowLabel     = highlight ? "#d1f0dc"  : "#6b7280";
  const rowValue     = highlight ? "#ffffff"  : "#111827";
  const divider      = highlight ? "rgba(255,255,255,0.2)" : "#e5e7eb";
  const border       = highlight ? "none"     : "1px solid #e5e7eb";
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      style={{
        background:    bg,
        borderRadius:  12,
        padding:       "20px 22px",
        border,
        display:       "flex",
        flexDirection: "column",
        width:         "100%",
        minWidth:      0,
        overflow:      "hidden",
        boxSizing:     "border-box",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 12, color: labelColor, fontWeight: 600, marginBottom: 12,
          display: "block", letterSpacing: "0.02em", overflowWrap: "break-word",
        }}
      >
        {label}
      </span>

      {/* Icon + Number */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: subRows?.length ? 16 : 0, minWidth: 0,
        }}
      >
        {icon && (
          <span style={{ fontSize: 20, color: iconColor, lineHeight: 1, display: "flex", flexShrink: 0 }}>
            {icon}
          </span>
        )}
        <span
          title={displayValue}
          style={{
            fontSize: 36, fontWeight: 700, color: numColor, lineHeight: 1,
            minWidth: 0, flexShrink: 1, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Sub-rows */}
      {subRows && subRows.length > 0 && (
        <div style={{ borderTop: `1px solid ${divider}`, paddingTop: 12 }}>
          {subRows.map((row, i) => (
            <div
              key={i}
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                gap:            8,
                minWidth:       0,
                marginBottom:   i < subRows.length - 1 ? 7 : 0,
              }}
            >
              <span
                style={{
                  fontSize: 12, color: rowLabel, flex: 1, minWidth: 0,
                  overflowWrap: "break-word",
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 12, fontWeight: 700, color: rowValue,
                  flexShrink: 0, whiteSpace: "nowrap",
                }}
              >
                {typeof row.value === "number" ? row.value.toLocaleString() : row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricCard;