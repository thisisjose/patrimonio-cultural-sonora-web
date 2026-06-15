import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import "../styles/pages/Catalogo.css";
import "../styles/pages/Explore.css";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey } from "../utils/categoryUtils";

const API_BASE = "http://localhost:3000";
const ITEMS_POR_PAGINA = 4;

const buildImageUrl = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return null;
  return value.startsWith("http") ? value : `${API_BASE}${value}`;
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
  return {
    ...item,
    categoria: String(item.categoria || "").trim(),
    imagen: normalizeImage(item.imagen_url || item.imagen || item.portada),
  };
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

function Catalogo() {
  const location = useLocation();
  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";
  
  const [todosPatrimonios, setTodosPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [paginasPorMunicipio, setPaginasPorMunicipio] = useState({});
  const [mostrarBotonVolver, setMostrarBotonVolver] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const botonVolverRef = useRef(null);

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [patrimoniosData, municipiosData] = await Promise.all([
          getPatrimonios(),
          getMunicipios(),
        ]);

        if (Array.isArray(patrimoniosData)) {
          const procesados = patrimoniosData.map(normalizePatrimonio);
          setTodosPatrimonios(procesados);
        }
        setMunicipios(Array.isArray(municipiosData) ? municipiosData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    cargarDatos();
  }, []);

  // Filtrar patrimonios
  const patrimoniosFiltrados = useMemo(() => {
    let resultado = todosPatrimonios;

    // Filtro por búsqueda
    if (busqueda.trim() !== "") {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.nombre.toLowerCase().includes(termino) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(termino))
      );
    }

    // Filtro por categoría
    if (categoriaSeleccionada) {
      resultado = resultado.filter(
        (item) => normalizeCategoryKey(item.categoria) === categoriaSeleccionada
      );
    }

    return resultado;
  }, [todosPatrimonios, busqueda, categoriaSeleccionada]);

  // Agrupar por municipio (ordenado alfabéticamente)
  const gruposPorMunicipio = useMemo(() => {
    const grouped = patrimoniosFiltrados.reduce((acc, item) => {
      const nombreMunicipio = getMunicipioName(item, municipios);
      const key = nombreMunicipio || "Sin municipio";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [patrimoniosFiltrados, municipios]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setPaginasPorMunicipio({});
  }, [busqueda, categoriaSeleccionada]);

  // Manejar scroll para mostrar/ocultar botón volver arriba
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const threshold = 400;

      if (scrollTop > threshold && !isScrolling) {
        setMostrarBotonVolver(true);
        setIsScrolling(true);
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        if (scrollTop <= threshold) {
          setMostrarBotonVolver(false);
        }
      }, 3000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isScrolling]);

  // Manejar cambio de página por municipio
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

  // Manejar botón volver arriba
  const handleVolverArriba = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMostrarBotonVolver(false);
  };

  return (
    <main className="page page-explore">
      <section className="explore-header catalogo-header-section">
        <div>
          <h1 className="section-title">Catálogo completo</h1>
          <p className="lead explore-summary">
            {gruposPorMunicipio.length > 0
              ? `${patrimoniosFiltrados.length} patrimonios en ${gruposPorMunicipio.length} municipio${gruposPorMunicipio.length !== 1 ? "s" : ""}`
              : "No hay patrimonios registrados"}
          </p>
        </div>
        <Link to={adminBase || "/"} className="btn-primary">
          Volver al inicio
        </Link>
      </section>

      {/* Sección de Filtros */}
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
      </div>

      {/* Grupos por Municipio */}
      {gruposPorMunicipio.length > 0 ? (
        <div className="explore-results">
          {gruposPorMunicipio.map(([municipioName, items]) => {
            const paginaActual = paginasPorMunicipio[municipioName] || 1;
            const totalPaginas = Math.ceil(items.length / ITEMS_POR_PAGINA);
            const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
            const itemsPaginados = items.slice(
              indiceInicio,
              indiceInicio + ITEMS_POR_PAGINA
            );

            return (
              <section key={municipioName} className="explore-group">
                <div className="explore-group-header">
                  <div className="explore-group-meta">
                    <span className="explore-group-title">{municipioName}</span>
                    <span className="explore-group-sep" aria-hidden>
                      {" "}
                      |{" "}
                    </span>
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
                            <span
                              className={`category-badge ${getCategoryClass(item.categoria)}`}
                            >
                              {displayCategoryLabel(item.categoria)}
                            </span>
                          </div>
                          <p className="patrimonio-desc">{nombreMunicipio}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Paginación por Municipio */}
                {totalPaginas > 1 && (
                  <div className="catalogo-municipio-pagination">
                    <button
                      className="catalogo-page-btn"
                      onClick={() =>
                        handleCambiarPagina(municipioName, paginaActual - 1)
                      }
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
                          className={`catalogo-page-num ${
                            num === paginaActual ? "active" : ""
                          }`}
                          onClick={() => handleCambiarPagina(municipioName, num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      className="catalogo-page-btn"
                      onClick={() =>
                        handleCambiarPagina(municipioName, paginaActual + 1)
                      }
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
      ) : (
        <div className="explore-empty">
          <p>No se encontraron patrimonios con los filtros seleccionados.</p>
        </div>
      )}

      {/* Botón Volver Arriba */}
      <button
        ref={botonVolverRef}
        className={`catalogo-scroll-top ${mostrarBotonVolver ? "visible" : ""}`}
        onClick={handleVolverArriba}
        aria-label="Volver al inicio"
        title="Volver al inicio"
      >
        ↑
      </button>
    </main>
  );
}

export default Catalogo;
