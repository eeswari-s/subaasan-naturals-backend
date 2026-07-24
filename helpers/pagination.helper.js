export const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginatedResponse = (docs, total, page, limit) => ({
  docs,
  total,
  totalPages: Math.ceil(total / limit) || 1,
  currentPage: page,
  limit,
});

export const getSort = (query, defaultSort = { createdAt: -1 }) => {
  if (!query.sortBy) return defaultSort;
  const order = query.order === "asc" ? 1 : -1;
  return { [query.sortBy]: order };
};
