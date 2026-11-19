import React from "react";
import {
  Avatar,
  Empty,
  Input,
  List,
  Modal,
  Pagination,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type {
  StaffAttendancePagination,
  StaffAttendanceRecord,
} from "../../services/dashboardService";
import { GREEN, GREEN_BORDER, GREEN_SOFT } from "./shared/constants";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import { Roles } from "@/data/types";

const { Text, Title } = Typography;

type AttendanceModalView = "all" | "checkedIn" | "checkedOut";

interface StaffAttendanceModalProps {
  open: boolean;
  view: AttendanceModalView | null;
  records: StaffAttendanceRecord[];
  pagination: StaffAttendancePagination;
  searchValue: string;
  loading?: boolean;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
}

const VIEW_CONFIG: Record<
  AttendanceModalView,
  { title: string; subtitle: string; accent: string; icon: React.ReactNode }
> = {
  all: {
    title: "All Staff",
    subtitle: "Complete staff directory for the selected scope",
    accent: GREEN,
    icon: <TeamOutlined />,
  },
  checkedIn: {
    title: "Checked-In Staff",
    subtitle: "Staff members currently checked in",
    accent: "#0f9d58",
    icon: <LoginOutlined />,
  },
  checkedOut: {
    title: "Checked-Out Staff",
    subtitle: "Absent staff mapped as checked out for the dashboard",
    accent: "#cf1322",
    icon: <LogoutOutlined />,
  },
};

const getDisplayStatus = (status: string) =>
  status === "Absent" ? "Checked Out" : status;

const getStatusColor = (status: string) => {
  const displayStatus = getDisplayStatus(status);
  if (displayStatus === "Checked In") return "success";
  if (displayStatus === "Checked Out") return "error";
  return "default";
};

const StaffAttendanceModal: React.FC<StaffAttendanceModalProps> = ({
  open,
  view,
  records,
  pagination,
  searchValue,
  loading = false,
  onClose,
  onSearchChange,
  onPageChange,
}) => {
  const config = view ? VIEW_CONFIG[view] : VIEW_CONFIG.all;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      centered
      destroyOnHidden
      title={
        <Space size={12} align="center">
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: GREEN_SOFT,
              color: config.accent,
              fontSize: 18,
            }}
          >
            {config.icon}
          </span>
          <div>
            <Title level={4} style={{ margin: 0, color: "#163524" }}>
              {config.title}
            </Title>
            <Text style={{ color: "#5c7b69", fontSize: 13 }}>
              {config.subtitle}
            </Text>
          </div>
        </Space>
      }
      styles={{
        content: {
          borderRadius: 20,
          padding: 0,
          overflow: "hidden",
          maxWidth: "calc(100vw - 48px)",
        },
        header: {
          padding: "22px 24px 16px",
          marginBottom: 0,
          borderBottom: `1px solid ${GREEN_BORDER}`,
          background:
            "linear-gradient(180deg, rgba(232,245,238,0.8) 0%, #ffffff 100%)",
        },
        body: { padding: 20 },
      }}
    >
      <Input
        allowClear
        size="large"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by staff name or role"
        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          borderColor: GREEN_BORDER,
        }}
      />

      <div style={{ minHeight: 280, position: "relative" }}>
        <Spin spinning={loading}>
          {records.length === 0 ? (
            <div
              style={{
                minHeight: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px dashed ${GREEN_BORDER}`,
                borderRadius: 16,
                background: "#fbfdfb",
              }}
            >
              <Empty description="No staff found for this view" />
            </div>
          ) : (
            <List
              dataSource={records}
              style={{
                maxHeight: "52vh",
                overflowY: "auto",
                paddingRight: 4,
              }}
              renderItem={(record) => (
                <List.Item
                  key={record.userId}
                  style={{
                    border: `1px solid ${GREEN_BORDER}`,
                    borderRadius: 16,
                    padding: "16px 18px",
                    marginBottom: 12,
                    background: "#fff",
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={44}
                        style={{ backgroundColor: GREEN_SOFT, color: GREEN }}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <Space size={10} wrap>
                        <Text strong style={{ fontSize: 15, color: "#173321" }}>
                          {record.name}
                        </Text>
                        <Tag color={getStatusColor(record.attendanceStatus)}>
                          {getDisplayStatus(record.attendanceStatus)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text style={{ color: "#5c6b63" }}>
                        {formatRoleName(record.role as Roles)}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>

      {pagination.total > pagination.limit && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 16,
            borderTop: `1px solid ${GREEN_BORDER}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}

            onChange={onPageChange}
          />
        </div>
      )}
    </Modal>
  );
};

export type { AttendanceModalView };
export default StaffAttendanceModal;
