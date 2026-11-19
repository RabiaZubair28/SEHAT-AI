import React, { useState } from "react";
import {
  Table,
  Button,
  Tag,
  Alert,
  Form,
  DatePicker,
  Input,
  Modal,
} from "antd";
import type { Dayjs } from "dayjs";
import type { TableProps } from "antd";

import {
  useGetUsersQuery,
  User,
  UserParams,
} from "@/features/admin/services/usersApiService";
import { UserStatus } from "../../data/userManagemenConstants";
import { advanceSearchData } from "@/features/admin/data/userManagemenConstants";
import CustomCollapse from "@/components/shared/AdvanceSearch";
import Loader from "@/components/shared/Loader";
import { formatRoleName } from "@/utils/formats/rolesFormatter";

import {
  useCreateLeaveMutation,
  useDeleteLeaveMutation,
} from "../../services/applyLeaveApi";

import { useGetLeavesQuery } from "@/features/leaves/services/leaveApiService";
import { useGlobalNotification } from "@/hooks/useNotification";
import { Roles } from "@/data/types";
import UserAppliedLeavesTable from "./UserLeavesTable";

/* ---------------- Types ---------------- */

interface LeaveFormValues {
  startDate: Dayjs;
  endDate: Dayjs;
  reason: string;
}

/* ---------------- Component ---------------- */

const ApplyLeaveTable: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [leaveForm] = Form.useForm<LeaveFormValues>();
  const showNotification = useGlobalNotification();

  const [queryParams, setQueryParams] = useState<UserParams>({
    page: 1,
    limit: 10,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [isViewLeavesModalOpen, setIsViewLeavesModalOpen] = useState(false);
  const [userLeaves, setUserLeaves] = useState<any[]>([]);

  /* ---------------- API ---------------- */

  const {
    data: usersResponse,
    isLoading,
    isError,
    isFetching: isUserFetching,
    error,
  } = useGetUsersQuery(queryParams);

  const { data: leavesList = [], refetch: refetchLeaves } = useGetLeavesQuery();

  const [createLeave, { isLoading: isLeaveSubmitting }] =
    useCreateLeaveMutation();

  const [deleteLeave, { isLoading: isDeleteLeaveLoading }] =
    useDeleteLeaveMutation();

  /* ---------------- Handlers ---------------- */

  const handleApplyLeaveClick = (user: User) => {
    setSelectedUser(user);
    leaveForm.resetFields();
    setIsApplyLeaveModalOpen(true);
  };

  const handleViewLeavesClick = (user: User) => {
    setSelectedUser(user);

    const leaves = leavesList.filter((leave) => leave.userId === user.id);

    setUserLeaves(leaves);
    setIsViewLeavesModalOpen(true);
  };

  const handleCreateLeave = async (values: LeaveFormValues) => {
    if (!selectedUser?.id) return;

    try {
      await createLeave({
        userId: selectedUser.id,
        startDate: values.startDate.format("YYYY-MM-DD"),
        endDate: values.endDate.format("YYYY-MM-DD"),
        reason: values.reason,
      }).unwrap();

      showNotification("success", "Leave created successfully");
      setIsApplyLeaveModalOpen(false);
      refetchLeaves();
    } catch (err: any) {
      showNotification("error", err?.data?.message || "Failed to create leave");
    }
  };

  const handleDeleteLeave = async (leaveId: number) => {
    try {
      await deleteLeave(leaveId).unwrap();
      showNotification("success", "Leave deleted successfully");

      setUserLeaves((prev) => prev.filter((l) => l.id !== leaveId));
      refetchLeaves();
    } catch (err: any) {
      showNotification("error", err?.data?.message || "Failed to delete leave");
    }
  };

  /* ---------------- Search ---------------- */

  const handleSearch = (values: any) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      ...values,
    }));
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({ page: 1, limit: 10 });
  };

  /* ---------------- Guards ---------------- */

  if (isError) {
    const apiError = error as { data?: { message?: string } };
    return (
      <Alert
        message={apiError?.data?.message || "Something went wrong"}
        type="error"
      />
    );
  }

  /* ---------------- Data ---------------- */

  const filteredUsers =
    usersResponse?.data.filter(
      (u) =>
        u.role?.toLowerCase() !== Roles.ADMIN &&
        u.role?.toLowerCase() !== Roles.FACILITY_INCHARGE,
    ) || [];

  /* ---------------- User Table ---------------- */

  const userColumns: TableProps<User>["columns"] = [
    {
      title: "S.No",
      render: (_: any, __: any, index: number) =>
        ((queryParams.page ?? 1) - 1) * (queryParams.limit || 10) + index + 1,
    },
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    { title: "Facility", dataIndex: "facility" },
    {
      title: "Role",
      dataIndex: "role",
      render: (role: string) => formatRoleName(role as Roles),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const color =
          status === UserStatus.APPROVED
            ? "green"
            : status === UserStatus.PENDING
              ? "orange"
              : "red";

        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      render: (_: any, record: User) => {
        const hasLeaves = leavesList.some((l) => l.userId === record.id);

        return (
          <div className="flex gap-2 justify-center">
            <Button
              type="primary"
              onClick={() => handleApplyLeaveClick(record)}
            >
              Apply Leave
            </Button>

            <Button
              type="primary"
              disabled={!hasLeaves}
              onClick={() => handleViewLeavesClick(record)}
            >
              View Leaves
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading || isDeleteLeaveLoading || isLeaveSubmitting || isUserFetching)
    return <Loader />;

  /* ---------------- JSX ---------------- */

  return (
    <div className="apply-leave-table">
      <CustomCollapse
        fieldConfig={advanceSearchData}
        handleSearch={handleSearch}
        handleReset={handleReset}
        searchForm={searchForm}
      />

      <Table
        columns={userColumns}
        dataSource={filteredUsers}
        rowKey="email"
        size="small"
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.limit,
          total: usersResponse?.count || 0,
          showSizeChanger: false,
          onChange: (page, pageSize) =>
            setQueryParams({ page, limit: pageSize || 10 }),
        }}
      />

      {/* -------- Apply Leave Modal -------- */}
      <Modal
        title={`Apply Leave - ${selectedUser?.name}`}
        open={isApplyLeaveModalOpen}
        onCancel={() => setIsApplyLeaveModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsApplyLeaveModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isLeaveSubmitting}
            onClick={() => leaveForm.submit()}
          >
            Submit
          </Button>,
        ]}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleCreateLeave}>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* -------- View Leaves Modal -------- */}
      <Modal
        title={`Leaves - ${selectedUser?.name}`}
        open={isViewLeavesModalOpen}
        onCancel={() => setIsViewLeavesModalOpen(false)}
        footer={null}
        width={800}
      >
        <UserAppliedLeavesTable
          data={userLeaves}
          onDelete={handleDeleteLeave}
          isLoading={isDeleteLeaveLoading}
        />
      </Modal>
    </div>
  );
};

export default ApplyLeaveTable;
