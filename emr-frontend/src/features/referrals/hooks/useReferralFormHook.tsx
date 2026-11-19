import { useMemo } from "react";
import { REFERRAL_IN, REFERRAL_OUT, REFERRAL_TYPES } from "../data/constants";
import { useReferralDropdownOptions } from "./useReferralDropdownHook";

const updateFieldOptions = (
  fields: any[],
  optionsMap: Record<string, any[]>,
  handlers: Record<string, any>
) => {
  return fields.map((field) => {
    const updatedField = { ...field };

    if (optionsMap[field.name]) {
      updatedField.options = optionsMap[field.name];
    }

    if (field.name === "district_id" && handlers.onDistrictChange) {
      updatedField.onChange = handlers.onDistrictChange;
    }

    if (field.name === "facility_id" && handlers.facilityPagination) {
      updatedField.fetchMore = handlers.facilityPagination.fetchMore;
      updatedField.isLoadingMore = handlers.facilityPagination.isLoadingMore;
    }

    return updatedField;
  });
};

export const useReferralFormFields = (
  referralType: string,
  levelOfCare?: string,
  selectedPatientId?: number

) => {
  const {
    districtOptions,
    facilityOptions,
    serviceOptions,
    isFacilitiesFetching,
    onDistrictChange,
    facilityPagination,
  } = useReferralDropdownOptions(levelOfCare || "", selectedPatientId || 0);

  const formFields = useMemo(() => {
    let baseFields: any[] = [];
    if (
      referralType === REFERRAL_TYPES.IN ||
      referralType === REFERRAL_TYPES.SELF
    ) baseFields = REFERRAL_IN;
    else if (referralType === REFERRAL_TYPES.OUT) baseFields = REFERRAL_OUT;
    else baseFields = [];

    return updateFieldOptions(
      baseFields,
      {
        district_id: districtOptions,
        facility_id: facilityOptions,
        referred_to_id: serviceOptions,
      },
      {
        onDistrictChange,
        facilityPagination,
      }
    );
  }, [
    referralType,
    districtOptions,
    facilityOptions,
    serviceOptions,
    onDistrictChange,
    facilityPagination,
  ]);

  return {
    formFields,
    isFacilitiesFetching,
    onDistrictChange,
    facilityPagination,
  };
};
