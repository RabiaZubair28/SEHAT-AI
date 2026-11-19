import React from "react";
import { Col, Row } from "antd";
import type { Dayjs } from "dayjs";
import {
  TeamOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";

import DashboardCard  from "./shared/DashboardCard";
import MetricCard     from "./shared/MetricCard";
import SectionHeading from "./shared/SectionHeading";
import { SERVICE_LABELS } from "./shared/constants";
import { isToday, dayLabel } from "@/utils/formats/dateFormatters";
import type { LivePatientFlow as LivePatientFlowType } from "../../services/dashboardService";

interface Props {
  data: LivePatientFlowType;
  date: Dayjs;
}

const STRINGS = {
  title: (d: Dayjs) =>
    isToday(d) ? "Live Patient Flow (Today)" : `Patient Flow (${dayLabel(d)})`,
  subtitle: (d: Dayjs) =>
    isToday(d) ? "Real-time visits for today" : `Visits recorded on ${dayLabel(d)}`,
  totalVisitsLabel: (d: Dayjs) =>
    isToday(d) ? "Total Patient Visits Today" : "Total Patient Visits",
};

const LivePatientFlow: React.FC<Props> = ({ data, date }) => {
  const serviceSubRows = Object.entries(data.visitsByServiceToday)
    .filter(([, v]) => v > 0)
    .map(([key, val]) => ({ label: SERVICE_LABELS[key] ?? key, value: val }));

  return (
    <div>
      <SectionHeading
        title={STRINGS.title(date)}
        subtitle={STRINGS.subtitle(date)}
      />
      <Row gutter={[16, 16]} align="stretch">
        {/* Total visits — with service breakdown */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label={STRINGS.totalVisitsLabel(date)}
              value={data.totalVisitsToday}
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
              label="Visits Completed"
              value={data.visitsCompletedToday}
              icon={<CheckCircleOutlined />}
            />
          </DashboardCard>
        </Col>

        {/* In queue */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label="Currently in Queue"
              value={data.currentlyInQueue}
              icon={<ClockCircleOutlined />}
              warning
            />
          </DashboardCard>
        </Col>

        {/* Unassigned */}
        <Col xs={24} sm={12} lg={6} style={{ display: "flex" }}>
          <DashboardCard style={{ width: "100%" }}>
            <MetricCard
              label="Unassigned Patients"
              value={data.unassignedPatients}
              icon={<ExclamationCircleOutlined />}
              danger
            />
          </DashboardCard>
        </Col>
      </Row>
    </div>
  );
};

export default LivePatientFlow;