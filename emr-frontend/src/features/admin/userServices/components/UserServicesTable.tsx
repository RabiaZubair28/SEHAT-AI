import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Button, Modal, Alert, Form, Tag, Tooltip } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { UserStatus } from "@/features/admin/data/userManagemenConstants";
import { useGlobalNotification } from "@/hooks/useNotification";
import { User, UserParams } from "@/features/admin/services/usersApiService";
import { advanceSearchData } from "../data/data";
import CustomCollapse from "@/components/shared/AdvanceSearch";
import type { ColumnsType } from "antd/es/table";
import { Select } from "antd";
import {
  useAddUserServicesMutation,
  useGetUserServicesQuery,
  useGetServicesByRoleQuery,
} from "../../services/UserServices";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import MultiSelect from "@/components/ui/MultiSelect";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Loader from "@/components/shared/Loader";
import { Roles } from "@/data/types";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetFacilitiesQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { formatServiceLabel } from "@/utils/helpers/serviceName";


const UserServicesTable: React.FC = () => {
  const showNotification = useGlobalNotification();
  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [assignedServices, setAssignedServices] = useState<number[]>([]);
  const [searchForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState<UserParams>({
    page: 1,
    limit: 10,
    first_name: undefined,
    last_name: undefined,
    email: undefined,
    status: undefined,
    facility_id: undefined,
  });
  const {
    data: userServicesResponse,
    isLoading,
    isError,
    isFetching: isFetchingUserServices,
    error,
    refetch,
  } = useGetUserServicesQuery(queryParams);

  const [addUserServices, { isLoading: isAddingService }] =
    useAddUserServicesMutation();

  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { data: servicesByRole = [], isFetching: isFetchingServices } =
    useGetServicesByRoleQuery(selectedUser?.role, { skip: !selectedUser?.role });

  useEffect(() => {
    if (selectedUser?.role && !isFetchingServices) {
      setIsServicesModalVisible(true);
    }
  }, [selectedUser?.role, isFetchingServices]);
  const pagination = useDropDownPagination();
  const [facilityOptions, setFacilityOptions] = useState<
    { label: string; value: any }[]
  >([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    null,
  );
  const [modalFacilityId, setModalFacilityId] = useState<number | null>(null);
  const adminUser = useSelector((state: RootState) => state.authAdmin.admin);
  const isFacilityIncharge = adminUser?.role?.name === Roles.FACILITY_INCHARGE;
  const userFacilityId = adminUser?.facility?.id;
  const isDropdownDisabled = Boolean(isFacilityIncharge && userFacilityId);

  const { data: facilitiesResponse, refetch: refetchFacilities } =
    useGetFacilitiesQuery({
      page: pagination.currentPage,
      limit: 10,
      name: facilitySearchTerm,
    });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (facilitiesResponse?.lastPage) {
      pagination.setLastPage(facilitiesResponse.lastPage);
    }
  }, [facilitiesResponse, pagination]);

  const facilities = useMemo(() => {
    return facilitiesResponse
      ? formatFacilitiesToOptions(facilitiesResponse?.data)
      : [];
  }, [facilitiesResponse]);

  useEffect(() => {
    if (!facilities.length) return;
    if (pagination.currentPage === 1) {
      setFacilityOptions(facilities);
    } else {
      setFacilityOptions((prev) => [...prev, ...facilities]);
    }
  }, [facilities, pagination.currentPage]);

  useEffect(() => {
    if (facilitySearchTerm !== "") {
      if (pagination.currentPage === 1) {
        setFacilityOptions(facilities);
      }
    }
  }, [facilitySearchTerm, facilities, pagination.currentPage]);

  useEffect(() => {
    if (isFacilityIncharge && userFacilityId && adminUser?.facility) {
      const userFacilityOption = {
        label: adminUser.facility.name,
        value: userFacilityId,
      };
      setFacilityOptions([userFacilityOption]);
      setSelectedFacilityId(userFacilityId);
      setQueryParams((prev) => ({
        ...prev,
        facility_id: userFacilityId,
      }));
    }
  }, [isFacilityIncharge, userFacilityId, adminUser]);

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
    });
  };

  const handleReset = () => {
    searchForm.resetFields();

    setSelectedFacilityId(null);
    setQueryParams({
      page: 1,
      limit: 10,
      first_name: undefined,
      last_name: undefined,
      email: undefined,
      status: undefined,
      facility_id: undefined,
    });
  };

  const handleFacilitySearch = useCallback(
    (value: string) => {
      if (isDropdownDisabled) return;
      setFacilitySearchTerm(value);
      pagination.reset();
      refetchFacilities();
    },
    [refetchFacilities, pagination, isDropdownDisabled],
  );

  const handleFacilityChange = useCallback(
    (value: any) => {
      if (isDropdownDisabled) return;

      setSelectedFacilityId(value);

      setQueryParams((prev) => {
        const updated = {
          ...prev,
          page: 1,
          facility_id: value,
        };
        return updated;
      });
    },
    [isDropdownDisabled],
  );

  const openAssignServicesModal = (user: any) => {
    setSelectedUser(user);
    setAssignedServices(user.services?.map((service: any) => service.id) || []);

    if (user.facility_id) {
      setModalFacilityId(user.facility_id);
    }
  };

  const closePermissionModal = () => {
    setSelectedUser(null);
    setIsServicesModalVisible(false);
    setAssignedServices([]);
    setModalFacilityId(null);
  };

  const onAssignServices = async () => {
    try {
      const facilityId = modalFacilityId || selectedFacilityId;

      if (!facilityId) {
        showNotification(
          "error",
          "Validation Error",
          "Facility ID is required",
        );
        return;
      }

      const payload = {
        user_id: selectedUser?.id,
        services_ids: assignedServices,
        facility_id: Number(facilityId),
      };

      const response = await addUserServices(payload).unwrap();
      const userRole = selectedUser?.role;

      closePermissionModal();

      if (response?.success) {
        showNotification(
          "success",
          "Services Assigned",
          `${response?.message} to user ${userRole}` ||
            "Services assigned successfully",
        );
        refetch();
      } else {
        showNotification(
          "error",
          "Assignment Failed",
          response?.error || "An error occurred during service assignment.",
        );
      }
    } catch (error: any) {
      showNotification(
        "error",
        "Assignment Failed",
        error?.data?.message || "An error occurred during service assignment.",
      );
    }
  };

  const filteredUsers = userServicesResponse?.data || [];

  const allowedServiceIds = useMemo(
    () => new Set(servicesByRole.map((service) => service.id)),
    [servicesByRole],
  );

  const preSelectedServiceIds = useMemo(
    () =>
      selectedUser?.services
        ?.filter((service: any) => allowedServiceIds.has(service.id))
        .map((service: any) => String(service.id)) || [],
    [selectedUser?.services, allowedServiceIds],
  );

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

  const columns: ColumnsType<any> = [
    {
      title: "S.No",
      key: "index",
      render: (_: any, __: any, index: number) =>
        ((queryParams.page || 1) - 1) * (queryParams.limit || 10) + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
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
          <Tag color={color} className="capitalize text-black">
            <mark className="text-black !bg-transparent">{status}</mark>
          </Tag>
        );
      },
    },
    {
      title: "Services",
      key: "services",
      render: (_: string, record: User) => (
        <Tooltip title="Assign Services to this user">
          <Button
            type="link"
            icon={<LockOutlined />}
            disabled={record.status === "pending"}
            onClick={() => openAssignServicesModal(record)}
          >
            Assign Services
          </Button>
        </Tooltip>
      ),
    },
  ];

  if (isLoading || isAddingService || isFetchingUserServices) {
    return <Loader />;
  }

  return (
    <div className="user-management">
      <div className="mb-4 max-w-sm">
        <div className="mb-4 max-w-sm">
          <label className="block mb-2 text-sm font-medium">
            Facility <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder={
              isDropdownDisabled
                ? `${adminUser?.facility?.name || "N/A"}`
                : "Select Facility"
            }
            options={facilityOptions}
            showSearch={!isDropdownDisabled}
            onChange={handleFacilityChange}
            value={selectedFacilityId}
            onSearch={isDropdownDisabled ? undefined : handleFacilitySearch}
            onPopupScroll={(e: any) => {
              const target = e.target;
              if (
                !isDropdownDisabled &&
                target.scrollTop + target.offsetHeight === target.scrollHeight
              ) {
                pagination.fetchMore();
              }
            }}
            loading={pagination.isLoadingMore}
            filterOption={false}
            disabled={isDropdownDisabled}
            style={{ width: "100%" }}
            allowClear={!isDropdownDisabled}
          />
        </div>
      </div>
      <CustomCollapse
        fieldConfig={advanceSearchData}
        handleSearch={handleSearch}
        handleReset={handleReset}
        searchForm={searchForm}
      />
      <Table
        columns={columns}
        dataSource={filteredUsers}
        size="small"
        rowKey="email"
        scroll={{ x: "max-content" }}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.limit,
          total: userServicesResponse?.count || 0,
          onChange: handleTableChange,
          showSizeChanger: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title={`Assign Services - ${selectedUser?.name || ""}`}
        open={isServicesModalVisible}
        onCancel={closePermissionModal}
        footer={null}
        width={600}
        destroyOnHidden={true}
      >
        <div className="p-4">
          <br />
          <MultiSelect
            label="Assign Services"
            name="assign_services"
            options={servicesByRole.map((service) => ({
              value: String(service.id),
              label: formatServiceLabel(service.name),
            }))}
            onChange={(selected: string[]) => {
              setAssignedServices(selected.map((id) => parseInt(id)));
            }}
            placeholder="Select Services"
            value={preSelectedServiceIds}
            notWrappedInForm={true}
            required
          />
          <br />
          <br />
        </div>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button type="primary" onClick={onAssignServices}>
            Assign Services
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserServicesTable;
