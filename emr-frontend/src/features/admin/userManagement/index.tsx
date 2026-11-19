import React from "react";
import UserManagementTable from "./components/UserManagement";
import TopBar from "@/components/ui/TopBar";

const UserManagement: React.FC = () => {
  return (
    <div>
      <TopBar title="Users Management" />
      <br />
      <br />
      <UserManagementTable />
    </div>
  );
};

export default UserManagement;
