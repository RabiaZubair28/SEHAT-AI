import React, { useState, useEffect, useRef, useMemo } from "react";
import { Table, Button, Modal, Alert, Form, Tag, Tooltip } from "antd";
import {
  PlusOutlined,
  LockOutlined,
  EyeOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import ResetPasswordModal from "./ResetPasswordModal";
import { useGlobalNotification } from "@/hooks/useNotification";
import PermissionCollapse from "../../common/PermissionCollapse";
import useUserFormFields from "./userFormFieldsHook";
import {
  useGetUsersQuery,
  User,
  UserParams,
  useDeleteUserMutation,
  useAddUserMutation,
  useEditUserMutation,
} from "@/features/admin/services/usersApiService";
import {
  PermissionPayloadItemSlim,
  Roles,
  Route as RouteItem,
} from "@/data/types";
import {
  useCreateUserPermissionMutation,
  useLazyGetUserPermissionDefaultsQuery,
} from "../../services/createPermissionApi";
import CustomCollapse, { FieldConfig } from "@/components/shared/AdvanceSearch";
import SingleSelectDropDown from "@/components/ui/SingleSelect";
import {
  approvalOptions,
  userModalConfig,
  UserStatus,
} from "../../data/userManagemenConstants";
import { SIGNUP_MESSAGES } from "@/data/messages";
import { useGetRolesQuery } from "@/services/roleApiServices";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { ROUTES } from "@/data/routes";
import { useLazyGetRolePermissionsByIdQuery } from "../../services/rolePermissionsApi";
import Loader from "@/components/shared/Loader";
import dayjs from "dayjs";
import FormModalWithSteps from "@/components/ui/FormModalWithSteps";
import ImpersonationSno from "@/features/admin/userManagement/components/ImpersonationSno";

const SOCKET_URL = (import.meta.env.APP_URL || window.location.origin).replace(
  /\/$/,
  "",
);

const UserManagementTable: React.FC = () => {
  const [getRolePermissionsById, { isFetching: isRolePermissionsFetching }] =
    useLazyGetRolePermissionsByIdQuery();
  const [getUserPermissionDefaults, {
    isFetching: isUserPermissionDefaultsFetching,
  }] = useLazyGetUserPermissionDefaultsQuery();
  const [defaultRolePermissions, setDefaultRolePermissions] = useState<
    RouteItem[]
  >([]);
  const [defaultUserPermissions, setDefaultUserPermissions] = useState<
    PermissionPayloadItemSlim[]
  >([]);
  const showNotification = useGlobalNotification();
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false);
  const [searchForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState<UserParams>({
    page: 1,
    limit: 10,
    first_name: undefined,
    last_name: undefined,
    email: undefined,
    status: undefined,
    roles: undefined,
  });
  const {
    data: usersResponse,
    isLoading,
    isError,
    isFetching: isFetchingUsers,
    error,
    refetch,
  } = useGetUsersQuery(queryParams);

  const { data: roles } = useGetRolesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isAdmin = location.pathname.includes(ROUTES.ADMIN);
  const user = useSelector((state: RootState) =>
    isAdmin ? state.authAdmin.admin : state.authUser.user,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPermission, setSelectedUserForPermission] =
    useState<User | null>(null);
  const [selectedRoleGuards, setSelectedRoleGuards] = useState<string[]>([]);
  const [isSelectedUserAdminRole, setIsSelectedUserAdminRole] =
    useState<boolean>(false);
  const [isSelectedUserFacilityIncharge, setIsSelectedUserFacilityIncharge] =
    useState<boolean>(false);
  const [createUserPermission, { isLoading: isSavingPermission }] =
    useCreateUserPermissionMutation();
  const addRoleAccess = usePermissionCheck(ROUTE_KEYS.CREATE_A_NEW_ROLE);
  const editUserAccess = usePermissionCheck(ROUTE_KEYS.UPDATE_A_USER_BY_ID);
  // const deletUserAccess = usePermissionCheck(ROUTE_KEYS.DELETE_A_USER_BY_ID);

  //DELETE USER
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [addUser, { isLoading: isAdding }] = useAddUserMutation();
  const [editUser, { isLoading: isEditing }] = useEditUserMutation();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(
    null,
  );
  // The backend only lets super admins reset another user's password.
  const isSuperAdmin = user?.role?.name === Roles.SUPER_ADMIN;
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>();

  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [selectedUserForServices, setSelectedUserForServices] =
    useState<User | null>(null);

  const {
    basicInfoFields,
    personalDetailsFields,
    pagination,
    locationHandlers,
    isLocationLoading,
  } = useUserFormFields(editingUser);

  useEffect(() => {
    refetch();
  }, []);

  // Effect to get the guards for the selected user based on their role
  useEffect(() => {
    if (selectedUserForPermission && roles) {
      // Extract role_id from the selected user
      const roleId = Number(selectedUserForPermission.role_id);

      // Find the matching role from the roles API
      const userRole = roles.find((role) => role.id === roleId);

      // Extract guards from the found role
      if (userRole) {
        if (userRole.guards) {
          setSelectedRoleGuards(userRole.guards);
        } else {
          setSelectedRoleGuards([]);
        }

        setIsSelectedUserAdminRole(userRole.name === Roles.ADMIN);
        setIsSelectedUserFacilityIncharge(
          userRole.name === Roles.FACILITY_INCHARGE,
        );
      } else {
        setSelectedRoleGuards([]);
        setIsSelectedUserAdminRole(false);
        setIsSelectedUserFacilityIncharge(false);
      }
    } else {
      setSelectedRoleGuards([]);
      setIsSelectedUserAdminRole(false);
      setIsSelectedUserFacilityIncharge(false);
    }
  }, [selectedUserForPermission, roles]);

  const roleOptions = useMemo(() => {
    if (!roles) return [];
    return roles
      .filter((role) => role.name !== "super_admin")
      .map((role) => ({
        label: formatRoleName(role.name as Roles),
        value: role.name,
      }));
  }, [roles]);

  const advanceSearchData = useMemo<FieldConfig[]>(
    () => [
      {
        type: "input",
        label: "First Name",
        name: "first_name",
        placeholder: "Search by first name",
      },
      {
        type: "input",
        label: "Last Name",
        name: "last_name",
        placeholder: "Search by last name",
      },
      {
        type: "input",
        label: "Email",
        name: "email",
        placeholder: "Search by email",
      },
      {
        type: "select",
        label: "Role",
        name: "role",
        placeholder: "Select role",
        options: roleOptions,
      },
      {
        type: "select",
        label: "Status",
        name: "status",
        placeholder: "Select status",
        options: [
          { label: "Approved", value: "approved" },
          { label: "Pending", value: "pending" },
          { label: "Rejected", value: "rejected" },
        ],
      },
    ],
    [roleOptions],
  );

  const handleSave = async (
    id: number,
    payload: RouteItem[],
    status?: string,
  ): Promise<any> => {
    const finalPayload = status === "rejected" ? [] : payload;

    try {
      await createUserPermission({
        userId: id,
        payload: finalPayload,
        status: status ?? "",
      }).unwrap();

      closePermissionModal();

      refetch();

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setQueryParams({
      ...queryParams,
      page,
      limit: pageSize || queryParams.limit,
    });
  };

  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      status: values.status,
      roles: values.role ? [values.role] : undefined,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({
      page: 1,
      limit: 10,
      first_name: undefined,
      last_name: undefined,
      email: undefined,
      status: undefined,
      roles: undefined,
    });
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete && typeof userToDelete.id === "number") {
      try {
        await deleteUser(userToDelete.id).unwrap();
        showNotification("success", `${userToDelete.name} has been deleted.`);
        setIsDeleteModalVisible(false);
        refetch();
      } catch (error) {
        showNotification("error", "Failed to delete the user.");
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
  };

  const openPermissionModal = (user: User) => {
    if (user?.status === "pending") {
      setApprovalStatus(undefined);
    } else {
      setApprovalStatus(user?.status);
    }

    setSelectedUserForPermission(user);

    setIsPermissionModalVisible(true);

    if (user.role) {
      getUserPermissionDefaults(user.role)
        .unwrap()
        .then((res) => setDefaultUserPermissions(res || []))
        .catch(() => setDefaultUserPermissions([]));
    } else {
      setDefaultUserPermissions([]);
    }

    if (!user.permissions || user.permissions.length === 0) {
      getRolePermissionsById(Number(user.role_id))
        .unwrap()
        .then((res) => setDefaultRolePermissions(res.payload || []))
        .catch(() => setDefaultRolePermissions([]));
    } else {
      setDefaultRolePermissions([]);
    }
  };

  const closePermissionModal = () => {
    setApprovalStatus(undefined);
    setSelectedUserForPermission(null);
    setDefaultUserPermissions([]);
    setIsPermissionModalVisible(false);
    setIsSelectedUserAdminRole(false);
    setIsSelectedUserFacilityIncharge(false);
  };

  const openServicesModal = (user: User) => {
    setSelectedUserForServices(user);
    setIsServicesModalVisible(true);
  };

  const closeServicesModal = () => {
    setSelectedUserForServices(null);
    setIsServicesModalVisible(false);
  };

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = (user as any).access_token ?? null;

    if (token && !socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
      });

      socketRef.current.on("connect", () => {});

      socketRef.current.on("user_created", () => {
        refetch();
      });

      socketRef.current.on("disconnect", () => {});
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // In UserManagementTable component
  const onSubmit = async (values: User) => {
    try {
      const { dob, ...restValues } = values;
      const formattedDOB = dob ? dayjs(dob).format("YYYY-MM-DD") : null;

      const payload = {
        ...restValues,
        dob: formattedDOB,
        role_id: Number(values.role_id),
        facility_id: Number(values.facility_id),
        division_id: Number(values.division_id),
        district_id: Number(values.district_id),
        taluka_id: Number(values.taluka_id),
        uc_id: Number(values.uc_id),
      };

      let response;
      if (editingUser) {
        payload.id = editingUser.id;
        response = await editUser(payload).unwrap();
      } else {
        response = await addUser(payload).unwrap();
      }

      if (response?.success) {
        // Close modal only on success
        setIsModalOpen(false);
        pagination.reset(); // Reset pagination if needed

        showNotification(
          SIGNUP_MESSAGES.SUCCESS.type,
          SIGNUP_MESSAGES.SUCCESS.title,
          response?.message || SIGNUP_MESSAGES.SUCCESS.description,
        );
        refetch();
      } else {
        // Don't close modal on failure
        showNotification(
          SIGNUP_MESSAGES.FAILURE.type,
          SIGNUP_MESSAGES.FAILURE.title,
          response?.message || SIGNUP_MESSAGES.FAILURE.description,
        );
      }
    } catch (error: any) {
      // Don't close modal on error
      showNotification(
        SIGNUP_MESSAGES.FAILURE.type,
        SIGNUP_MESSAGES.FAILURE.title,
        error?.data?.message || SIGNUP_MESSAGES.FAILURE.description,
      );
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
    return <Alert message="Failed to load users" type="error" showIcon />;
  }

  const columns = [
    {
      title: "S.No",
      key: "index",
      render: (_: any, record: User, index: number) => {
        const sno =
          ((queryParams.page || 1) - 1) * (queryParams.limit || 10) + index + 1;

        if (user?.role?.name !== Roles.SUPER_ADMIN || !record.id) {
          return <>{sno}</>;
        }

        return <ImpersonationSno userId={record.id} sno={sno} />;
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: User) => {
        const tooltip = record.must_change_password
          ? "Password was reset by super admin. The user must set a new password at next login."
          : "";

        const className = record.must_change_password
          ? "underline font-bold"
          : "";

        return (
          <>
            <Tooltip title={tooltip}>
              <span className={className}>{name}</span>
            </Tooltip>
          </>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Facility",
      dataIndex: "facility",
      key: "facility",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => formatRoleName(role as Roles),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";

        switch (status) {
          case UserStatus.APPROVED:
            color = "green";
            break;
          case UserStatus.PENDING:
            color = "orange";
            break;
          case UserStatus.REJECTED:
            color = "red";
            break;
        }

        return (
          <>
            <Tag color={color} className="capitalize text-black">
              <mark className="text-black !bg-transparent">{status}</mark>
            </Tag>
          </>
        );
      },
    },
    {
      title: "Services",
      key: "services",
      render: (_: string, record: any) => (
        <Tooltip title="View services assigned to this user">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openServicesModal(record)}
          >
            View Services
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Permissions",
      key: "permission",
      render: (_: string, record: User) => (
        <>
          <Tooltip title="Assign permissions to this user">
            <Button
              type="link"
              icon={<LockOutlined />}
              onClick={() => openPermissionModal(record)}
            >
              Assign
            </Button>
          </Tooltip>
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: string, record: User) => (
        <>
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            disabled={!editUserAccess}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            // disabled={!deletUserAccess}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
          {isSuperAdmin && record.role !== Roles.SUPER_ADMIN && (
            <Tooltip title="Set a temporary password for users who cannot use forgot password">
              <Button
                type="link"
                icon={<KeyOutlined />}
                onClick={() => setUserToResetPassword(record)}
              >
                Reset Password
              </Button>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  const getInitialValues = (user: User | null) => {
    if (!user) return {};

    return {
      ...user,
      facility_id: user.facility_id?.toString(),
      role_id: user.role_id?.toString(),
      division_id: user.division_id,
      district_id: user.district_id,
      taluka_id: user.taluka_id,
      uc_id: user.uc_id,
      dob: user.dob ? dayjs(user.dob) : null,
    };
  };

  if (
    isLoading ||
    isAdding ||
    isEditing ||
    isDeleting ||
    isSavingPermission ||
    isFetchingUsers
  ) {
    return <Loader />;
  }

  return (
    <div className="user-management">
      {isLocationLoading && <Loader />}
      <CustomCollapse
        fieldConfig={advanceSearchData}
        handleSearch={handleSearch}
        handleReset={handleReset}
        searchForm={searchForm}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button
          type="primary"
          disabled={!addRoleAccess}
          onClick={handleAddNew}
          icon={<PlusOutlined />}
        >
          Add New User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={usersResponse?.data || []}
        size="small"
        rowKey="email"
        scroll={{ x: "max-content" }}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.limit,
          total: usersResponse?.count || 0,
          onChange: handleTableChange,
          showSizeChanger: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title={`Services - ${selectedUserForServices?.name || ""}`}
        open={isServicesModalVisible}
        onCancel={closeServicesModal}
        footer={null}
        width={600}
      >
        <div className="p-4 max-h-[500px] overflow-y-auto scrollbar-none">
          {selectedUserForServices?.userServices &&
          selectedUserForServices.userServices.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Services assigned to this user:
              </p>
              {selectedUserForServices.userServices.map((userService) => (
                <div
                  key={userService.serviceId}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {userService.service.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 mb-1">
                        {userService.service.name.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned on:{" "}
                        {new Date(userService.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <Tag color="green" className="text-xs">
                    Active
                  </Tag>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-5xl mb-4">
                <EyeOutlined />
              </div>
              <p className="text-gray-500">No services assigned to this user</p>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        title={`Assign Permissions - ${selectedUserForPermission?.name || ""}`}
        open={isPermissionModalVisible}
        onCancel={closePermissionModal}
        footer={null}
        width={600}
        destroyOnHidden={true}
      >
        <div className="p-4">
          <SingleSelectDropDown
            label="Status"
            name="approvalStatus"
            options={approvalOptions}
            placeholder="Select status"
            value={approvalStatus}
            onChange={setApprovalStatus}
            notWrappedInForm={true}
            required
          />
          <br />
          <br />
          <PermissionCollapse
            targetId={selectedUserForPermission?.id ?? 0}
            onSave={handleSave}
            isSaving={isSavingPermission}
            isExternalLoading={
              isUserPermissionDefaultsFetching || isRolePermissionsFetching
            }
            label="user"
            defaultPermissions={defaultUserPermissions}
            existingPermissions={
              selectedUserForPermission?.permissions?.length
                ? selectedUserForPermission.permissions
                : defaultRolePermissions
            }
            approvalStatus={approvalStatus}
            selectedRoleGuards={selectedRoleGuards}
            isAdminRole={isSelectedUserAdminRole}
            isFacilityInchargeRole={isSelectedUserFacilityIncharge}
          />
        </div>
      </Modal>
      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Delete"
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this user?</p>
      </Modal>
      <ResetPasswordModal
        user={userToResetPassword}
        open={!!userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        onCompleted={refetch}
      />
      <FormModalWithSteps
        open={isModalOpen}
        title={
          editingUser ? userModalConfig.editTitle : userModalConfig.addTitle
        }
        onCancel={() => {
          pagination.reset();
          setIsModalOpen(false);
        }}
        onFinish={onSubmit}
        initialValues={getInitialValues(editingUser)}
        basicInfoFields={(basicInfoFields as any) || []}
        personalDetailsFields={(personalDetailsFields as any) || []}
        onValuesChange={(changedValues, form) => {
          // Batch all updates together
          const updates: Record<string, any> = {};
          let shouldUpdate = false;

          if (changedValues.division_id !== undefined) {
            if (changedValues.division_id) {
              locationHandlers.onDivisionChange(changedValues.division_id);
            }
            updates.district_id = undefined;
            updates.taluka_id = undefined;
            updates.uc_id = undefined;
            shouldUpdate = true;
          } else if (changedValues.district_id !== undefined) {
            if (changedValues.district_id) {
              locationHandlers.onDistrictChange(changedValues.district_id);
            }
            updates.taluka_id = undefined;
            updates.uc_id = undefined;
            shouldUpdate = true;
          } else if (changedValues.taluka_id !== undefined) {
            if (changedValues.taluka_id) {
              locationHandlers.onTalukaChange(changedValues.taluka_id);
            }
            updates.uc_id = undefined;
            shouldUpdate = true;
          }

          // Apply all updates in a single batch
          if (shouldUpdate && Object.keys(updates).length > 0) {
            // Use a microtask to defer the update
            Promise.resolve().then(() => {
              form.setFieldsValue(updates);
            });
          }
        }}
      />
    </div>
  );
};
export default UserManagementTable;
