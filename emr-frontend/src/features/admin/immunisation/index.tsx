import React from "react";
import ImmunisationTable from "./components/ImmunisationTable";
import TopBar from "@/components/ui/TopBar";

const ApplyLeave: React.FC = () => {
  return (
    <div>
      <TopBar title="Immunisation Remarks" />
      <br />
      <br />
      <ImmunisationTable />
    </div>
  );
};

export default ApplyLeave;
