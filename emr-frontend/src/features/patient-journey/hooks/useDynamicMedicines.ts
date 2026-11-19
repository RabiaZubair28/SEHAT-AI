import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetMedicinesQuery } from "@/services/medicineApi";
import { TypeOfContraception } from "../data/constants";
import { groupMedicineVariants } from "@/utils/helpers/medicineHelpers";
import { useDropDownPagination } from "@/hooks/useDropDownPagination";

interface FormOption {
  id?: number;
  label: string;
  value: string | number;
  category: string;
  contraceptive: boolean;
  is_otc: boolean;
  variants: any[];
}

interface PaginationProps {
  fetchMore: () => void;
  isLoadingMore: boolean;
  onSearch: (val: string) => void;
}

interface UseDynamicMedicinesOptions {
  skipSupplements?: boolean;
  skipMedicines?: boolean;
  skipOtc?: boolean;
  skipShortTermContraceptives?: boolean;
  skipLarcContraceptives?: boolean;
  skipCompleteStock?: boolean;
  skipCompleteContraceptives?: boolean;
}

interface DynamicMedicines {
  medicineOptions: FormOption[];
  supplementOptions: FormOption[];
  shortTermContraceptiveOptions: FormOption[];
  larcContraceptiveOptions: FormOption[];
  otcmedicinesOptions: FormOption[];
  completeStockMedicinesOptions: FormOption[];
  completeContraceptiveOptions: FormOption[];
  //for delivery module
  medicineOptionsWithoutOther: FormOption[];
  //for delivery module
  refetchOtcMedicines: () => void;
  isLoading: boolean;
  error: any;
  stockMedicinePaginationProps: PaginationProps;
  contraceptivePaginationProps: PaginationProps;
  paginatedContraceptiveOptions: FormOption[];
  completeStockMedicinesOptionsWithOther: FormOption[];
  otcPaginationProps: PaginationProps;
  paginatedOtcOptions: FormOption[];
}

