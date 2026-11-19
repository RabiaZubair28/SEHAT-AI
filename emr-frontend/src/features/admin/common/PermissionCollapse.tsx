import React, { useState, useEffect, useMemo } from "react";
import { Collapse, Checkbox, Alert, Button, Tooltip } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useGetRoutesQuery } from "@/services/routesApiService";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  PermissionPayloadItemSlim,
  Route as RouteItem,
} from "@/data/types";
import Loader from "@/components/shared/Loader";

interface PermissionCollapseProps {
  targetId: number | null;
  onSave: (
    id: number,
    permissions: RouteItem[],
    status?: string,
  ) => Promise<any>;
  isSaving?: boolean;
  isExternalLoading?: boolean;
  label?: "user" | "role";
  defaultPermissions?: PermissionPayloadItemSlim[];
  existingPermissions?: RouteItem[];
  approvalStatus?: string | "";
  refetchRolePermissions?: () => void;
  selectedRoleGuards?: string[];
  isAdminRole?: boolean;
  isFacilityInchargeRole?: boolean;
}

const PermissionCollapse: React.FC<PermissionCollapseProps> = ({
  targetId,
  onSave,
  isSaving = false,
  isExternalLoading = false,
  label = "role",
  defaultPermissions = [],
  existingPermissions,
  approvalStatus,
  refetchRolePermissions,
  selectedRoleGuards = [],
  isAdminRole = false,
  isFacilityInchargeRole = false,
}) => {
  const showNotification = useGlobalNotification();
  const [checkedRoutes, setCheckedRoutes] = useState<Record<string, boolean>>(
    {},
  );
  const { data: routes, isLoading: isRoutesLoading, isError, error } =
    useGetRoutesQuery();
  const [filteredRoutes, setFilteredRoutes] = useState<RouteItem[]>([]);

  const isUserLabel = label === "user";
  const defaultRouteKeys = useMemo(() => {
    return new Set(
      defaultPermissions.map((perm) => `${perm.route}=${perm.method}`),
    );
  }, [defaultPermissions]);

  const isDefaultRoute = (key: string) =>
    isUserLabel && defaultRouteKeys.has(key);

  useEffect(() => {
    if (!routes) return;

    const enrichedRoutes = routes.map((route) => ({
      ...route,
      guards: route.guards || [],
    }));

    const hiddenFilteredRoutes = enrichedRoutes.filter((route) => {
      if (!route.hidden || !Array.isArray(route.hidden)) {
        return true;
      }

      if (isAdminRole) {
        return !route.hidden.includes("Admin");
      } else {
        return !route.hidden.includes("User");
      }
    });

    if (!selectedRoleGuards.length) {
      setFilteredRoutes(hiddenFilteredRoutes);
      return;
    }

    const guardsFilteredRoutes = hiddenFilteredRoutes.filter((route) => {
      if (!route.guards || route.guards.length === 0) {
        return true;
      }

      const hasFacilityGuard = route.guards.includes("FacilityInchargeGuard");
      const hasAdminGuard = route.guards.includes("JwtAdminAuthGuard");
      const hasUserGuard = route.guards.includes("JwtUserAuthGuard");
      const hasOrGuard = route.guards.includes("JwtOrAuthGuard");

      if (hasOrGuard) {
        return true;
      }

      if (isFacilityInchargeRole) {
        return hasFacilityGuard || hasAdminGuard;
      }

      if (isAdminRole) {
        if (hasFacilityGuard && !hasAdminGuard && !hasUserGuard) {
          return false;
        }
        return hasAdminGuard;
      }

      return route.guards.some((guard) => selectedRoleGuards.includes(guard));
    });

    setFilteredRoutes(guardsFilteredRoutes);
  }, [routes, selectedRoleGuards, isAdminRole, isFacilityInchargeRole]);

  useEffect(() => {
    if (!filteredRoutes || !existingPermissions) {
      setCheckedRoutes({});
      return;
    }

    const defaultChecked: Record<string, boolean> = {};
    existingPermissions.forEach((perm) => {
      const match = filteredRoutes.find(
        (r) => r.route === perm.route && r.method === perm.method,
      );
      if (match) {
        const key = `${match.route}=${match.method}`;
        defaultChecked[key] = true;
      }
    });

    setCheckedRoutes(defaultChecked);
  }, [filteredRoutes, existingPermissions, targetId]);

  const handleCheckboxChange = (routeKey: string) => {
    if (isDefaultRoute(routeKey)) {
      return;
    }
    setCheckedRoutes((prev) => ({
      ...prev,
      [routeKey]: !prev[routeKey],
    }));
  };

  const handleSelectAll = (routes: RouteItem[], checked: boolean) => {
    const updates: Record<string, boolean> = {};
    routes.forEach((route) => {
      const key = `${route.route}=${route.method}`;
      if (isDefaultRoute(key)) {
        return;
      }
      updates[key] = checked;
    });

    setCheckedRoutes((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSavePermissions = async () => {
    if (!targetId) {
      showNotification(
        "error",
        `Please select a ${label} before saving permissions.`,
      );
      return;
    }

    const selectedPermissions: RouteItem[] = Object.entries(checkedRoutes)
      .filter(([_, isChecked]) => isChecked)
      .map(([routeKey]) => {
        const [route, method] = routeKey.split("=");
        return filteredRoutes?.find(
          (r) => r.route === route && r.method === method,
        )!;
      })
      .filter(Boolean);

    if (approvalStatus !== "rejected" && selectedPermissions.length === 0) {
      showNotification("warning", "Please select at least one permission.");
      return;
    }

    if (label == "user" && !approvalStatus) {
      showNotification("error", "Status is required");
      return;
    }

    try {
      await onSave(targetId, selectedPermissions, approvalStatus);
      if (label == "role") {
        refetchRolePermissions?.();
      }
      showNotification("success", "Permissions saved successfully.");
    } catch (err) {
      const errorMsg =
        (err as any)?.data?.message || "Failed to save permissions.";
      showNotification("error", errorMsg);
    }
  };

  if (isError) {
    const apiError = error as {
      status: number;
      data?: { error?: string; message?: string };
    };

    const errorTitle = apiError?.data?.error || "Error";
    const errorDescription = apiError?.data?.message || "Something went wrong.";

    showNotification("error", `${errorTitle}: ${errorDescription}`);
    return <Alert message="Failed to load routes" type="error" showIcon />;
  }

  const groupedData = filteredRoutes.reduce(
    (acc, curr) => {
      acc[curr.module] = acc[curr.module] || [];
      acc[curr.module].push(curr);
      return acc;
    },
    {} as Record<string, RouteItem[]>,
  );

  const collapseItems = Object.entries(groupedData).map(
    ([moduleName, moduleRoutes]) => {
      const allChecked = moduleRoutes.every(
        (r) =>
          checkedRoutes[`${r.route}=${r.method}`] ||
          isDefaultRoute(`${r.route}=${r.method}`),
      );
      const someChecked = moduleRoutes.some(
        (r) =>
          checkedRoutes[`${r.route}=${r.method}`] ||
          isDefaultRoute(`${r.route}=${r.method}`),
      );

      return {
        key: moduleName,
        label: moduleName,
        children: (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Checkbox
                indeterminate={!allChecked && someChecked}
                checked={allChecked}
                onChange={(e) =>
                  handleSelectAll(moduleRoutes, e.target.checked)
                }
              >
                Select All
              </Checkbox>
            </div>

            {moduleRoutes.map((route) => {
              const key = `${route.route}=${route.method}`;
              const isDefault = isDefaultRoute(key);
              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid #f0f0f0",
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 6,
                  }}
                >
                  <Tooltip
                    title={
                      isDefault
                        ? "Required by default for this role"
                        : undefined
                    }
                  >
                    <Checkbox
                      disabled={isDefault}
                      checked={!!checkedRoutes[key] || isDefault}
                      onChange={() => handleCheckboxChange(key)}
                    >
                      <strong>
                        {route.name}
                        {isDefault && (
                          <LockOutlined
                            style={{ marginLeft: 6, color: "#bfbfbf" }}
                          />
                        )}
                      </strong>
                    </Checkbox>
                  </Tooltip>
                  <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                    {route.method} — {route.route}
                  </div>
                  {route.description && (
                    <div style={{ fontSize: 14, marginTop: 6 }}>
                      {route.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ),
      };
    },
  );

    if (isExternalLoading || isRoutesLoading || isSaving) {
    return <Loader />;
  }

  return (
    <div>
      {!(label === "user" && approvalStatus === "rejected") && (
        <Collapse accordion items={collapseItems} />
      )}

      <div style={{ marginTop: 20, textAlign: "right" }}>
        <Button
          type="primary"
          onClick={handleSavePermissions}
          loading={isSaving}
        >
          {!(label === "user" && approvalStatus === "rejected")
            ? "Save Permissions"
            : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default PermissionCollapse;
