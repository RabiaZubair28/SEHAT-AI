import { useEffect, useMemo, useState, useCallback } from "react";
import { useGetAllDistrictsQuery } from "@/services/locationsApiServices";
import { useGetFacilitiesByDistrictIdQuery } from "@/features/admin/services/facilitiesApi";
import { formatFacilitiesToOptions } from "@/utils/formats/facilitiesFormatter";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";
import { useGetTalukasByDistrictIdQuery } from "@/services/locationsApiServices";

export const useImmunisationDropdownOptions = (levelOfCare: string) => {
  const [selectedDistrictID, setSelectedDistrict] = useState<any>(null);
  const [facilityOptions, setFacilityOptions] = useState<any[]>([]);
  const facilityPagination = useDropDownPagination();
  const OTHER_OPTION = { label: "Other", value: "Other" };

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
      districtsResponse?.map((d: any) => ({ label: d.name, value: d.id })) ||
      [],
    [districtsResponse],
  );

  const facilities = useMemo(
    () =>
      facilitiesResponse?.data
        ? formatFacilitiesToOptions(facilitiesResponse.data)
        : [],
    [facilitiesResponse],
  );

  const { data: talukasResponse } = useGetTalukasByDistrictIdQuery(
    selectedDistrictID,
    { skip: !selectedDistrictID },
  );

  const talukaOptions = useMemo(
    () =>
      talukasResponse?.map((t: any) => ({ label: t.name, value: t.id })) || [],
    [talukasResponse],
  );

  const addOtherOption = (list: any[]) => {
    const hasOther = list.some((o) => o.value === "Other");
    return hasOther ? list : [...list, OTHER_OPTION];
  };

  useEffect(() => {
    if (!selectedDistrictID || !levelOfCare) {
      return;
    }

    const dedupeByValue = (list: any[]) => {
      const map = new Map<any, any>();
      for (const item of list) map.set(item.value, item);
      return Array.from(map.values());
    };

    const nextFacilities = dedupeByValue(facilities);

    if (facilityPagination.currentPage === 1) {
      const newOptions = nextFacilities.length
        ? addOtherOption(nextFacilities)
        : [OTHER_OPTION];

      setFacilityOptions(newOptions);
    } else {
      setFacilityOptions((prev) => {
        const merged = dedupeByValue([...prev, ...nextFacilities]);
        const newOptions = merged.length
          ? addOtherOption(merged)
          : [OTHER_OPTION];
        return newOptions;
      });
    }
  }, [
    facilities,
    facilityPagination.currentPage,
    selectedDistrictID,
    levelOfCare,
  ]);

  useEffect(() => {
    if (!levelOfCare) {
      return;
    }
    if (selectedDistrictID !== null) {
      setSelectedDistrict(null);
      setFacilityOptions([]);
      facilityPagination.reset();
    }
  }, [levelOfCare]);

  const onDistrictChange = useCallback(
    (value: any) => {
      setSelectedDistrict(value);
      setFacilityOptions([]);
      facilityPagination.reset();
    },
    [selectedDistrictID],
  );

  return {
    districtOptions,
    facilityOptions,
    talukaOptions,
    isFacilitiesFetching,
    onDistrictChange,
    facilityPagination,
    selectedDistrictID,
  };
};
