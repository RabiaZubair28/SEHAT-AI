import React, { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoMercator, geoPath } from "d3-geo";
import { scaleLinear } from "d3-scale";
import { Typography } from "antd";

import sindhGeo from "../data/sindhDistricts.json";
import { resolveShapeName, DISPLAY_NAME, ShapeName } from "../data/districtNameMap";
import { GREEN, GREEN_BORDER } from "./shared/constants";

const { Text } = Typography;

// Portrait box — Sindh is taller than it is wide.
const W = 560;
const H = 680;

const NO_DATA = "#e8edf5"; // districts with zero patients
const HOVER_STROKE = "#1a3d2b";
// Only label districts whose projected area is at least this many px² — keeps
// the tiny Karachi cluster from turning into a pile of overlapping text.
const MIN_LABEL_AREA = 150;

// Vivid multi-hue sequential scale: purple → blue → teal → green → yellow → orange → red
const PALETTE = ["#9e5fce", "#5b7fe8", "#36b5c8", "#2ecc8a", "#a8e040", "#f5c518", "#f47c20", "#e8423a"];

export interface DistrictCount {
  districtName: string;
  count: number;
}

interface Props {
  /** Per-district patient counts from the report's districtAdministeredPatientCount. */
  data: DistrictCount[];
  /** Rendered height of the map in px (width follows the Sindh aspect ratio). */
  mapHeight?: number;
}

interface Hover {
  name: string;
  count: number;
  x: number;
  y: number;
}

