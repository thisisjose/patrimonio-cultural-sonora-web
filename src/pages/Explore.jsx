import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import { API_HOST } from "../services/apiConfig.js";
import "../styles/pages/Home.css";
import "../styles/pages/Explore.css";
import "../styles/pages/Catalogo.css";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey } from "../utils/categoryUtils";

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
  return getCategoryLabel(categoria);
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

  const normalizedValue = mode === "categoria" ? normalizeCategoryKey(value) : String(value).trim().toLowerCase();
  if (mode === "categoria") {
    return normalizeCategoryKey(item.categoria) === normalizedValue;
  }

  if (mode === "tag") {
    return item.tags.some((tag) => normalizeTag(tag).toLowerCase() === normalizedValue);
  }

  return false;
};

function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";
  const { mode, value } = useParams();
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [paginasPorMunicipio, setPaginasPorMunicipio] = useState({});
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
    let resultado = patrimonios.filter((item) => filterByMode(item, mode, normalizedValue));

    if (busqueda.trim() !== "") {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.nombre.toLowerCase().includes(termino) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(termino))
      );
    }

    if (categoriaSeleccionada) {
      resultado = resultado.filter(
        (item) => normalizeCategoryKey(item.categoria) === categoriaSeleccionada
      );
    }

    if (municipioSeleccionado) {
      resultado = resultado.filter(
        (item) => getMunicipioName(item, municipios) === municipios.find((m) => String(m.id) === String(municipioSeleccionado))?.nombre
      );
    }

    return resultado;
  }, [patrimonios, mode, normalizedValue, busqueda, categoriaSeleccionada, municipioSeleccionado, municipios]);

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

  useEffect(() => {
    setPaginasPorMunicipio({});
  }, [busqueda, categoriaSeleccionada, municipioSeleccionado, mode, value]);

  const handleCambiarPagina = (municipioName, nuevaPagina) => {
    setPaginasPorMunicipio((prev) => ({
      ...prev,
      [municipioName]: nuevaPagina,
    }));
  };

  const getPageNumbers = (paginaActual, totalPaginas) => {
    const inicio = Math.max(1, paginaActual - 1);
    const longitud = Math.min(3, totalPaginas - (inicio - 1));
    return Array.from({ length: longitud }, (_, i) => inicio + i).filter(
      (numero) => numero >= 1 && numero <= totalPaginas
    );
  };

  const handleVolverAtras = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(adminBase || "/");
    }
  };

  const validMode = mode === "categoria" || mode === "tag";

  return (
    <main className="page page-explore">
      {mode === "tag" || !validMode ? (
        <nav className="breadcrumbs explore-breadcrumbs">
          <Link to="/">Inicio</Link>
          <span className="crumb-sep">›</span>
          <Link to={`${adminBase}/explorar`}>Explorar</Link>
          <span className="crumb-sep">›</span>
          {validMode ? (
            <span className="crumb-current">
              {mode === "categoria"
                ? `Categoría: ${titleValue}`
                : `Tag: ${titleValue}`}
            </span>
          ) : (
            <span className="crumb-current">Explorar</span>
          )}
        </nav>
      ) : null}

      <section className="explore-header catalogo-header-section">
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
        <button type="button" className="btn-primary" onClick={handleVolverAtras}>
          Volver atrás
        </button>
      </section>

      {validMode && (
        <div className="catalogo-filters-section">
          <div className="catalogo-search-box">
            <div className="filter-header">
              <span className="filter-label">Buscar patrimonio</span>
            </div>
            <div className="catalogo-search-input-wrapper">
              <input
                type="text"
                placeholder="Escribe el nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="catalogo-search-input"
              />
              {busqueda && (
                <button
                  className="catalogo-search-clear-btn"
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {mode !== "categoria" && (
            <div className="catalogo-category-filter">
              <div className="filter-header">
                <span className="filter-label">Filtrar por categoría</span>
              </div>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                className="catalogo-select"
              >
                <option value="">Todas</option>
                <option value="material">Material</option>
                <option value="inmaterial">Inmaterial</option>
                <option value="natural">Natural</option>
              </select>
            </div>
          )}

          <div className="catalogo-category-filter">
            <div className="filter-header">
              <span className="filter-label">Filtrar por municipio</span>
            </div>
            <select
              value={municipioSeleccionado}
              onChange={(e) => setMunicipioSeleccionado(e.target.value)}
              className="catalogo-select"
            >
              <option value="">Todos los municipios</option>
              {municipios.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
          {groupsByMunicipio.map(([municipioName, items]) => {
            const paginaActual = paginasPorMunicipio[municipioName] || 1;
            const totalPaginas = Math.ceil(items.length / 4);
            const indiceInicio = (paginaActual - 1) * 4;
            const itemsPaginados = items.slice(indiceInicio, indiceInicio + 4);

            return (
              <section key={municipioName} className="explore-group">
                <div className="explore-group-header">
                  <div className="explore-group-meta">
                    <span className="explore-group-title">{municipioName}</span>
                    <span className="explore-group-sep" aria-hidden> | </span>
                    <span className="explore-group-count">
                      {items.length} patrimonio{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="explore-card-list catalogo-explore-card-list">
                  {itemsPaginados.map((item) => {
                    const nombreMunicipio = getMunicipioName(item, municipios);
                    return (
                      <Link
                        key={item.id}
                        to={`${adminBase}/patrimonio/${item.id}`}
                        className="patrimonio-card patrimonio-card-link"
                        aria-label={`Ver detalle de ${item.nombre}`}
                      >
                        <div className="patrimonio-thumb">
                          <img
                            src={item.imagen || "/placeholder.jpg"}
                            alt={item.nombre || "Patrimonio"}
                          />
                        </div>
                        <div className="patrimonio-meta">
                          <h3 className="patrimonio-name">{item.nombre}</h3>
                          <div className="detail-tags-below">
                            <span className={`category-badge ${getCategoryClass(item.categoria)}`}>
                              {displayCategoryLabel(item.categoria)}
                            </span>
                          </div>
                          <p className="patrimonio-desc">{nombreMunicipio}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {totalPaginas > 1 && (
                  <div className="catalogo-municipio-pagination">
                    <button
                      className="catalogo-page-btn"
                      onClick={() => handleCambiarPagina(municipioName, paginaActual - 1)}
                      disabled={paginaActual === 1}
                      aria-label="Página anterior"
                    >
                      ← Anterior
                    </button>

                    <div className="catalogo-page-numbers">
                      {paginaActual > 2 && totalPaginas > 3 && (
                        <>
                          <button
                            className="catalogo-page-num"
                            onClick={() => handleCambiarPagina(municipioName, 1)}
                          >
                            1
                          </button>
                          {paginaActual > 3 && (
                            <span className="pagination-dots">...</span>
                          )}
                        </>
                      )}

                      {getPageNumbers(paginaActual, totalPaginas).map((num) => (
                        <button
                          key={num}
                          className={`catalogo-page-num ${num === paginaActual ? "active" : ""}`}
                          onClick={() => handleCambiarPagina(municipioName, num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      className="catalogo-page-btn"
                      onClick={() => handleCambiarPagina(municipioName, paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      aria-label="Página siguiente"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Explore;
