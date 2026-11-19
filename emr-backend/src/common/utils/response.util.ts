export function successResponse<T>(
  data: T,
  message = 'Request successful',
  status = 200,
  page?: number,
  limit?: number,
  count?: number,
) {
  const response: any = {
    success: true,
    status,
    data,
    message: count === 0 ? 'No Data Found' : message,
  };

  if (page !== undefined && limit !== undefined && count !== undefined) {
    response.page = page;
    response.limit = limit;
    response.count = count;
    response.lastPage = Math.ceil(count / limit);
  }

  return response;
}

export function errorResponse(
  message = 'Something went wrong',
  code = 500,
  error: any = null,
) {
  return {
    success: false,
    code,
    message,
    error,
  };
}
