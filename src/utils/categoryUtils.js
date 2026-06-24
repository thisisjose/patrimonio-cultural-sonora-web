export const CATEGORY_KEYS = {
  material: "material",
  inmaterial: "inmaterial",
  natural: "natural",
};

export const normalizeCategoryKey = (categoria) => {
  const normalized = String(categoria || "").trim().toLowerCase();
  if (normalized === "biocultural") return CATEGORY_KEYS.natural;
  if (normalized === "natural") return CATEGORY_KEYS.natural;
  if (normalized === "material") return CATEGORY_KEYS.material;
  if (normalized === "inmaterial") return CATEGORY_KEYS.inmaterial;
  return normalized;
};

export const getCategoryLabel = (categoria) => {
  const key = normalizeCategoryKey(categoria);
  if (key === CATEGORY_KEYS.natural) return "Natural";
  if (key === CATEGORY_KEYS.material) return "Material";
  if (key === CATEGORY_KEYS.inmaterial) return "Inmaterial";
  return categoria || "Sin categoría";
};

export const getCategoryClass = (categoria) => {
  return normalizeCategoryKey(categoria);
};

export const isNaturalCategory = (categoria) => {
  return normalizeCategoryKey(categoria) === CATEGORY_KEYS.natural;
};
