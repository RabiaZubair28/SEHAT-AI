import React from "react";
import { Typography } from "antd";
import type { BarShapeProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardCard from "./DashboardCard";
import { GREEN_SOFT } from "./constants";

const { Text } = Typography;

export interface ServiceVisitsDatum {
  name: string;
  value: number;
  color: string;
}

interface Props {
  title: string;
  data: ServiceVisitsDatum[];
}

const renderBar = (props: BarShapeProps) => (
  <Rectangle {...props} fill={(props.payload as ServiceVisitsDatum).color} />
);

const ServiceVisitsChart: React.FC<Props> = ({ title, data }) => (
  <DashboardCard>
    <Text
      strong
      style={{
        fontSize: 13,
        color: "#1a3d2b",
        display: "block",
        marginBottom: 16,
        marginTop: 8,
        marginLeft: 8,
      }}
    >
      {title}
    </Text>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        barSize={36}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#888" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#888" }}
          allowDecimals={false}
        />
        <RTooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #deeee5",
            fontSize: 13,
          }}
          cursor={{ fill: GREEN_SOFT }}
        />
        <Bar
          dataKey="value"
          radius={[6, 6, 0, 0]}
          name="Visits"
          shape={renderBar}
        />
      </BarChart>
    </ResponsiveContainer>
  </DashboardCard>
);

export default ServiceVisitsChart;
