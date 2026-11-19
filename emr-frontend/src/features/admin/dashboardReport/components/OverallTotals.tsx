import React from "react";
import { Alert, Col, Row } from "antd";
import {
  CheckCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import DashboardCard from "./shared/DashboardCard";
import MetricCard from "./shared/MetricCard";
import SectionHeading from "./shared/SectionHeading";
import { dimWhen } from "./shared/dimWhen";
import ServiceVisitsChart from "./shared/ServiceVisitsChart";
import { GREEN, SERVICE_COLORS, SERVICE_LABELS } from "./shared/constants";
import type { OverallTotals as OverallTotalsType } from "../../services/dashboardService";

interface Props {
  data?: OverallTotalsType;
  isError: boolean;
  isLoading: boolean;
}

const PLACEHOLDER = "—";

const STRINGS = {
  title: "Overall",
  subtitle: "Lifetime totals for the selected scope",
};

const colorForLabel = (label: string) => {
  const key = Object.keys(SERVICE_LABELS).find(
    (k) => SERVICE_LABELS[k] === label,
  );
  return (key && SERVICE_COLORS[key]) || GREEN;
};

const OverallTotals: React.FC<Props> = ({ data, isError, isLoading }) => {
  const chartData = (data?.totalVisitsByService ?? [])
    .filter((s) => s.value > 0)
    .map((s) => ({
      name: s.label,
      value: s.value,
      color: colorForLabel(s.label),
    }));

  return (
    <div style={dimWhen(isLoading)}>
      <SectionHeading title={STRINGS.title} subtitle={STRINGS.subtitle} />
      {isError ? (
        <Alert type="error" showIcon message="Couldn't load overall totals" />
      ) : (
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
            <DashboardCard style={{ width: "100%" }}>
              <MetricCard
                label="Total Visits"
                value={data?.totalVisits ?? PLACEHOLDER}
                icon={<TeamOutlined />}
                subRows={data?.totalVisitsByService}
                highlight
              />
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
            <DashboardCard style={{ width: "100%" }}>
              <MetricCard
                label="Total Visits Completed"
                value={data?.totalVisitsCompleted ?? PLACEHOLDER}
                icon={<CheckCircleOutlined />}
              />
            </DashboardCard>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
            <DashboardCard style={{ width: "100%" }}>
              <MetricCard
                label="Total Registrations"
                value={data?.totalRegistrations ?? PLACEHOLDER}
                icon={<UserAddOutlined />}
              />
            </DashboardCard>
          </Col>
          <Col xs={24}>
            <ServiceVisitsChart
              title="Overall Visits by Service Type"
              data={chartData}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default OverallTotals;
