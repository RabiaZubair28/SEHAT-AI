import React from "react";
import TopBar from "@/components/ui/TopBar";
import UserServicesTable from "./components/UserServicesTable";

const UserServices: React.FC = () => {
  return (
    <>
      <TopBar title="Users Services" />
      <br />
      <br />
      <UserServicesTable />
    </>
  );
};

export default UserServices;
