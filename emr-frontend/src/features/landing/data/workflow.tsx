import {
  UserAddOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

export const workflow = [
  {
    icon: <UserAddOutlined />,
    step: "01",
    title: "Register",
    description:
      "Front desk captures a unified patient profile in seconds — no duplicates across the province.",
  },
  {
    icon: <HeartOutlined />,
    step: "02",
    title: "Triage & Vitals",
    description:
      "Structured vitals intake routes the patient to the right service queue automatically.",
  },
  {
    icon: <MedicineBoxOutlined />,
    step: "03",
    title: "Clinical Care",
    description:
      "Doctors, LHVs and vaccinators document each encounter with guided, role-specific flows.",
  },
  {
    icon: <FileDoneOutlined />,
    step: "04",
    title: "Dispense & Report",
    description:
      "Medicines are dispensed against live inventory, while reports flow to district leadership.",
  },
];
