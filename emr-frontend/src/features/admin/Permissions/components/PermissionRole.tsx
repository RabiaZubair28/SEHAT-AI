import React, { useState, useMemo } from "react";
import { Button, Spin, Alert } from "antd";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import { useGetRolesQuery } from "@/services/roleApiServices";
import { Roles } from "@/data/types";
import {
  formatRolesToOptions,
} from "@/utils/formats/rolesFormatter";

interface PermissionRoleProps {
  onRoleChange: (
    roleId: number | null,
    guards: string[] | [],
    isAdmin: boolean,
    isFacilityIncharge: boolean
  ) => void;
}

const PermissionRole: React.FC<PermissionRoleProps> = ({ onRoleChange }) => {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const [role, setRole] = useState<number | undefined>(undefined);

  const roleOptions = useMemo(() => {
    return formatRolesToOptions(roles)
  }, [roles]);

  const handleRoleChange = (roleId: number) => {
    setRole(roleId);
    const selectedRole = roles?.find((r) => r.id === roleId);
    if (selectedRole) {
      const guards = selectedRole.guards || [];
      const isAdmin = selectedRole.name === Roles.ADMIN;
      const isFacilityIncharge = selectedRole.name === Roles.FACILITY_INCHARGE;
      onRoleChange(roleId, guards, isAdmin, isFacilityIncharge);
    } else {
      onRoleChange(null, [], false, false);
    }
  };

  const handleCancel = () => {
    setRole(undefined);
    onRoleChange(null, [], false, false);
  };

  return (
    <div className="grid grid-cols-12 gap-4 mb-4">
      <div className="col-span-6">
        {isLoading ? (
          <Spin />
        ) : isError ? (
          <Alert message="Error loading roles" type="error" showIcon />
        ) : roleOptions.length === 0 ? (
          <Alert message="No roles available" type="warning" showIcon />
        ) : (
          <SingleSelectDropDown
            options={roleOptions}
            onChange={(selected) => handleRoleChange(selected as number)}
            placeholder="Select role"
            notWrappedInForm
            value={role}
          />
        )}
      </div>

      <div className="flex gap-1.5 col-span-6">
        <Button type="default" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PermissionRole;
