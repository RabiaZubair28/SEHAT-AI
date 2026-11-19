import type { PlaceOfDelivery } from "../data/constants";

export type LevelOfCare = "Primary" | "Secondary" | "Tertiary" | "Office";

export interface VaccineVisitData {
  id: number;
}

export interface FacilityVisitData {
  id: number;
  name: string;
}

export interface ImmunisationDoseVisitData {
  id: number;
  vaccine: VaccineVisitData;
  dateAdministered: string | Date;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ImmunisationCardVisitData {
  id: number;
  placeOfDelivery?: PlaceOfDelivery | null;
  districtId?: string | number | null;
  talukaId?: string | number | null;
  level_of_care?: LevelOfCare | null;
  facilityId?: string | null;
  facility?: FacilityVisitData | null;
  otherFacilityName?: string | null;
  immunisationCardAvailable?: boolean | null;
  immunisationCardProvided?: boolean | null;
  immunisationNumber?: string | null;
}

export interface PatientVisitData {
  id: number;
  immunisationsDoses: ImmunisationDoseVisitData[];
  immunisationCard: ImmunisationCardVisitData | null;
}

export interface ImmunisationVisitResponseDto {
  patient: PatientVisitData;
}

export interface GetImmunisationVisitResponse {
  success: boolean;
  status: number;
  data: {
    immunization: ImmunisationVisitResponseDto | null;
    anc: null;
    pnc: null;
    opd: null;
    delivery: null;
    dispenser: null;
    nutrition: null;
    familyPlanning: null;
  };
  message: string;
}