export const useDynamicMedicines = (
  options: UseDynamicMedicinesOptions = {},
): DynamicMedicines => {
  const [stockSearch, setStockSearch] = useState<string | undefined>(undefined);
  const stockPagination = useDropDownPagination();
  const [completeStockMedicinesOptions, setCompleteStockMedicinesOptions] =
    useState<FormOption[]>([]);
  const [contraceptiveSearch, setContraceptiveSearch] = useState<
    string | undefined
  >(undefined);
  const contraceptivePagination = useDropDownPagination();
  const [paginatedContraceptiveOptions, setPaginatedContraceptiveOptions] =
    useState<FormOption[]>([]);
  const [otcSearch, setOtcSearch] = useState<string | undefined>(undefined);
  const otcPagination = useDropDownPagination();
  const [paginatedOtcOptions, setPaginatedOtcOptions] = useState<FormOption[]>(
    [],
  );

  const {
    data: supplementsData,
    isLoading: isLoadingSupplements,
    error: supplementsError,
  } = useGetMedicinesQuery(
    {
      category: "Supplement",
      contraceptive: false,
      limit: 100,
    },
    { skip: options.skipSupplements },
  );

  const {
    data: medicinesData,
    isLoading: isLoadingMedicines,
    error: medicinesError,
  } = useGetMedicinesQuery({
    contraceptive: false,
    limit: 100,
  });

  const {
    data: otcMedicinesData,
    isLoading: isLoadingOtcMedicine,
    error: otcMedicineError,
    refetch: refetchOtcMedicines,
    isFetching: otcMedicineFetching,
  } = useGetMedicinesQuery(
    {
      is_otc: true,
      limit: 100,
      page: otcPagination.currentPage,
      name: otcSearch,
    },
    { skip: options.skipOtc },
  );

  const {
    data: shortTermContraceptiveData,
    isLoading: isShortTermContraceptiveLoading,
    error: shortTermContraceptiveError,
  } = useGetMedicinesQuery(
    {
      category: TypeOfContraception.SHORT_TERM,
      limit: 100,
    },
    { skip: options.skipShortTermContraceptives },
  );

  const {
    data: larcContraceptiveData,
    isLoading: larcContraceptiveLoading,
    error: larcContraceptiveErrors,
  } = useGetMedicinesQuery(
    {
      category: TypeOfContraception.LARC,
      limit: 100,
    },
    { skip: options.skipLarcContraceptives },
  );

  const {
    data: completeStockMedicineData,
    isLoading: completeStockMedicineLoading,
    error: completeStockMedicineDataError,
    isFetching: completeStockMedicineFetching,
  } = useGetMedicinesQuery(
    {
      limit: 100,
      contraceptive: false,
      page: stockPagination.currentPage,
      name: stockSearch,
    },
    { skip: options.skipCompleteStock },
  );

  const {
    data: completeContraceptiveMedicineData,
    isFetching: completeContraceptiveMedicineFetching,
  } = useGetMedicinesQuery(
    {
      limit: 100,
      contraceptive: true,
      page: contraceptivePagination.currentPage,
      name: contraceptiveSearch,
    },
    { skip: options.skipCompleteContraceptives },
  );

  const completeStockMedicinesOptionsWithOther = useMemo(() => {
    if (!completeStockMedicinesOptions.length) return [];
    return [
      ...completeStockMedicinesOptions,
      {
        id: 0,
        label: "Other",
        value: "Other",
        variants: [],
        category: "",
        contraceptive: false,
        is_otc: false,
      },
    ];
  }, [completeStockMedicinesOptions]);

  useEffect(() => {
    if (!completeStockMedicineData?.data) return;
    stockPagination.setLastPage(completeStockMedicineData.lastPage);
    const newOptions = groupMedicineVariants(
      completeStockMedicineData.data,
      false,
    );
    if (stockPagination.currentPage === 1) {
      setCompleteStockMedicinesOptions(newOptions);
    } else {
      setCompleteStockMedicinesOptions((prev) => {
        const existingValues = new Set(prev.map((o) => o.value));
        const filtered = newOptions.filter((o) => !existingValues.has(o.value));
        return [...prev, ...filtered];
      });
    }
  }, [completeStockMedicineData]);

  useEffect(() => {
    if (!completeContraceptiveMedicineData?.data) return;
    contraceptivePagination.setLastPage(
      completeContraceptiveMedicineData.lastPage,
    );
    const newOptions = groupMedicineVariants(
      completeContraceptiveMedicineData.data,
      false,
    );
    if (contraceptivePagination.currentPage === 1) {
      setPaginatedContraceptiveOptions(newOptions);
    } else {
      setPaginatedContraceptiveOptions((prev) => {
        const existingValues = new Set(prev.map((o) => o.value));
        const filtered = newOptions.filter((o) => !existingValues.has(o.value));
        return [...prev, ...filtered];
      });
    }
  }, [completeContraceptiveMedicineData]);

  useEffect(() => {
    if (!otcMedicinesData?.data) return;
    otcPagination.setLastPage(otcMedicinesData.lastPage);
    const newOptions = groupMedicineVariants(otcMedicinesData.data, false);
    if (otcPagination.currentPage === 1) {
      setPaginatedOtcOptions(newOptions);
    } else {
      setPaginatedOtcOptions((prev) => {
        const existingValues = new Set(prev.map((o) => o.value));
        const filtered = newOptions.filter((o) => !existingValues.has(o.value));
        return [...prev, ...filtered];
      });
    }
  }, [otcMedicinesData]);

  const handleStockSearch = useCallback(
    (value: string) => {
      setStockSearch(value || undefined);
      stockPagination.reset();
    },
    [stockPagination.reset],
  );

  const handleContraceptiveSearch = useCallback(
    (value: string) => {
      setContraceptiveSearch(value || undefined);
      contraceptivePagination.reset();
    },
    [contraceptivePagination.reset],
  );

  const handleOtcSearch = useCallback(
    (value: string) => {
      setOtcSearch(value || undefined);
      otcPagination.reset();
    },
    [otcPagination.reset],
  );

  const supplementOptions = useMemo(() => {
    return groupMedicineVariants(supplementsData?.data || [], true);
  }, [supplementsData]);

  const medicineOptions = useMemo(() => {
    return groupMedicineVariants(medicinesData?.data || [], true);
  }, [medicinesData]);

  //for delivery module
  const medicineOptionsWithoutOther = useMemo(() => {
    return medicineOptions.filter((opt: any) => opt.value !== "Other");
  }, [medicineOptions]);
  //for delivery module

  const shortTermContraceptiveOptions = useMemo(() => {
    if (!shortTermContraceptiveData?.data) return [];
    return groupMedicineVariants(shortTermContraceptiveData?.data || [], false);
  }, [shortTermContraceptiveData]);

  const larcContraceptiveOptions = useMemo(() => {
    if (!larcContraceptiveData?.data) return [];
    return groupMedicineVariants(larcContraceptiveData?.data || [], false);
  }, [larcContraceptiveData]);

  return {
    medicineOptions,
    supplementOptions,
    shortTermContraceptiveOptions,
    otcmedicinesOptions: paginatedOtcOptions,
    larcContraceptiveOptions,
    completeContraceptiveOptions: [
      ...larcContraceptiveOptions,
      ...shortTermContraceptiveOptions,
    ],
    //for delivery module
    medicineOptionsWithoutOther,
    //for delivery module
    completeStockMedicinesOptions,
    refetchOtcMedicines,
    isLoading:
      isLoadingMedicines ||
      isLoadingSupplements ||
      isShortTermContraceptiveLoading ||
      larcContraceptiveLoading ||
      isLoadingOtcMedicine ||
      completeStockMedicineLoading,
    error:
      medicinesError ||
      supplementsError ||
      shortTermContraceptiveError ||
      larcContraceptiveErrors ||
      otcMedicineError ||
      completeStockMedicineDataError,
    stockMedicinePaginationProps: {
      fetchMore: stockPagination.fetchMore,
      isLoadingMore: completeStockMedicineFetching,
      onSearch: handleStockSearch,
    },

    contraceptivePaginationProps: {
      fetchMore: contraceptivePagination.fetchMore,
      isLoadingMore: completeContraceptiveMedicineFetching,
      onSearch: handleContraceptiveSearch,
    },
    paginatedContraceptiveOptions,
    completeStockMedicinesOptionsWithOther,
    otcPaginationProps: {
      fetchMore: otcPagination.fetchMore,
      isLoadingMore: otcMedicineFetching,
      onSearch: handleOtcSearch,
    },
    paginatedOtcOptions,
  };
};
