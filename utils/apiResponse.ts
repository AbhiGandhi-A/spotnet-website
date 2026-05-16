// Centralized API response utility
export function apiResponse<T>(data: T, status = 200) {
  return {
    status,
    body: { success: true, data },
  };
}

export function apiError(error: string, status = 500, details?: any) {
  return {
    status,
    body: { success: false, error, details },
  };
}
