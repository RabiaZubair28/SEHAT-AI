import {
  TeamOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";

export const features = [
  {
    icon: <TeamOutlined />,
    title: "Patient Registration",
    description:
      "Streamlined intake with unified patient identifiers across all Sindh facilities.",
    tint: "from-emerald-50 to-emerald-100",
  },
  {
    icon: <HeartOutlined />,
    title: "ANC & PNC Care",
    description:
      "Structured antenatal and postnatal workflows aligned with national guidelines.",
    tint: "from-rose-50 to-rose-100",
  },
  {
    icon: <MedicineBoxOutlined />,
    title: "OPD Consultations",
    description:
      "Capture vitals, diagnoses, and prescriptions in a single guided flow.",
    tint: "from-sky-50 to-sky-100",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Immunization",
    description:
      "Schedule, dose tracking, and catch-up logic built around the EPI schedule.",
    tint: "from-amber-50 to-amber-100",
  },
  {
    icon: <DatabaseOutlined />,
    title: "Inventory & Dispensing",
    description:
      "Real-time medicine batches, requisitions, and dispensing audit trail.",
    tint: "from-indigo-50 to-indigo-100",
  },
  {
    icon: <ScheduleOutlined />,
    title: "Referrals & Queue",
    description:
      "Move patients between facilities and providers without losing context.",
    tint: "from-teal-50 to-teal-100",
  },
  {
    icon: <ExperimentOutlined />,
    title: "Family Planning & Nutrition",
    description:
      "Specialized service modules with counselling and follow-up tracking.",
    tint: "from-fuchsia-50 to-fuchsia-100",
  },
  {
    icon: <FileSearchOutlined />,
    title: "Reports & Audit Logs",
    description:
      "Facility-level reporting with full audit trail for every clinical action.",
    tint: "from-slate-100 to-slate-200",
  },
];
