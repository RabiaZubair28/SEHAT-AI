import { AppNotification } from "@/redux/store/slices/appNotificationsSlice";

export const mapTelehealthRequestAcceptedToNotification = (
  payload: any,
): AppNotification => ({
  id: `telehealth_request_accepted_${payload?.requestId}`,
  type: "telehealth_request_accepted",
  title: "Telehealth Request Accepted",
  message: `${
    payload?.consultantDoctorName || "Consultant"
  } accepted the telehealth request for ${
    payload?.patientName || "the selected patient"
  }.`,
  createdAt: payload?.acceptedAt || new Date().toISOString(),
  read: false,
  requestId: payload?.requestId,
  patientId: payload?.patientId,
  patientName: payload?.patientName,
  consultantDoctorName: payload?.consultantDoctorName,
  meetingUrl: payload?.session?.meetingUrl,
});
