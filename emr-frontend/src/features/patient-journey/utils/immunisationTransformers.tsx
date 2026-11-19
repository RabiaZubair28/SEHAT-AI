import { formatDateToYYYYMMDD } from "@/utils/formats/generalFormatters";
import { PlaceOfDelivery } from "../data/constants";
import {
  ImmunisationCardVisitData,
  ImmunisationDoseVisitData,
  PatientVisitData,
} from "../immunisation/types";

export const transformFormDataToImmunisationApi = (
  formData: any,
  appointmentId?: number,
  options?: {
    recordsFieldName?: string;
    includeCardDetails?: boolean;
  },
) => {
  const recordsFieldName = options?.recordsFieldName || "immunization_records";
  const includeCardDetails = options?.includeCardDetails ?? true;

  return {
    appointmentId: appointmentId || formData.appointmentId,
    immunisationCard: includeCardDetails
      ? {
          placeOfDelivery: formData.place,
          level_of_care: formData.levelOfCare,
          districtId: formData.district,
          talukaId: formData.taluka,
          facility: formData.facility,
          otherFacilityName: formData.otherFacility || formData.otherPlace,
          immunisationCardAvailable: formData.immunisation_card_available,
          immunisationCardProvided: formData.cardProvided,
          immunisationNumber: formData.immunisationNumber
            ? String(formData.immunisationNumber)
            : undefined,
        }
      : undefined,
    doses: (formData[recordsFieldName] || [])
      .filter((record: any) => {
        if (record?.immunization_status !== true) return false;
        if (record?.isAlreadyAdministered === true) return false;
        return true;
      })
      .map((record: any) => ({
        vaccine_id: record.vaccine_id,
        dateAdministered: formatDateToYYYYMMDD(record.administration_date),
        status: "Administered",
      })),
  };
};

export const transformImmunisationApiToFormData = (
  apiData: PatientVisitData,
  allVaccines: any[],
  patientDoses?: ImmunisationDoseVisitData[],
) => {
  const immunisationCard = (apiData?.immunisationCard ?? {}) as ImmunisationCardVisitData;
  const doses = patientDoses || [];
  const administeredDosesMap = new Map<number, ImmunisationDoseVisitData>();

  doses.forEach((dose: ImmunisationDoseVisitData) => {
    const vaccineId = dose.vaccine.id;
    if (vaccineId) {
      administeredDosesMap.set(vaccineId, dose);
    }
  });

  return {
    place: immunisationCard.placeOfDelivery,
    levelOfCare: immunisationCard.level_of_care,
    district: immunisationCard.districtId
      ? Number(immunisationCard.districtId)
      : undefined,
    taluka: immunisationCard.talukaId
      ? Number(immunisationCard.talukaId)
      : undefined,
    facility:
      immunisationCard.placeOfDelivery === PlaceOfDelivery.PUBLIC_FACILITY
        ? immunisationCard.facilityId
          ? immunisationCard.facilityId
          : "Other"
        : undefined,
    _facilityOption: immunisationCard.facility
      ? {
          label: immunisationCard.facility.name,
          value: String(immunisationCard.facility.id),
        }
      : undefined,
    otherPlace:
      immunisationCard.placeOfDelivery !== PlaceOfDelivery.PUBLIC_FACILITY
        ? immunisationCard.otherFacilityName
        : undefined,
    otherFacility:
      immunisationCard.placeOfDelivery === PlaceOfDelivery.PUBLIC_FACILITY
        ? immunisationCard.otherFacilityName
        : undefined,
    immunisation_card_available: immunisationCard.immunisationCardAvailable,
    cardProvided: immunisationCard.immunisationCardProvided,
    immunisationNumber: immunisationCard.immunisationNumber ?? undefined,

    immunization_records: allVaccines.map((vaccine: any) => {
      const administeredDose = administeredDosesMap.get(vaccine.id);

      return {
        vaccine: `${vaccine.display_name} (${vaccine.code})`,
        dueDate: formatDateToYYYYMMDD(vaccine.dueDate),
        vaccine_id: vaccine.id,
        immunization_status: !!administeredDose,
        administration_date: administeredDose?.dateAdministered || undefined,
        dosageStatus: administeredDose
          ? "Administered"
          : vaccine.immunisationDosageStatus,
        isAlreadyAdministered: !!administeredDose,
      };
    }),
  };
};
