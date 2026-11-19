import { ChildComplications, ChildOrder, LevelOfCare, MotherComplication, ReferralPerson, ReferralType, TypeOfService } from "../enums/enums";
import { Patient } from "src/patients/entities/patient.entity";
import { User } from "src/users/entities/user.entity";
import { District } from "src/districts/entities/district.entity";
import { Facility } from "src/facilities/entities/facility.entity";
import { DeepPartial } from "typeorm";

export interface ReferralCreationInput {
  patient: DeepPartial<Patient>;
  fromDoctor: DeepPartial<User>;
  toDoctor?: DeepPartial<User>;

  district?: DeepPartial<District>;
  facility?: DeepPartial<Facility>;
  type_of_service?: TypeOfService;
  type?: ReferralType;
  levelOfCare?: LevelOfCare;

  motherComplications?: MotherComplication[];
  childComplications?: ChildComplications[];

  whoRequiresReferral?: ReferralPerson;
  whichChildRequiredReferral?: ChildOrder[];

  refer_out_reason?: string;
}
