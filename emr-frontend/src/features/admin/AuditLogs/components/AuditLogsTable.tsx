import React, { useState } from "react";
import { Table, Tag } from "antd";
import type { TableProps } from "antd";
import Loader from "@/components/shared/Loader";
import { formatDateForDisplay } from "@/utils/formats/generalFormatters";
import { useGetAuditLogsQuery } from "../../services/auditLogsApi";

type Props = {
  searchParams: { facility?: number; email?: string };
};

const AuditLogsTable: React.FC<Props> = ({ searchParams }) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  /* -------------------- TABLE COLUMNS -------------------- */
  const columns: TableProps<any>["columns"] = [
    {
      title: "USER",
      dataIndex: "user",
      key: "user",
      render: (user) => (
        <div>
          <div className="font-semibold">
            {user?.first_name} {user?.last_name}
          </div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
      ),
    },
    {
      title: "FACILITY",
      dataIndex: "facilityName",
      key: "facilityName",
    },
    {
      title: "METHOD",
      dataIndex: "method",
      key: "method",
      render: (method: string) => {
        const color =
          method === "POST" ? "green" : method === "GET" ? "blue" : "orange";
        return <Tag color={color}>{method}</Tag>;
      },
    },
    {
      title: "ROUTE",
      dataIndex: "route",
      key: "route",
      ellipsis: true,
    },
    {
      title: "STATUS",
      dataIndex: "statusCode",
      key: "statusCode",
      render: (status: number) => (
        <Tag color={status >= 400 ? "red" : "green"}>{status}</Tag>
      ),
    },
    {
      title: "EXECUTION TIME (ms)",
      dataIndex: "executionTimeMs",
      key: "executionTimeMs",
    },
    {
      title: "IP ADDRESS",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "CREATED DATE",
      dataIndex: "createdAt",
      key: "createdAt",
    },
  ];

  /* -------------------- API CALL -------------------- */
  const { data, isLoading, isError, isFetching } = useGetAuditLogsQuery({
    page: pagination.current,
    limit: pagination.pageSize,

    facilityId: searchParams?.facility,
    email: searchParams?.email,
  });

  /* -------------------- DATA TRANSFORMATION -------------------- */
  const tableData =
    data?.data?.map((item: any) => ({
      key: item.id,
      user: item.user,
      facilityName: item.facility?.name || "-",
      method: item.method,
      route: item.route,
      statusCode: item.statusCode,
      executionTimeMs: item.executionTimeMs,
      ip: item.ip,
      createdAt: formatDateForDisplay(new Date(item.createdAt)),
    })) || [];

  if (isLoading || isFetching) return <Loader />;

  if (isError)
    return <div className="text-red-600">Failed to load audit logs</div>;

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: data?.count || 0,
        onChange: (page, pageSize) =>
          setPagination({ current: page, pageSize }),
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default AuditLogsTable;
