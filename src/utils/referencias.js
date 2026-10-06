export const normalizeReferencias = (value) => {
  let references = value;

  if (typeof references === "string") {
    try {
      references = JSON.parse(references);
    } catch {
      references = references
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ titulo: "", autorInstitucion: "", url }));
    }
  }

  if (!Array.isArray(references)) return [];

  return references
    .filter((reference) => reference && typeof reference === "object")
    .map((reference) => {
      const titulo =
        typeof reference.titulo === "string" ? reference.titulo : "";
      const autorInstitucion =
        typeof reference.autorInstitucion === "string"
          ? reference.autorInstitucion
          : "";

      return {
        titulo,
        autorInstitucion,
        url: typeof reference.url === "string" ? reference.url : "",
        _legacy: !titulo.trim() && !autorInstitucion.trim(),
      };
    });
};

export const isAllowedReferenceUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
