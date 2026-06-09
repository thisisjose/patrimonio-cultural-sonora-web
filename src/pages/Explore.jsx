import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import { API_HOST } from "../services/apiConfig.js";
import "../styles/pages/Home.css";
import "../styles/pages/Explore.css";

const buildImageUrl = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return null;
  return value.startsWith("http") ? value : `${API_HOST}${value}`;
};

const normalizeImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") return buildImageUrl(image);

  if (typeof image === "object") {
    return (
      buildImageUrl(image.url) ||
      buildImageUrl(image.imagen_url) ||
      buildImageUrl(image.path) ||
      buildImageUrl(image.src)
    );
  }

  return null;
};

const normalizePatrimonio = (item) => {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const categoria = String(item.categoria || "").trim();

  return {
    ...item,
    categoria,
    tags,
    imagen: normalizeImage(item.imagen_url || item.imagen || item.portada),
  };
};

const normalizeTag = (tag) => {
  if (typeof tag === "string") return tag.trim();
  if (tag && typeof tag.nombre === "string") return tag.nombre.trim();
  return String(tag ?? "").trim();
};

const displayCategoryLabel = (categoria) => {
  const normalized = String(categoria || "").trim().toLowerCase();
  if (normalized === "natural") return "Natural";
  if (normalized === "material") return "Material";
  if (normalized === "inmaterial") return "Inmaterial";
  return categoria || "Sin categoría";
};

const getMunicipioName = (item, municipios) => {
  if (item.municipio && typeof item.municipio === "string") {
    return item.municipio;
  }

  if (item.municipio && typeof item.municipio === "object") {
    return item.municipio.nombre || item.municipio.nombre_corto || "Sin municipio";
  }

  const match = municipios.find((municipio) => String(municipio.id) === String(item.municipioId));
  if (match) return match.nombre;

  return "Sin municipio";
};

const filterByMode = (item, mode, value) => {
  if (!mode || !value) return false;

  const normalizedValue = String(value).trim().toLowerCase();
  if (mode === "categoria") {
    return String(item.categoria || "").trim().toLowerCase() === normalizedValue;
  }

  if (mode === "tag") {
    return item.tags.some((tag) => normalizeTag(tag).toLowerCase() === normalizedValue);
  }

  return false;
};

function Explore() {
  const location = useLocation();
  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";
  const { mode, value } = useParams();
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizedValue = decodeURIComponent(value || "").trim();
  const titleValue = mode === "categoria"
    ? displayCategoryLabel(normalizedValue)
    : normalizedValue;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [patrimoniosData, municipiosData] = await Promise.all([
          getPatrimonios(),
          getMunicipios(),
        ]);

        const normalized = (Array.isArray(patrimoniosData) ? patrimoniosData : []).map(normalizePatrimonio);
        setPatrimonios(normalized);
        setMunicipios(Array.isArray(municipiosData) ? municipiosData : []);
      } catch (err) {
        setError("No se pudieron cargar los patrimonios. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mode, value]);

  const filteredPatrimonios = useMemo(() => {
    return patrimonios.filter((item) => filterByMode(item, mode, normalizedValue));
  }, [mode, normalizedValue, patrimonios]);

  const groupsByMunicipio = useMemo(() => {
    const grouped = filteredPatrimonios.reduce((acc, item) => {
      const nombreMunicipio = getMunicipioName(item, municipios);
      const key = nombreMunicipio || "Sin municipio";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPatrimonios, municipios]);

  const validMode = mode === "categoria" || mode === "tag";

  return (
    <main className="page page-explore">
      <section className="explore-header">
        <div>
          <h1 className="section-title">
            {validMode ? (
              mode === "categoria"
                ? `Patrimonios de categoría: ${titleValue}`
                : `Patrimonios con el tag: ${titleValue}`
            ) : "Explorar patrimonios"}
          </h1>
          <p className="lead explore-summary">
            {validMode ? (
              loading ? "Buscando resultados..." : `${filteredPatrimonios.length} patrimonios encontrados.`
            ) : "Selecciona una categoría o tag válido desde el detalle de un patrimonio."}
          </p>
        </div>
        <Link to={adminBase || "/"} className="btn-primary">Volver al inicio</Link>
      </section>

      {error && <p className="alert alert-error">{error}</p>}

      {!validMode && (
        <div className="explore-empty">
          <p>No hay resultados porque la ruta de exploración no es válida.</p>
        </div>
      )}

      {validMode && !loading && filteredPatrimonios.length === 0 && (
        <div className="explore-empty">
          <p>No se encontraron patrimonios para {mode === "categoria" ? `la categoría ${titleValue}` : `el tag ${titleValue}`}.</p>
        </div>
      )}

      {validMode && loading && (
        <div className="explore-empty">
          <p>Cargando patrimonios...</p>
        </div>
      )}

      {validMode && !loading && filteredPatrimonios.length > 0 && (
        <div className="explore-results">
          {groupsByMunicipio.map(([municipioName, items]) => (
            <section key={municipioName} className="explore-group">
              <div className="explore-group-header">
                <div className="explore-group-meta">
                  <span className="explore-group-title">{municipioName}</span>
                  <span className="explore-group-sep" aria-hidden> | </span>
                  <span className="explore-group-count">{items.length} patrimonio{items.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="explore-card-list">
                {items.map((item) => {
                  const municipioName = getMunicipioName(item, municipios);
                  return (
                    <Link
                      key={item.id}
                      to={`${adminBase}/patrimonio/${item.id}`}
                      className="patrimonio-card patrimonio-card-link"
                      aria-label={`Ver detalle de ${item.nombre}`}
                    >
                      <div className="patrimonio-thumb">
                        <img src={item.imagen || "/placeholder.jpg"} alt={item.nombre || "Patrimonio"} />
                      </div>
                      <div className="patrimonio-meta">
                        <h3 className="patrimonio-name">{item.nombre}</h3>
                        <div className="detail-tags-below">
                          <span className={`category-badge ${String(item.categoria || "").toLowerCase()}`}>
                            {displayCategoryLabel(item.categoria)}
                          </span>
                        </div>
                        <p className="patrimonio-desc">{municipioName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

export default Explore;
