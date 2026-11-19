import React, { useMemo } from "react";
import { Form, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar";
import PendingQueue from "./components/PendingQueue";
import CompletedQueue from "./components/CompletedQueue";
import PatientQueueFDO from "./components/PatientQueueFDO";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { Roles } from "@/data/types";
import Overdue from "./components/OverdueVaccinator";
import EmergencyQueue from "./components/EmergencyQueue";
import UnassignedQueue from "./components/UnassignedQueue";
import TelehealthQueue from "./components/TelehealthQueue";
import IncomingTelehealthRequestsQueue from "./components/IncomingTelehealthRequestsQueue";
import CompletedTelehealthRequestsQueue from "./components/CompletedTelehealthRequestsQueue";

export enum VisitStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  DISPATCHED = "dispatched",
  REFERRED_OUT = "referred_out",
}

const PatientQueue: React.FC = () => {
  const [form] = Form.useForm();

  const user = useSelector((state: RootState) => state.authUser.user);

  const isFrontDesk = user?.role?.name === Roles.FRONT_DESK;
  const isVaccinator = user?.role?.name === Roles.VACCINATOR;
  const isTelehealthConsultant =
    user?.role?.name === Roles.TELEHEALTH_CONSULTANT;

  const tabItems = useMemo(() => {
    if (isFrontDesk) {
      return [
        {
          key: "1",
          label: "Today's Visits",
          children: <PatientQueueFDO />,
        },
        {
          key: "2",
          label: "Unassigned Queue",
          children: <UnassignedQueue />,
        },
      ];
    }

    if (isVaccinator) {
      return [
        {
          key: "1",
          label: "Pending Appointments",
          children: <PendingQueue />,
        },
        {
          key: "2",
          label: "Completed Visits",
          children: <CompletedQueue />,
        },
        {
          key: "3",
          label: "Due Vaccination Visits",
          children: <Overdue />,
        },
      ];
    }

    if (isTelehealthConsultant) {
      return [
        {
          key: "1",
          label: "Incoming Telehealth Requests",
          children: <IncomingTelehealthRequestsQueue />,
        },
        {
          key: "2",
          label: "Completed",
          children: <CompletedTelehealthRequestsQueue />,
        },
      ];
    }

    const defaultTabs = [
      {
        key: "1",
        label: "Pending Appointments",
        children: <PendingQueue />,
      },
      {
        key: "2",
        label: "Completed Visits",
        children: <CompletedQueue />,
      },
      {
        key: "3",
        label: "Emergency Visits",
        children: <EmergencyQueue />,
      },
    ];

    defaultTabs.push({
      key: "4",
      label: "Telehealth Queue",
      children: <TelehealthQueue />,
    });

    return defaultTabs;
  }, [isFrontDesk, isTelehealthConsultant, isVaccinator]);

  const topBarTitle = isTelehealthConsultant
    ? "Telehealth Requests"
    : isVaccinator
      ? "Today's Child Immunisation Queue"
      : "Today's Patient Queue";

  return (
    <>
      <TopBar title={topBarTitle} />
      <Form style={{ marginTop: "12px" }} form={form} layout="vertical">
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Form>
    </>
  );
};

export default PatientQueue;
