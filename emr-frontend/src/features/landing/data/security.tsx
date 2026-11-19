import {
  LockOutlined,
  AuditOutlined,
  SafetyOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";

export const securityItems = [
  {
    icon: <LockOutlined />,
    title: "Role-Based Access",
    description:
      "Every user sees only what their role allows — from front desk to district leadership.",
  },
  {
    icon: <AuditOutlined />,
    title: "Full Audit Trail",
    description:
      "Every clinical action is time-stamped and attributable, end to end.",
  },
  {
    icon: <SafetyOutlined />,
    title: "Encrypted Records",
    description:
      "Patient data is encrypted in transit and at rest across the province.",
  },
  {
    icon: <CloudServerOutlined />,
    title: "Government-Hosted",
    description:
      "Hosted on Government of Sindh infrastructure — data never leaves the province.",
  },
];
