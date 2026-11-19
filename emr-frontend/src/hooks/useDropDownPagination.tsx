import { useCallback, useRef, useState } from "react";

export const useDropDownPagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastPage, setLastPageState] = useState<number | null>(null);

  const loadingRef = useRef(false);

  const fetchMore = useCallback(() => {
    if (loadingRef.current) return;
    if (lastPage !== null && page >= lastPage) return;

    loadingRef.current = true;
    setIsLoadingMore(true);
    setPage((prev) => prev + 1);
  }, [lastPage, page]);

  const setLastPage = useCallback((value: number | null) => {
    setLastPageState(value);
    loadingRef.current = false;
    setIsLoadingMore(false);
  }, []);

  const reset = useCallback(() => {
    loadingRef.current = false;
    setIsLoadingMore(false);
    setLastPageState(null);
    setPage(initialPage);
  }, [initialPage]);

  return {
    currentPage: page,
    setCurrentPage: setPage,
    isLoadingMore,
    fetchMore,
    reset,
    setLastPage,
  };
};
