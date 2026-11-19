import { useCallback, useState } from "react";

export interface TablePagination {
  page: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  reset: () => void;
  setPage: (page: number) => void;
}

export function useTablePagination(
  fetch: (page: number, pageSize: number) => void,
  defaultPageSize = 10,
): TablePagination {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const onChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      const resolvedPage = nextPageSize !== pageSize ? 1 : nextPage;
      setPage(resolvedPage);
      setPageSize(nextPageSize);
      fetch(resolvedPage, nextPageSize);
    },
    [fetch, pageSize],
  );

  const reset = useCallback(() => setPage(1), []);

  return { page, pageSize, onChange, reset, setPage };
}
