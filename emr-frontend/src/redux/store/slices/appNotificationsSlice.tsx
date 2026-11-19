import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AppNotificationType =
  | "telehealth_request_accepted"
  | "telehealth_request_rejected"
  | "telehealth_request_cancelled"
  | "telehealth_request_completed"
  | "general";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  requestId?: number;
  patientId?: number;
  patientName?: string;
  consultantDoctorName?: string;
  meetingUrl?: string;
}

interface AppNotificationsState {
  items: AppNotification[];
}

const initialState: AppNotificationsState = {
  items: [],
};

const appNotificationsSlice = createSlice({
  name: "appNotifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      const alreadyExists = state.items.some(
        (item) =>
          item.id === action.payload.id ||
          (item.type === action.payload.type &&
            item.requestId === action.payload.requestId),
      );

      if (!alreadyExists) {
        state.items.unshift(action.payload);
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(
        (item) => item.id === action.payload,
      );

      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
});

export const {
  addNotification,
  markNotificationAsRead,
  removeNotification,
  clearNotifications,
} = appNotificationsSlice.actions;

export default appNotificationsSlice.reducer;
