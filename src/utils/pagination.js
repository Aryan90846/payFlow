export function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResult(items, total, page, limit) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function paginate(modelQuery, countQuery, { page, limit, skip }) {
  const [items, total] = await Promise.all([
    modelQuery.skip(skip).limit(limit),
    countQuery,
  ]);
  return paginatedResult(items, total, page, limit);
}
