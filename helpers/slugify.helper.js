import slugify from "slugify";

const toSlug = (text) => slugify(text, { lower: true, strict: true, trim: true });

export const generateUniqueSlug = async (Model, text, excludeId = null) => {
  const baseSlug = toSlug(text);
  let slug = baseSlug;
  let counter = 1;

  const query = (candidate) => {
    const q = { slug: candidate };
    if (excludeId) q._id = { $ne: excludeId };
    return Model.findOne(q);
  };

  while (await query(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

export default toSlug;
