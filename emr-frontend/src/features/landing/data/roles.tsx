import {
  UserOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

export const roles = [
  {
    icon: <UserOutlined />,
    title: "Registration Clerks",
    description:
      "Register patients and manage the front-desk queue with a unified provincial identifier.",
  },
  {
    icon: <MedicineBoxOutlined />,
    title: "Doctors & Medical Officers",
    description:
      "Run OPD consultations with guided vitals, diagnoses and prescription capture.",
  },
  {
    icon: <HeartOutlined />,
    title: "LHVs & Midwives",
    description:
      "Deliver structured ANC, PNC and family-planning care with follow-up tracking.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Vaccinators",
    description:
      "Administer and track immunizations with catch-up logic built on the EPI schedule.",
  },
  {
    icon: <ExperimentOutlined />,
    title: "Dispensers",
    description:
      "Dispense medicines against live inventory with a complete audit trail.",
  },
  {
    icon: <BarChartOutlined />,
    title: "Facility & District Admins",
    description:
      "Monitor performance and pull facility-level reports across the network.",
  },
];
