import React from "react";
import { Table } from "antd";
import type { TableProps } from "antd";

interface InventoryTableProps {
  medicineInventory: { data: any[] };
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  medicineInventory,
}) => {
  const tableData =
    medicineInventory?.data?.flatMap((medicine: any) => {
      // For each medicine, create a row for each variant
      return (
        medicine.variants?.map((variant: any) => {
          return {
            key: `${medicine.medicineId}-${variant.variantId}`,
            id: variant.variantId,
            medicineId: medicine.medicineId,
            medicineName: medicine.medicineName || medicine.genericName,
            variantName: `${variant.unit} - ${variant.strength}`,
            category: medicine.category,
            stockQuantity: variant.totalQuantity,
            availableBatches: variant.availableBatches,
            // batchNumber: "-", // Not available in this data structure
            // facilityName: "-", // Not available in this data structure
            // limitQuantity: "-", // Not available in this data structure
            // purchaseDate: "-", // Not available in this data structure
            // expiryDate: "-", // Not available in this data structure
          };
        }) || []
      );
    }) || [];

  const columns: TableProps<any>["columns"] = [
    {
      title: "MEDICINE",
      dataIndex: "medicineName",
      key: "medicineName",
      width: 200,
    },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 150,
    },
    {
      title: "VARIANT",
      dataIndex: "variantName",
      key: "variantName",
      width: 200,
    },
    {
      title: "STOCK",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      width: 100,
    },
    {
      title: "BATCHES",
      dataIndex: "availableBatches",
      key: "availableBatches",
      width: 100,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      size="small"
      scroll={{ x: "max-content" }}
      className="shadow-md rounded-lg"
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} items`,
      }}
    />
  );
};

export default InventoryTable;


