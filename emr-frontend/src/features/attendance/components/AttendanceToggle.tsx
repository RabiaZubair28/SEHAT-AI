import React, { useMemo, useState } from "react";
import { Button, Modal, Tooltip } from "antd";
import {
  ExclamationCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useGlobalNotification } from "@/hooks/useNotification";
import { HttpStatus } from "@/data/types";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  useGetAttendanceRecordsQuery,
  useMarkAttendanceMutation,
  useCheckoutAttendanceMutation,
} from "../services/attendanceApiServices";

type ButtonType = "primary" | "default" | "dashed" | "text" | "link";

interface AttendanceToggleProps {
  size?: "small" | "middle" | "large";
  type?: ButtonType;
  iconOnly?: boolean;
  isMobile?: boolean;
}

const AttendanceToggle: React.FC<AttendanceToggleProps> = ({
  size = "middle",
  type = "primary",
  iconOnly = false,
  isMobile,
}) => {
  const [modal, contextHolder] = Modal.useModal();
  const notification = useGlobalNotification();
  const [locationLoading, setLocationLoading] = useState(false);
  const { user } = useAuthUser();

  const [markAttendance, { isLoading: markAttendanceLoading }] =
    useMarkAttendanceMutation();
  const [checkoutAttendance, { isLoading: checkoutAttendanceLoading }] =
    useCheckoutAttendanceMutation();

  const { data: attendanceData, refetch } = useGetAttendanceRecordsQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
    },
  );

  // Check if user is currently checked in (based on most recent record)
  const isCurrentlyCheckedIn = useMemo(() => {
    if (!attendanceData?.data || attendanceData.data.length === 0) {
      return false;
    }

    // Sort by checkInTime descending to get the most recent record
    const sortedRecords = [...attendanceData.data].sort((a: any, b: any) => {
      return (
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
      );
    });

    // Check if the most recent record has status "Checked In"
    const mostRecentRecord = sortedRecords[0];
    return mostRecentRecord.status === "Checked In";
  }, [attendanceData]);

  const doCheckIn = async (coords: {
    latitude?: number;
    longitude?: number;
  }) => {
    try {
      const res = await markAttendance(coords).unwrap();
      const successCode =
        res?.httpStatus === HttpStatus.CREATED ||
        res?.httpStatus === HttpStatus.OK;

      if (successCode) {
        notification(
          "success",
          "Attendance Success",
          res.message || "Checked in successfully",
        );
        refetch();
      }
    } catch (err: any) {
      notification(
        "error",
        "Attendance Failed",
        err?.data?.message || "Failed to check in",
      );
    }
  };

  const handleCheckIn = () => {
    const shouldGetLocation = Boolean(user) && isMobile === true;

    if (!shouldGetLocation) {
      doCheckIn({});
      return;
    }

    if (!navigator.geolocation) {
      doCheckIn({});
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLoading(false);
        doCheckIn({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setLocationLoading(false);
        doCheckIn({});
      },
    );
  };

  const handleCheckOut = async () => {
    try {
      const res = await checkoutAttendance().unwrap();
      let successCode =
        res?.httpStatus === HttpStatus.CREATED ||
        res?.httpStatus === HttpStatus.OK;

      if (successCode) {
        notification(
          "success",
          "Checkout Success",
          res.message || "Checked out successfully",
        );
        refetch();
      }
    } catch (err: any) {
      notification(
        "error",
        "Checkout Failed",
        err?.data?.message || "Failed to check out",
      );
    }
  };

  const showCheckoutConfirmation = () => {
    modal.confirm({
      title: "Are you sure you want to check out?",
      icon: <ExclamationCircleOutlined />,
      content:
        "Checking out will halt all future activities for the day. You will not be able to check in again until tomorrow.",
      okText: "Yes, Check Out",
      okType: "danger",
      cancelText: "Cancel",
      onOk: handleCheckOut,
      centered: true,
    });
  };

  return (
    <>
      {contextHolder}
      {isCurrentlyCheckedIn ? (
        <Tooltip title={iconOnly ? "Check Out" : ""}>
          <Button
            type={type}
            danger
            loading={checkoutAttendanceLoading}
            onClick={showCheckoutConfirmation}
            size={size}
            shape={iconOnly ? "circle" : "default"}
            icon={<LogoutOutlined />}
          >
            {!iconOnly && "Check Out"}
          </Button>
        </Tooltip>
      ) : (
        <Tooltip title={iconOnly ? "Check In" : ""}>
          <Button
            type={type}
            loading={locationLoading || markAttendanceLoading}
            disabled={locationLoading || markAttendanceLoading}
            onClick={handleCheckIn}
            size={size}
            shape={iconOnly ? "circle" : "default"}
            icon={<LoginOutlined />}
          >
            {!iconOnly && "Check In"}
          </Button>
        </Tooltip>
      )}
    </>
  );
};

export default AttendanceToggle;
