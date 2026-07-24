export const buildProductFilter = (query) => {
  const filter = { status: "active" };

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = { $regex: query.brand, $options: "i" };

  if (query.minPrice || query.maxPrice) {
    filter.sellingPrice = {};
    if (query.minPrice) filter.sellingPrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.sellingPrice.$lte = Number(query.maxPrice);
  }

  if (query.minRating) {
    filter.averageRating = { $gte: Number(query.minRating) };
  }

  if (query.inStock === "true") {
    filter["variants.stock"] = { $gt: 0 };
  }

  if (query.minDiscount) {
    filter.discountPercentage = { $gte: Number(query.minDiscount) };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.isFeatured === "true") filter.isFeatured = true;
  if (query.isBestSeller === "true") filter.isBestSeller = true;
  if (query.isTrending === "true") filter.isTrending = true;
  if (query.isNewArrival === "true") filter.isNewArrival = true;
  if (query.isTodaysDeal === "true") filter.isTodaysDeal = true;

  return filter;
};

export const buildDateRangeFilter = (query, field = "createdAt") => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter[field] = {};
    if (query.startDate) filter[field].$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  return filter;
};
