import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useGetAllDivisionsQuery,
  useGetDistrictsByDivisionIdQuery,
  useGetTalukasByDistrictIdQuery,
  useGetUCsByTalukaIdQuery,
} from "@/services/locationsApiServices";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";

interface LocationState {
  divisionId: number | null;
  districtId: number | null;
  talukaId: number | null;
  ucId: number | null;
}

interface LocationOptions {
  divisions: Array<{ label: string; value: number }>;
  districts: Array<{ label: string; value: number }>;
  talukas: Array<{ label: string; value: number }>;
  ucs: Array<{ label: string; value: number }>;
}
interface InitialLocationValues {
  division_id?: number | string;
  district_id?: number | string;
  taluka_id?: number | string;
  uc_id?: number | string;
}
export const useLocationCascade =(initialValues?: InitialLocationValues)  => {
  const ucPagination = useDropDownPagination();
  // const [ucSearchTerm, setUcSearchTerm] = useState("");
  const [locationState, setLocationState] = useState<LocationState>({
    divisionId: null,
    districtId: null,
    talukaId: null,
    ucId: null,
  });
useEffect(() => {
    if (initialValues) {
      const divId = initialValues.division_id 
        ? Number(initialValues.division_id) 
        : null;
      const distId = initialValues.district_id 
        ? Number(initialValues.district_id) 
        : null;
      const talId = initialValues.taluka_id 
        ? Number(initialValues.taluka_id) 
        : null;
      const ucIdVal = initialValues.uc_id 
        ? Number(initialValues.uc_id) 
        : null;

      setLocationState({
        divisionId: divId,
        districtId: distId,
        talukaId: talId,
        ucId: ucIdVal,
      });
    }
  }, [
    initialValues?.division_id,
    initialValues?.district_id,
    initialValues?.taluka_id,
    initialValues?.uc_id
  ]);
  const { data: divisionsData } = useGetAllDivisionsQuery();
  const { currentData: districtsData, isFetching: isDistrictsFetching } =
    useGetDistrictsByDivisionIdQuery(locationState.divisionId!, {
      skip: locationState.divisionId === null,
    });
  const { currentData: talukasData, isFetching: isTalukasFetching } =
    useGetTalukasByDistrictIdQuery(locationState.districtId!, {
      skip: locationState.districtId === null,
    });

  const {
    currentData: ucsByTalukaIdData,
    isFetching: isUCsFetching,
  } = useGetUCsByTalukaIdQuery(
    {
      talukaId: locationState.talukaId!,
    },
    {
      skip: locationState.talukaId === null,
    }
  );

  const isLocationLoading =
    (locationState.divisionId !== null && isDistrictsFetching) ||
    (locationState.districtId !== null && isTalukasFetching) ||
    (locationState.talukaId !== null && isUCsFetching);

  // Handlers
  const onDivisionChange = useCallback((value: number) => {
    setLocationState({
      divisionId: value,
      districtId: null,
      talukaId: null,
      ucId: null,
    });
  }, []);

  const onDistrictChange = useCallback((value: number) => {
    setLocationState((prev) => ({
      ...prev,
      districtId: value,
      talukaId: null,
      ucId: null,
    }));
  }, []);

  const onTalukaChange = useCallback((value: number) => {
    setLocationState((prev) => ({
      ...prev,
      talukaId: value,
      ucId: null,
    }));
  }, []);

  // Reset function
  const resetLocations = useCallback(() => {
    setLocationState({
      divisionId: null,
      districtId: null,
      talukaId: null,
      ucId: null,
    });
    // setUcSearchTerm("");
    // setUcOptions([]);
    // ucPagination.reset();
  }, [ucPagination.reset]);

  const locationOptions: LocationOptions = useMemo(
    () => ({
      divisions:
        divisionsData?.map((division) => ({
          value: division.id,
          label: division.name,
        })) || [],
      districts:
        districtsData?.map((district) => ({
          value: district.id,
          label: district.name,
        })) || [],
      talukas:
        locationState.districtId === null
          ? [] // ⬅ clear talukas when district changed
          : talukasData?.map((taluka) => ({
              value: taluka.id,
              label: taluka.name,
            })) || [],
      ucs:
        locationState.districtId === null || locationState.talukaId === null
          ? []
          : ucsByTalukaIdData?.data?.map((uc) => ({
              value: uc.id,
              label: uc.name,
            })) || [],
    }),
    [
      divisionsData,
      districtsData,
      talukasData,
      ucsByTalukaIdData,
      locationState.districtId,
      locationState.talukaId,
    ]
  );

  const handlers = useMemo(
    () => ({
      onDivisionChange,
      onDistrictChange,
      onTalukaChange,
      // handleUcSearch,
    }),
    [onDivisionChange, onDistrictChange, onTalukaChange]
  );

  const ucPaginationMemo = useMemo(
    () => ({
      fetchMore: ucPagination.fetchMore,
      isLoadingMore: ucPagination.isLoadingMore,
    }),
    [ucPagination.fetchMore, ucPagination.isLoadingMore]
  );

  return {
    locationState,
    locationOptions,
    isLocationLoading,
    handlers,
    ucPagination: ucPaginationMemo,
    resetLocations,
  };
};
