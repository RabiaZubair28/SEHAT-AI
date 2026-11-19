import { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { geoMercator } from "d3-geo";
import sindhGeo from "@/features/admin/reports/data/sindhDistricts.json";

// Portrait box — Sindh is taller than it is wide (matches the reports map).
const W = 560;
const H = 680;

// Illustrative facility clusters across major Sindh cities [lng, lat].
const FACILITIES: Array<[number, number]> = [
  [67.01, 24.86], // Karachi
  [68.37, 25.38], // Hyderabad
  [68.85, 27.7], // Sukkur
  [68.21, 27.56], // Larkana
  [68.41, 26.24], // Nawabshah
  [69.01, 25.53], // Mirpur Khas
  [68.64, 27.96], // Shikarpur
];

export const CoverageMap = () => {
  const projection = useMemo(
    () => geoMercator().fitSize([W, H], sindhGeo as any),
    [],
  );

  return (
    <ComposableMap
      projection={projection as any}
      width={W}
      height={H}
      style={{ width: "100%", height: "auto", overflow: "visible" }}
    >
      <Geographies geography={sindhGeo as any}>
        {({ geographies }: any) =>
          geographies.map((geo: any) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="rgba(255,255,255,0.10)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
              style={{
                default: { outline: "none", transition: "fill 0.25s ease" },
                hover: {
                  fill: "rgba(255,255,255,0.26)",
                  outline: "none",
                  cursor: "pointer",
                },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {FACILITIES.map(([lng, lat], i) => (
        <Marker key={i} coordinates={[lng, lat]}>
          <circle
            r={5}
            fill="rgba(167,243,208,0.7)"
            className="coverage-ping"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
          <circle r={3.4} fill="#ffffff" />
        </Marker>
      ))}
    </ComposableMap>
  );
};
