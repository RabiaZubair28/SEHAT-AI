import React from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import LeavesTable from "./components/LeavesTable";
import { useGetLeavesQuery } from "./services/leaveApiService";
import { useGlobalNotification } from "@/hooks/useNotification";
import Loader from "@/components/shared/Loader";

const UserLeaves: React.FC = () => {
  const [form] = Form.useForm();
  const notification = useGlobalNotification();

  const user = useSelector((state: RootState) => state.authUser.user);

  const { data: leavesData, isLoading, isError } = useGetLeavesQuery();

  if (isError) {
    notification(
      "error",
      "Failed to load leaves",
      "Could not fetch leave records. Please try again."
    );
  }

  const userLeaves =
    leavesData?.filter((leave) => leave.userId === user?.id) || [];

  const tabItems = [
    {
      key: "1",
      label: "My Leaves",
      children: <LeavesTable leavesData={userLeaves} />,
    },
  ];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <TopBar title="My Leaves" />

      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Form>
    </>
  );
};

export default UserLeaves;
