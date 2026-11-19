import React, { useState } from "react";
import { Typography, Empty } from "antd";
import ReportSelector from "./components/ReportSelector";
import AllPatientsReport from "./components/AllPatientsReport";
import SinglePatientReport from "./components/SinglePatientReport";
import ServiceReport from "./components/ServiceReport";
import MedicineReport from "./components/MedicineReport";
import DoctorReport from "./components/DoctorReport";
import ImmunizationReport from "./components/ImmunizationReport";
import DeliveryReport from "./components/DeliveryReport";

const { Title, Text } = Typography;

const REPORT_MAP: Record<string, React.ReactNode> = {
  all_patients: <AllPatientsReport  />,
  single_patient: <SinglePatientReport  />,
  service: <ServiceReport  />,
  medicine: <MedicineReport />,
  doctor: <DoctorReport  />,
  immunization: <ImmunizationReport />,
  delivery: <DeliveryReport />,
};

const AdminReports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  return (
    <div
      data-page-bg="tint"
      style={{
        minHeight: "100vh",
        background: "var(--bg-tint)",
        padding: "8px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title
          level={3}
          style={{ margin: 0, color: "#0d2b1a", fontWeight: 700 }}
        >
          Reports
        </Title>
        <Text style={{ color: "#5a8a6a", fontSize: 14 }}>
          Select a report type to view filtered data and export records
        </Text>
      </div>

      {/* Report Type Cards */}
      <ReportSelector selected={activeReport} onSelect={setActiveReport} />

      {/* Active Report Panel */}
      {activeReport ? (
        REPORT_MAP[activeReport]
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1.5px dashed #c3dece",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text
                  style={{ color: "#5a8a6a", fontSize: 15, display: "block" }}
                >
                  Select a report type above to get started
                </Text>
                <Text style={{ color: "#9dbfa9", fontSize: 13 }}>
                  7 report types · PDF &amp; Excel export · Date filters
                </Text>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default AdminReports;
