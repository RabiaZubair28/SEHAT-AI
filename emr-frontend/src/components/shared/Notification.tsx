import { notification, NotificationArgsProps } from "antd";

type NotificationType = "success" | "info" | "warning" | "error";

interface NotificationOptions {
  message: string;
  description?: string;
  duration?: number;
  placement?: NotificationArgsProps["placement"];
}

export const showNotification = (
  type: NotificationType,
  options: NotificationOptions
) => {
  notification[type]({
    ...options,
  });
};

// Convenience methods for each notification type
export const Notification = {
  success: (options: NotificationOptions) =>
    showNotification("success", options),
  info: (options: NotificationOptions) => showNotification("info", options),
  warning: (options: NotificationOptions) =>
    showNotification("warning", options),
  error: (options: NotificationOptions) => showNotification("error", options),
};
