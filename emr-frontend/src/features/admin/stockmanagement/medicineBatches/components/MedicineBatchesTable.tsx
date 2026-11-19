import React, { useEffect } from "react";
import type { TableProps } from "antd";
import { Table, Tag } from "antd";
import {
  useDeleteMedicineBatchMutation,
  useGetMedicineBatchesQuery,
} from "../../../services/medicineBatchesApi";
import { formatDateForDisplay } from "@/utils/formats/generalFormatters";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import { useGlobalNotification } from "@/hooks/useNotification";
import { extractErrorMessage } from "@/utils/helpers/extractErrorMessage";
import BatchActions from "./BatchActions";
import { useTablePagination } from "@/hooks/useTablePagination";

type Props = {
  searchParams: { facility?: number; medicine?: number };
  contraceptives: boolean;
};

const MedicineBatchTable: React.FC<Props> = ({
  searchParams,
  contraceptives,
}) => {
  const { page, pageSize, onChange, reset } = useTablePagination(() => {});
  const showNotification = useGlobalNotification();
  const [deleteBatch] = useDeleteMedicineBatchMutation();
  const canEdit = usePermissionCheck(ROUTE_KEYS.UPDATE_MEDICINE_BATCH);
  const canDelete = usePermissionCheck(
    ROUTE_KEYS.DELETE_A_MEDICINE_BATCH_BY_ID,
  );

  const handleDelete = async (record: any) => {
    try {
      await deleteBatch(record.id).unwrap();
      showNotification("success", "Medicine Batch Deleted Successfully");
    } catch (error: any) {
      showNotification("error", "Delete Failed", extractErrorMessage(error));
    }
  };

  /* -------------------- TABLE COLUMNS -------------------- */
  const columns: TableProps<any>["columns"] = [
    {
      title: "BATCH #",
      dataIndex: "batchNumber",
      key: "batchNumber",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "MEDICINE",
      dataIndex: "medicineName",
      key: "medicineName",
    },
    {
      title: "VARIANT",
      dataIndex: "variantName",
      key: "variantName",
    },
    {
      title: "FACILITY",
      dataIndex: "facilityName",
      key: "facilityName",
    },
    {
      title: "STOCK",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
    },

    {
      title: "PURCHASE DATE",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
    },
    {
      title: "EXPIRY DATE",
      dataIndex: "expiryDate",
      key: "expiryDate",
    },
    {
      title: "CREATED DATE",
      dataIndex: "createdDate",
      key: "createdDate",
    },
    {
      title: "OTC",
      dataIndex: "otc",
      key: "otc",
      render: (otc: boolean) =>
        otc ? <Tag color="blue">Yes</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: "OTC LIMIT QUANTITY",
      dataIndex: "limitQuantity",
      key: "limitQuantity",
      width: 150,
    },
    ...(canEdit || canDelete
      ? [
          {
            title: "ACTIONS",
            key: "actions",
            width: 150,
            render: (_: any, record: any) => (
              <BatchActions
                record={record}
                canEdit={canEdit}
                canDelete={canDelete}
                onDelete={handleDelete}
              />
            ),
          },
        ]
      : []),
  ];

  /* -------------------- API CALL -------------------- */

  useEffect(() => {
    reset();
  }, [contraceptives, searchParams, reset]);

  const {
    data,
    isLoading,
    isError,
    isFetching: isFetchingMedicineBatches,
  } = useGetMedicineBatchesQuery({
    page,
    limit: pageSize,
    facilityId: searchParams?.facility,
    medicineId: searchParams?.medicine,
    contraceptive: contraceptives,
  });

  if (isError)
    return <div className="text-red-600">Failed to load medicine batches</div>;

  /* -------------------- DATA TRANSFORMATION -------------------- */

  const tableData =
    data?.data?.map((item: any, index: number) => {
      const variantName = item.variant
        ? `${item.variant.unit} - ${item.variant.strength}`
        : "-";

      return {
        key: item.id || index,
        id: item.id,
        batchNumber: item?.batch_number,
        medicineName: item?.medicine?.name || `#${item.medicineId}`,
        variantName,
        facilityName: item?.facility?.name || "-",
        stockQuantity: item?.stock_quantity,
        limitQuantity: item?.variant?.medicineCount[0]?.limit_quantity ?? "-",
        purchaseDate: item?.purchase_date
          ? formatDateForDisplay(new Date(item?.purchase_date))
          : "-",
        expiryDate: item?.expiry_date
          ? formatDateForDisplay(new Date(item?.expiry_date))
          : "-",
        createdDate: item?.createdAt
          ? formatDateForDisplay(new Date(item?.createdAt))
          : "-",
        otc: item?.variant?.medicineCount[0]?.otc ?? false,
        isEditable: item?.isEditable ?? false,
        isDeletable: item?.isDeletable ?? false,
      };
    }) || [];

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      size="small"
      scroll={{ x: "max-content" }}
      loading={isLoading || isFetchingMedicineBatches}
      pagination={{
        current: page,
        pageSize,
        total: data?.total || 0,
        onChange,
      }}
      className="shadow-md rounded-lg"
    />
  );
};

export default MedicineBatchTable;
