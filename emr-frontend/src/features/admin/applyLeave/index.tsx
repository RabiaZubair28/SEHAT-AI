import React from "react";
import UserManagementTable from "./components/ApplyLeave";
import TopBar from "@/components/ui/TopBar";

const ApplyLeave: React.FC = () => {
  return (
    <div>
      <TopBar title="Users Management" />
      <br />
      <br />
      <UserManagementTable />
    </div>
  );
};

export default ApplyLeave;
