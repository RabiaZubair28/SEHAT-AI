import React, { useState, useMemo } from "react";
import { Table, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import { formatDateForDisplay } from "@/utils/formats/generalFormatters";
import { CommodityRequest, Roles } from "@/data/types";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
type Props = {
  searchParams: { status?: string };
  commodities: CommodityRequest[];
  listRoute?: string;
};

const MedicineCommoditiesTable: React.FC<Props> = ({
  searchParams,
  commodities,
  listRoute = ROUTES.COMMODITY_REQUESTS,
}) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const navigate = useNavigate();

  /* -------------------- TABLE COLUMNS -------------------- */
  const columns = [
    {
      title: "S.NO",
      dataIndex: "index",
      key: "index",
      render: (_: any, __: any, index: number) => (
        <span className="font-semibold">{index + 1}</span>
      ),
      width: 100,
    },
    {
      title: "USER NAME",
      dataIndex: "userType",
      key: "userType",
      render: (text: string) => formatRoleName(text as Roles),
    },
    {
      title: "REQUEST DATE",
      dataIndex: "requestDate",
      key: "requestDate",
    },
    {
      title: "APPROVED / REJECTED BY",
      dataIndex: "actionedBy",
      key: "actionedBy",
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "APPROVED") color = "green";
        else if (status === "PENDING") color = "orange";
        else if (status === "PARTIALLY_FULFILLED") color = "blue";
        else if (status === "REJECTED") color = "red";

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  /* -------------------- TABLE DATA -------------------- */
  const tableData = useMemo(() => {
    return (
      commodities
        ?.filter(
          (item) =>
            !searchParams?.status || item?.status === searchParams?.status,
        )
        .map((item) => ({
          key: item.id,
          id: item.id,
          actionedBy:
            item.status === "REJECTED"
              ? item.rejectedBy || "N/A"
              : item.approvedBy || "N/A",
          userType: item.initiatorRole,
          status: item.status,
          requestDate: formatDateForDisplay(new Date(item.createdAt)),
        })) || []
    );
  }, [commodities, searchParams]);

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: tableData.length,
        onChange: (page, pageSize) =>
          setPagination({ current: page, pageSize }),
      }}
      onRow={(record) => ({
        onClick: () =>
          navigate(
            `${listRoute}/${record.id}/${ROUTES.REQUESTED_MEDICINES_DETAILS}`,
          ),
        style: { cursor: "pointer" },
      })}
      className="shadow-md rounded-lg"
    />
  );
};

export default MedicineCommoditiesTable;
