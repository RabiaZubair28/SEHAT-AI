import React, { useState } from "react";
import TopBar from "@/components/ui/TopBar";
import PermissionTable from "./components/PermissionTable";
import PermissionRole from "./components/PermissionRole";

const Permissions: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [guards, setGuards] = useState<string[] | []>([]);
  const [isAdminRole, setIsAdminRole] = useState<boolean>(false);
  const [isFacilityInchargeRole, setIsFacilityInchargeRole] =
    useState<boolean>(false);

  const handleRoleChange = (
    roleId: number | null,
    guards: string[] | [],
    isAdmin: boolean,
    isFacilityIncharge: boolean
  ) => {
    setSelectedRoleId(roleId);
    setGuards(guards);
    setIsAdminRole(isAdmin);
    setIsFacilityInchargeRole(isFacilityIncharge);
  };

  return (
    <div>
      <TopBar title="Access Management" />
      <br />
      <br />
      <PermissionRole onRoleChange={handleRoleChange} />
      <br />
      <PermissionTable
        selectedRoleId={selectedRoleId}
        selectedGuards={guards}
        isAdminRole={isAdminRole}
        isFacilityInchargeRole={isFacilityInchargeRole}
      />
    </div>
  );
};

export default Permissions;
