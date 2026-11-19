import { useEffect, useState, useMemo, useCallback } from "react";
import { useGetAllDistrictsQuery } from "@/services/locationsApiServices";
import { useGetFacilitiesByDistrictIdQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";

export const useEmergencyDropdownOptions = (levelOfCare: string) => {
  const [selectedDistrictID, setSelectedDistrict] = useState<any>(null);
  const [facilityOptions, setFacilityOptions] = useState<any[]>([]);

  const facilityPagination = useDropDownPagination();

  const { data: districtsResponse } = useGetAllDistrictsQuery();

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
    facilityPagination.reset();
  }, [levelOfCare]);

  const onDistrictChange = useCallback((value: any) => {
    setSelectedDistrict(value);
    setFacilityOptions([]);
    facilityPagination.reset();
  }, []);

  return {
    districtOptions,
    facilityOptions,
    isFacilitiesFetching,
    onDistrictChange,
    facilityPagination,
    selectedDistrictID,
  };
};


