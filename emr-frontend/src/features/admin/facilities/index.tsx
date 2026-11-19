import React from "react";
import FacilitiesTable from "./components/Facilities";
import TopBar from "@/components/ui/TopBar";

const Facilities: React.FC = () => {
  return (
    <div>
      <TopBar title="Facilities Management" />
      <br />
      <br />
      <FacilitiesTable />
    </div>
  );
};

export default Facilities;
