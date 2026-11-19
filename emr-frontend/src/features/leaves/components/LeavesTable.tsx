import React from "react";
import { Table, Tag } from "antd";
import type { TableProps } from "antd";
import type { Leave } from "../services/leaveApiService";
import { formatDate } from "@/utils/formats/generalFormatters";

interface LeavesTableProps {
  leavesData: Leave[];
}

const LeavesTable: React.FC<LeavesTableProps> = ({ leavesData }) => {
  const transformedData =
    leavesData?.map((item, index) => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      return {
        key: item.id || index,
        startDate: formatDate(start),
        endDate: formatDate(end),
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
        }
        return (
          <Tag color={color} className="capitalize font-semibold !text-black">
            {status}
          </Tag>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={transformedData}
      size="small"
      scroll={{ x: "max-content" }}
      className="shadow-md rounded-lg"
    />
  );
};

export default LeavesTable;
