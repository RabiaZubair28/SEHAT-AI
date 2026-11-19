import React from "react";
import { Table, Tag, Button, Popconfirm } from "antd";
import type { TableProps } from "antd";
import { formatDateForDisplay } from "@/utils/formats/generalFormatters";

interface LeavesTableProps {
  data: any[];
  onDelete: (leaveId: number) => void;
  isLoading: boolean;
}

const UserAppliedLeavesTable: React.FC<LeavesTableProps> = ({
  data,
  onDelete,
  isLoading,
}) => {
  const transformedData =
    data?.map((item, index) => {
      return {
        id: item?.id,
        key: item.id || index,
        startDate: formatDateForDisplay(new Date(item.startDate)),
        endDate: formatDateForDisplay(new Date(item.endDate)),
        reason: item.reason || "-",
        status: item.status || "-",
      };
    }) || [];

  const columns: TableProps<any>["columns"] = [
    {
      title: "START DATE",
      dataIndex: "startDate",
      key: "startDate",
    },
    {
      title: "END DATE",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "REASON",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color: string = "default";

        switch (status?.toLowerCase()) {
          case "approved":
            color = "green";
            break;
          case "pending":
            color = "orange";
            break;
          case "rejected":
            color = "red";
            break;
        }

        return (
          <Tag color={color} className="capitalize font-semibold !text-black">
            {status}
          </Tag>
        );
      },
    },
    {
      title: "ACTION",
      key: "action",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Are you sure you want to delete this leave?"
          onConfirm={() => onDelete(record.id)}
        >
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      loading={isLoading}
      dataSource={transformedData}
      rowKey="id"
      size="small"
      scroll={{ x: "max-content" }}
      pagination={false}
      className="shadow-md rounded-lg"
    />
  );
};

export default UserAppliedLeavesTable;
