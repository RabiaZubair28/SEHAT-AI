export type ServiceKey =
  | "ANC"
  | "DELIVERY"
  | "PNC"
  | "FAMILY_PLANNING"
  | "IMMUNISATION"
  | "NUTRITION"
  | "OPD"
  | "MEDICINE_DISPENSING";
export interface ServiceConfig {
  name: ServiceKey;
  id: number;
  displayName: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

// src/config/services.ts
import {
  MedicineBoxOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  AppleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { ROUTES } from "@/data/routes";

export const SERVICES: ServiceConfig[] = [
  {
    name: "ANC",
    id: 2,
    displayName: "Antenatal Care",
    route: ROUTES.ANC,
    icon: <MedicineBoxOutlined />,
    color: "#4CAF50",
    description: "Prenatal care for expecting mothers",
  },
  {
    name: "DELIVERY",
    id: 3,
    displayName: "Delivery",
    route: ROUTES.DELIVERY,
    icon: <MedicineBoxOutlined />,
    color: "#2196F3",
    description: "Childbirth and delivery services",
  },
  {
    name: "PNC",
    id: 4,
    displayName: "Postnatal Care",
    route: ROUTES.PNC,
    icon: <HeartOutlined />,
    color: "#E91E63",
    description: "Post-delivery care for mothers and babies",
  },
  {
    name: "FAMILY_PLANNING",
    id: 5,
    displayName: "Family Planning",
    route: ROUTES.FAMIlY_PLANNING,
    icon: <TeamOutlined />,
    color: "#9C27B0",
    description: "Contraception and reproductive health services",
  },
  {
    name: "IMMUNISATION",
    id: 6,
    displayName: "Immunisation",
    route: ROUTES.IMMUNIZATION,
    icon: <SafetyCertificateOutlined />,
    color: "#FF9800",
    description: "Vaccination services for all ages",
  },
  {
    name: "NUTRITION",
    id: 7,
    displayName: "Nutrition",
    route: ROUTES.NUTRITION,
    icon: <AppleOutlined />,
    color: "#795548",
    description: "Nutritional counseling and support",
  },
  {
    name: "OPD",
    id: 1,
    displayName: "Outpatient Dept",
    route: ROUTES.OPD,
    icon: <MedicineBoxOutlined />,
    color: "#607D8B",
    description: "General outpatient services",
  },
  {
    name: "MEDICINE_DISPENSING",
    id: 16,
    displayName: "Medicine Dispensing",
    route: ROUTES.MEDICINE_DISPENSING,
    icon: <MedicineBoxOutlined />,
    color: "#607D8B",
    description: "Distribution of prescribed medicines",
  },
];
