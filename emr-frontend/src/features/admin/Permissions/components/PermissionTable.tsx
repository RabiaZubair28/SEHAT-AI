import { useCreateRolePermissionMutation } from "../../services/createPermissionApi";
import PermissionCollapse from "../../common/PermissionCollapse";
import { useGetRolePermissionsQuery } from "../../services/rolePermissionsApi";
import { Route as RouteItem } from "@/data/types";
import Loader from "@/components/shared/Loader";

interface PermissionTableProps {
  selectedRoleId: number | null;
  selectedGuards: string[] | [];
  isAdminRole: boolean;
  isFacilityInchargeRole: boolean;
}

const PermissionTable: React.FC<PermissionTableProps> = ({
  selectedRoleId,
  selectedGuards,
  isAdminRole,
  isFacilityInchargeRole,
}) => {
  const [createRolePermission, { isLoading }] =
    useCreateRolePermissionMutation();

  const { data: allPermissions, refetch } = useGetRolePermissionsQuery();

  const existingPermissions =
    selectedRoleId && allPermissions
      ? allPermissions.find((perm) => perm.role.id === selectedRoleId)
          ?.payload || []
      : [];

  const handleSave = (id: number, payload: RouteItem[]): Promise<any> => {
    return createRolePermission({ roleId: id, payload }).unwrap();
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <PermissionCollapse
      targetId={selectedRoleId}
      onSave={handleSave}
      isSaving={isLoading}
      label="role"
      existingPermissions={existingPermissions}
      refetchRolePermissions={refetch}
      selectedRoleGuards={selectedGuards}
      isAdminRole={isAdminRole}
      isFacilityInchargeRole={isFacilityInchargeRole}
    />
  );
};

export default PermissionTable;
