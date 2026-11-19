import { PatientStatus } from "../enums/enums";
import { Patient } from "src/patients/entities/patient.entity";
import { User } from "src/users/entities/user.entity";
import { DeepPartial } from "typeorm";
import { Appointment } from "src/appointments/entities/appointment.entity";
import { AppointmentService } from "src/appointments/entities/appointment-service.entity";
import { PatientQueue } from "src/patient-queue/entities/patient-queue.entity";
import { Facility } from "src/facilities/entities/facility.entity";
import { Visit } from "src/visit/entities/visit.entity";

export interface ReferInCreationInterface {
  patient: DeepPartial<Patient>;
  doctor: DeepPartial<User>;
  service_id : number;

  facility: DeepPartial<Facility>;

  status: PatientStatus;
}
