import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import slugify from "../utils/slugify";
import "../styles/pages/Catalogo.css";
import "../styles/pages/Explore.css";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey } from "../utils/categoryUtils";
import { API_HOST } from "../services/apiConfig.js"; 

const ITEMS_POR_PAGINA = 4;

const buildImageUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http")) return value;
  return `${API_HOST}${value}`;
};

const normalizeImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") {
    const url = buildImageUrl(image);
    return url || "https://placehold.co/600x400?text=Sin+imagen";
  }
  if (typeof image === "object") {
    const url =
      buildImageUrl(image.url) ||
      buildImageUrl(image.imagen_url) ||
      buildImageUrl(image.path) ||
      buildImageUrl(image.src);
    return url || "https://placehold.co/600x400?text=Sin+imagen";
  }
  return "https://placehold.co/600x400?text=Sin+imagen";
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
  if (!item) return null;
  if (item.municipio && typeof item.municipio === "string") {
    const value = item.municipio.trim();
    return value || null;
  }
  if (item.municipio && typeof item.municipio === "object") {
    return item.municipio.nombre?.trim() || item.municipio.nombre_corto?.trim() || null;
  }
  if (item.municipioNombre) {
    const value = String(item.municipioNombre).trim();
    return value || null;
  }
  if (item.municipio_nombre) {
    const value = String(item.municipio_nombre).trim();
    return value || null;
  }
  const match = municipios.find((municipio) => String(municipio.id) === String(item.municipioId));
  if (match) return match.nombre?.trim() || null;
  return null;
};

function Catalogo() {
  const location = useLocation();
  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";
  
  const [todosPatrimonios, setTodosPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
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

  // Filtrar patrimonios (igual que antes)
  const patrimoniosFiltrados = useMemo(() => {
    let resultado = todosPatrimonios;

    if (busqueda.trim() !== "") {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.nombre.toLowerCase().includes(termino) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(termino))
      );
    }

    if (municipioSeleccionado) {
      resultado = resultado.filter(
        (item) => getMunicipioName(item, municipios) === municipioSeleccionado
      );
    }

    if (categoriaSeleccionada) {
      resultado = resultado.filter(
        (item) => normalizeCategoryKey(item.categoria) === categoriaSeleccionada
      );
    }

    return resultado;
  }, [todosPatrimonios, busqueda, municipioSeleccionado, categoriaSeleccionada, municipios]);

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
}, [busqueda, categoriaSeleccionada, municipioSeleccionado]);

// Manejar scroll para mostrar/ocultar botón volver arriba (Versión Estable)
useEffect(() => {
  let listoParaDetectar = false;

  // 1. Ocultamos el botón por defecto al entrar a la sección
  setMostrarBotonVolver(false);

  // 2. Le damos 400ms de "ceguera" al listener. 
  // Esto asegura que el ScrollToTop ya te llevó a (0,0) antes de evaluar.
  const timer = setTimeout(() => {
    listoParaDetectar = true;
    
    // Opcional: Revisar dónde quedó el scroll después del tiempo de espera
    // por si el usuario scrolleó súper rápido al entrar
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    if (currentScroll > 400) {
      setMostrarBotonVolver(true);
    }
  }, 400);

  const handleScroll = () => {
    // Si estamos en los primeros 400ms del cambio de página, ignoramos todo
    if (!listoParaDetectar) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const threshold = 400;

    if (scrollTop > threshold) {
      setMostrarBotonVolver(true);
    } else {
      setMostrarBotonVolver(false);
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    // Limpiamos tanto el timer como el evento para evitar fugas de memoria
    clearTimeout(timer);
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

  // Manejar cambio de página por municipio
  const handleCambiarPagina = (municipioName, nuevaPagina) => {
    setPaginasPorMunicipio((prev) => ({
      ...prev,
      [municipioName]: nuevaPagina,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
};

useEffect(() => {
  let listoParaDetectar = false;

  // 1. Ocultamos el botón inmediatamente al montar
  setMostrarBotonVolver(false);

  // 2. Esperamos a que el navegador dibuje los primeros cuadros de la página
  // Esto asegura que el reseteo de ventana ya ocurrió en el DOM móvil
  const frameId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      listoParaDetectar = true;
    });
  });

  const handleScroll = () => {
    // Si aún no se ha completado el render inicial o la posición sigue en 0, no evaluamos
    if (!listoParaDetectar) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Si la posición de scroll es 0 (estamos arriba), nos aseguramos de mantenerlo oculto
    if (scrollTop <= 400) {
      setMostrarBotonVolver(false);
    } else {
      setMostrarBotonVolver(true);
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

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

        <div className="catalogo-municipio-filter">
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
              <option key={municipio.id} value={municipio.nombre}>
                {municipio.nombre}
              </option>
            ))}
          </select>
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
                        to={(() => {
                          const municipioNombre = getMunicipioName(item, municipios);
                          const municipioSlug = municipioNombre ? `/${slugify(municipioNombre)}` : "";
                          return `${adminBase}${municipioSlug}/${slugify(item.nombre)}`;
                        })()}
                        className="patrimonio-card patrimonio-card-link"
                        aria-label={`Ver detalle de ${item.nombre}`}
                      >
                        <div className="patrimonio-thumb">
                          <img
                            src={item.imagen || "/placeholder.jpg"}
                            alt={item.nombre || "Patrimonio"}
                            onError={(e) => {
                              e.target.src = "https://placehold.co/600x400?text=Sin+imagen";
                            }}
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