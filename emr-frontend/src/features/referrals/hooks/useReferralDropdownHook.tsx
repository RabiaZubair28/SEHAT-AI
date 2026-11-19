import { useEffect, useState, useMemo, useCallback } from "react";
import { useGetAllDistrictsQuery } from "@/services/locationsApiServices";
import { useGetFacilitiesByDistrictIdQuery } from "@/features/admin/services/facilitiesApi";
import { useGetEligibleServicesQuery } from "../services/ReferralApiServices";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";

export const useReferralDropdownOptions = (
  levelOfCare: string,
  selectedPatientId: number,
) => {
  const [selectedDistrictID, setSelectedDistrict] = useState<any>(null);
  const [, setFacilitySearchTerm] = useState("");
  const [facilityOptions, setFacilityOptions] = useState<any[]>([]);

  const facilityPagination = useDropDownPagination();
  const { data: districtsResponse } = useGetAllDistrictsQuery();
  const { data: eligibleServices } = useGetEligibleServicesQuery(
    selectedPatientId,
    {
      skip: !selectedPatientId,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: facilitiesResponse, isFetching: isFacilitiesFetching } =
    useGetFacilitiesByDistrictIdQuery(
      {
        districtId: selectedDistrictID || "",
        levelOfCare,
        page: facilityPagination.currentPage,
        limit: 10,
      },
      {
        skip: !selectedDistrictID || !levelOfCare,
        refetchOnMountOrArgChange: true,
      },
    );

  const districtOptions = useMemo(
    () =>
      districtsResponse?.map((d: any) => ({
        label: d.name,
        value: d.id,
      })) || [],
    [districtsResponse],
  );

  const serviceOptions = useMemo(() => {
    if (!eligibleServices || !Array.isArray(eligibleServices)) return [];
    const keepUppercase = ["OPD", "ANC", "PNC"];
    return eligibleServices.map((s: any) => ({
      label: keepUppercase.includes(s.name)
        ? s.name
        : s.name
            .toLowerCase()
            .split("_")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
      value: s.id,
    }));
  }, [eligibleServices]);

  const facilities = useMemo(
    () =>
      facilitiesResponse?.data
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  useEffect(() => {
    if (facilitiesResponse?.lastPage) {
      facilityPagination.setLastPage(facilitiesResponse.lastPage);
    }
  }, [facilitiesResponse?.lastPage]);

  useEffect(() => {
    if (!selectedDistrictID || !levelOfCare) {
      return;
    }

    if (facilityPagination.currentPage === 1) {
      setFacilityOptions(facilities);
    } else {
      setFacilityOptions((prev) => [...prev, ...facilities]);
    }
  }, [
    facilities,
    facilityPagination.currentPage,
    selectedDistrictID,
    levelOfCare,
  ]);

  useEffect(() => {
    if (!levelOfCare) return;

    setSelectedDistrict(null);
    setFacilityOptions([]);
    setFacilitySearchTerm("");
    facilityPagination.reset();
  }, [levelOfCare]);

  const onDistrictChange = useCallback((value: any) => {
    setSelectedDistrict(value);
    setFacilityOptions([]);
    setFacilitySearchTerm("");
    facilityPagination.reset();
  }, []);

  return {
    districtOptions,
    facilityOptions,
    serviceOptions,
    facilityPagination,
    isFacilitiesFetching,
    onDistrictChange,
  };
};
