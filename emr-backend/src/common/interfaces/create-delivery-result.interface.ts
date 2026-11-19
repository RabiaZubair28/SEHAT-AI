import { AppointmentService } from "src/appointments/entities/appointment-service.entity";

export interface CreateDeliveryResult {
  appointmentServiceResponse: AppointmentService;
  referInResults: { message: string }[];
}
