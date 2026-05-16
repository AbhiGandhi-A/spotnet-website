// Pagination utility
export function getPagination(page = 1, limit = 50) {
  const skip = (Number(page) - 1) * Number(limit);
  return { skip, limit: Number(limit) };
}
