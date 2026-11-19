import React from "react";
import { Col, Row } from "antd";
import type { Dayjs } from "dayjs";
import {
  TeamOutlined, CheckCircleOutlined,
  UserAddOutlined, RiseOutlined,
} from "@ant-design/icons";

import DashboardCard  from "./shared/DashboardCard";
import MetricCard     from "./shared/MetricCard";
import SectionHeading from "./shared/SectionHeading";
import { dimWhen } from "./shared/dimWhen";
import ServiceVisitsChart from "./shared/ServiceVisitsChart";
import { GREEN, SERVICE_LABELS, SERVICE_COLORS } from "./shared/constants";
import {
  isCurrentMonth,
  monthLabel,
  monthRangeLabel,
} from "@/utils/formats/dateFormatters";
import type { MonthlyPatientFlow as MonthlyPatientFlowType } from "../../services/dashboardService";

interface Props {
  data: MonthlyPatientFlowType;
  date: Dayjs;
  isLoading: boolean;
}

const STRINGS = {
  title: (d: Dayjs) =>
    isCurrentMonth(d) ? "Patient Flow (This Month)" : `Patient Flow (${monthLabel(d)})`,
  subtitle: (d: Dayjs) =>
    isCurrentMonth(d)
      ? "Aggregated from the 1st of the current month to today"
      : `Aggregated from ${monthRangeLabel(d)}`,
  totalVisitsLabel: (d: Dayjs) =>
    isCurrentMonth(d) ? "Total Visits This Month" : `Total Visits (${monthLabel(d)})`,
};

const MonthlyPatientFlow: React.FC<Props> = ({ data, date, isLoading }) => {
  const chartData = Object.entries(data.visitsByServiceThisMonth)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name:  SERVICE_LABELS[key] ?? key,
      value,
      color: SERVICE_COLORS[key] ?? GREEN,
    }));

  const serviceSubRows = Object.entries(data.visitsByServiceThisMonth)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => ({ label: SERVICE_LABELS[key] ?? key, value: val }));

  return (
    <div style={dimWhen(isLoading)}>
      <SectionHeading
        title={STRINGS.title(date)}
        subtitle={STRINGS.subtitle(date)}
      />
      <Row gutter={[16, 16]} align="stretch">
        {/* Total visits with service breakdown */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label={STRINGS.totalVisitsLabel(date)}
              value={data.totalVisitsThisMonth}
              icon={<TeamOutlined />}
              highlight
              subRows={serviceSubRows}
            />
          </DashboardCard>
        </Col>

        {/* Completed */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label="Visits Completed (Month)"
              value={data.visitsCompletedThisMonth}
              icon={<CheckCircleOutlined />}
            />
          </DashboardCard>
        </Col>

        {/* New registrations */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label="New Registrations"
              value={data.newRegistrationsThisMonth}
              icon={<UserAddOutlined />}
            />
          </DashboardCard>
        </Col>

        {/* Avg daily */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label="Avg. Daily Visits"
              value={data.avgDailyVisitsThisMonth}
              icon={<RiseOutlined />}
            />
          </DashboardCard>
        </Col>

        {/* Service breakdown bar chart */}
        <Col xs={24}>
          <ServiceVisitsChart title="Monthly Visits by Service Type" data={chartData} />
        </Col>
      </Row>
    </div>
  );
};

export default MonthlyPatientFlow;