import React, { useState, useMemo, useEffect } from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import InventoryTable from "./components/InventoryManagementTable";
import { useGetAllMedicineInventoryQuery } from "./service/medicineInventoryApi";
import Loader from "@/components/shared/Loader";

const InventoryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState("1");

  const {
    data: medicineInventory,
    isLoading: medicineInventoryLoading,
    refetch,
  } = useGetAllMedicineInventoryQuery();

  // Filter medicines and contraceptives
  const { medicines, contraceptives } = useMemo(() => {
    if (!Array.isArray(medicineInventory) || !medicineInventory?.length) {
      return { medicines: [], contraceptives: [] };
    }

    const medicines = medicineInventory.filter(
      (item: any) => !item?.isContraceptive
    );

    const contraceptives = medicineInventory.filter(
      (item: any) => item?.isContraceptive
    );

    return { medicines, contraceptives };
  }, [medicineInventory]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (medicineInventoryLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar title="Inventory" />
      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs
          defaultActiveKey="1"
          activeKey={activeKey}
          onChange={setActiveKey}
          items={[
            {
              key: "1",
              label: `Medicine (${medicines?.length})`,
              children: (
                <InventoryTable medicineInventory={{ data: medicines }} />
              ),
            },
            {
              key: "2",
              label: `Contraceptive (${contraceptives.length})`,
              children: (
                <InventoryTable medicineInventory={{ data: contraceptives }} />
              ),
            },
          ]}
        />
      </Form>
    </>
  );
};

export default InventoryManagement;
