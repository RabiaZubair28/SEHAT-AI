import React, { createContext, useContext } from "react";
import { notification } from "antd";

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [api, contextHolder] = notification.useNotification();

  // console.log("NotificationProvider initialized");

  const showNotification = (
    type: "success" | "error" | "info" | "warning",
    message: string,
    description?: string,
    duration = 3.5
  ) => {
    api[type]({ message, description, placement: "topRight", duration });
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useGlobalNotification = () => useContext(NotificationContext);