const SindhDistrictMap: React.FC<Props> = ({ data, mapHeight = 360 }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  // Show the district list only on desktop; on mobile/tablet show just the map.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Aggregate backend counts onto shape names (folds carve-outs into parents).
  const { countByShape, max, unmapped } = useMemo(() => {
    const countByShape = new Map<string, number>();
    const unmapped: DistrictCount[] = [];
    for (const d of data ?? []) {
      const shape = resolveShapeName(d.districtName);
      if (!shape) {
        unmapped.push(d);
        continue;
      }
      countByShape.set(shape, (countByShape.get(shape) ?? 0) + (d.count ?? 0));
    }
    const max = Math.max(0, ...countByShape.values());
    return { countByShape, max, unmapped };
  }, [data]);

  const colorScale = useMemo(() => {
    const m = max || 1;
    const domain = PALETTE.map((_, i) => (i / (PALETTE.length - 1)) * m);
    return scaleLinear<string>().domain(domain).range(PALETTE).clamp(true);
  }, [max]);

  const colorForCount = (count: number) => (count > 0 ? colorScale(count) : NO_DATA);

  // Fit the Sindh geometry into the WxH viewBox once; path is used for labels.
  const projection = useMemo(
    () => geoMercator().fitSize([W, H], sindhGeo as any),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  // District list (right panel): backend rows, highest count first.
  const ranked = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.count - a.count),
    [data],
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        <div
          ref={wrapRef}
          style={{
            position: "relative",
            width: isDesktop ? "fit-content" : "100%",
            margin: "0 auto",
          }}
        >
          <ComposableMap
            projection={projection as any}
            width={W}
            height={H}
            style={
              isDesktop
                ? { height: mapHeight, width: "auto", maxWidth: "100%", display: "block" }
                : { width: "100%", height: "auto", display: "block" }
            }
          >
            <Geographies geography={sindhGeo as any}>
              {({ geographies }: any) =>
                geographies.map((geo: any) => {
                  const name = geo.properties.name as ShapeName;
                  const count = countByShape.get(name) ?? 0;
                  const label = DISPLAY_NAME[name] ?? name;
                  const [cx, cy] = path.centroid(geo);
                  const area = path.area(geo);
                  const showLabel =
                    Number.isFinite(cx) && Number.isFinite(cy) && area >= MIN_LABEL_AREA;
                  // White text on mid-to-high fills, dark on light fills.
                  const labelFill = count > (max || 1) * 0.35 ? "#fff" : "#2a2a2a";
                  return (
                    <g key={geo.rsmKey}>
                      <Geography
                        geography={geo}
                        fill={colorForCount(count)}
                        stroke={GREEN}
                        strokeWidth={1.6}
                        style={{
                          default: { outline: "none" },
                          hover: {
                            outline: "none",
                            stroke: HOVER_STROKE,
                            strokeWidth: 3,
                            cursor: "pointer",
                          },
                          pressed: { outline: "none" },
                        }}
                        onMouseMove={(e: React.MouseEvent) => {
                          const rect = wrapRef.current?.getBoundingClientRect();
                          setHover({
                            name: label,
                            count,
                            x: e.clientX - (rect?.left ?? 0),
                            y: e.clientY - (rect?.top ?? 0),
                          });
                        }}
                        onMouseLeave={() => setHover(null)}
                      />
                      {showLabel && (
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          style={{ pointerEvents: "none" }}
                        >
                          <tspan
                            x={cx}
                            fontSize={15}
                            fontWeight={500}
                            fill={labelFill}
                          >
                            {label}
                          </tspan>
                          {count > 0 && (
                            <tspan
                              x={cx}
                              dy={17}
                              fontSize={17}
                              fontWeight={700}
                              fill={labelFill}
                            >
                              {count}
                            </tspan>
                          )}
                        </text>
                      )}
                    </g>
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {hover && (
            <div
              style={{
                position: "absolute",
                left: hover.x + 12,
                top: hover.y + 12,
                background: "#fff",
                border: `1px solid ${GREEN_BORDER}`,
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 12,
                pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                whiteSpace: "nowrap",
                zIndex: 5,
              }}
            >
              <div style={{ fontWeight: 600, color: "#1a3d2b" }}>{hover.name}</div>
              <div style={{ color: "#555" }}>
                {hover.count} patient{hover.count === 1 ? "" : "s"}
              </div>
            </div>
          )}

          {/* Legend */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 11, color: "#888" }}>0</Text>
            <div
              style={{
                flex: "0 0 160px",
                height: 10,
                borderRadius: 5,
                background: `linear-gradient(90deg, ${NO_DATA} 0%, ${PALETTE.join(", ")})`,
                border: `1px solid ${GREEN_BORDER}`,
              }}
            />
            <Text style={{ fontSize: 11, color: "#888" }}>{max || 0}</Text>
            <Text style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>
              patients
            </Text>
          </div>
        </div>
      </div>

      {/* ── District list (desktop only) ────────────────────────────────── */}
      {isDesktop && (
      <div
        style={{
          flex: "1 1 240px",
          minWidth: 220,
          maxHeight: mapHeight + 40,
          overflowY: "auto",
          border: `1px solid ${GREEN_BORDER}`,
          borderRadius: 10,
          padding: "6px 0",
        }}
      >
        <div
          style={{
            padding: "6px 14px",
            fontSize: 11,
            fontWeight: 600,
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: 0.4,
            borderBottom: `1px solid ${GREEN_BORDER}`,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>District</span>
          <span>Patients</span>
        </div>

        {ranked.length === 0 && (
          <div style={{ padding: "14px", fontSize: 13, color: "#999" }}>
            No district data for the current filters.
          </div>
        )}

        {ranked.map((d) => (
          <div
            key={d.districtName}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              fontSize: 13,
              borderBottom: "1px solid #f3f7f4",
            }}
          >
            <span
              style={{
                flex: "0 0 12px",
                width: 12,
                height: 12,
                borderRadius: 3,
                background: colorForCount(d.count),
                border: `1px solid ${GREEN_BORDER}`,
              }}
            />
            <span style={{ flex: 1, color: "#1a3d2b" }}>{d.districtName}</span>
            <span style={{ fontWeight: 600, color: "#1a3d2b" }}>{d.count}</span>
          </div>
        ))}

        {unmapped.length > 0 && (
          <div style={{ padding: "8px 14px", fontSize: 11, color: "#c47" }}>
            Unmapped: {unmapped.map((u) => `${u.districtName} (${u.count})`).join(", ")}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default SindhDistrictMap;
