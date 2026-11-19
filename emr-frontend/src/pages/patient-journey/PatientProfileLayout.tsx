import React from "react";
import PatientProfileLayout from "@/components/layout/PatientProfileLayout";
import { Outlet } from "react-router-dom";

const PatientProfileLayoutPage: React.FC = () => {
  return (
    <div>
      <PatientProfileLayout>
        <Outlet />
      </PatientProfileLayout>
    </div>
  );
};

export default PatientProfileLayoutPage;
