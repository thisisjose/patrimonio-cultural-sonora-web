import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import MapView from "../components/MapView";
import PatrimonioStatsCard from "../components/PatrimonioStatsCard";
import "../styles/pages/Home.css";
import mapaIcon from "../Icons/mapa.png";
import historiaIcon from "../Icons/historia.png";
import infoIcon from "../Icons/info.png";
import { getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import slugify from "../utils/slugify";
import { API_HOST } from "../services/apiConfig.js";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey, isNaturalCategory } from "../utils/categoryUtils";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [todosPatrimonios, setTodosPatrimonios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [statsData, setStatsData] = useState({ material: 0, inmaterial: 0, natural: 0 });

  const parseUbicaciones = (ubicaciones) => {
    if (!ubicaciones) return [];
    if (typeof ubicaciones === "string") {
      try {
        const parsed = JSON.parse(ubicaciones);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(ubicaciones) ? ubicaciones : [];
  };

  const normalizePatrimonioItem = (item) => {
    const ubicaciones = parseUbicaciones(item.ubicaciones)
      .map((ubi) => ({
        ...ubi,
        latitud: ubi.latitud ?? ubi.lat ?? null,
        longitud: ubi.longitud ?? ubi.lng ?? null,
        nombre_punto: ubi.nombre_punto || ubi.nombre || "",
      }))
      .filter((ubi) => ubi.latitud != null && ubi.longitud != null);

    const primeraUbicacion = ubicaciones[0];
    const lat = item.latitud ?? item.lat ?? primeraUbicacion?.latitud ?? null;
    const lng = item.longitud ?? item.lng ?? primeraUbicacion?.longitud ?? null;

    const imagen = item.imagen_url
      ? item.imagen_url.startsWith("http")
        ? item.imagen_url
        : `${API_HOST}${item.imagen_url}`
      : "https://placehold.co/600x400?text=Sin+imagen";

    return {
      ...item,
      ubicaciones,
      lat,
      lng,
      imagen,
    };
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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [municipiosData, patrimoniosData] = await Promise.all([
          getMunicipios(),
          getPatrimonios()
        ]);

        if (Array.isArray(municipiosData)) {
          setMunicipios(municipiosData);
        }

        if (Array.isArray(patrimoniosData)) {
          const procesados = patrimoniosData.map((item) => normalizePatrimonioItem(item));
          setTodosPatrimonios(procesados);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const municipioIdParam = searchParams.get("municipioId");
    if (municipioIdParam) {
      setMunicipioSeleccionado(municipioIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const filtered = todosPatrimonios.filter((item) => {
      const matchMunicipio = municipioSeleccionado
        ? String(item.municipioId) === String(municipioSeleccionado)
        : true;
      const matchCategoria = categoriaSeleccionada
        ? normalizeCategoryKey(item.categoria) === categoriaSeleccionada
        : true;
      return matchMunicipio && matchCategoria;
    });

    setPatrimonios(filtered);
  }, [categoriaSeleccionada, municipioSeleccionado, todosPatrimonios]);

  useEffect(() => {
    const materialCount = todosPatrimonios.filter(
      (item) => normalizeCategoryKey(item.categoria) === "material"
    ).length;
    const inmaterialCount = todosPatrimonios.filter(
      (item) => normalizeCategoryKey(item.categoria) === "inmaterial"
    ).length;
    const naturalCount = todosPatrimonios.filter(
      (item) => isNaturalCategory(item.categoria)
    ).length;

    setStatsData({
      material: materialCount,
      inmaterial: inmaterialCount,
      natural: naturalCount,
    });
  }, [todosPatrimonios]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultadosBusqueda([]);
      setMostrarResultados(false);
      return;
    }

    const termino = busqueda.toLowerCase();
    const resultados = todosPatrimonios.filter((item) =>
      item.nombre.toLowerCase().includes(termino) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(termino))
    );

    setResultadosBusqueda(resultados);
    setMostrarResultados(true);
  }, [busqueda, todosPatrimonios]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";

  const handleSelectResultado = (id) => {
    setBusqueda("");
    setMostrarResultados(false);
    const item = resultadosBusqueda.find(r => String(r.id) === String(id));
    const municipioName = item ? getMunicipioName(item, municipios) : null;
    const municipioSlug = municipioName ? slugify(municipioName) : null;
    const slug = item ? slugify(item.nombre) : id;
    const path = municipioSlug
      ? `${adminBase}/${municipioSlug}/${slug}`
      : `${adminBase}/patrimonio/${id}`;
    navigate(path);
  };

  const handleNavigateToDetalle = (id) => {
    const item = todosPatrimonios.find(r => String(r.id) === String(id));
    const municipioName = item ? getMunicipioName(item, municipios) : null;
    const municipioSlug = municipioName ? slugify(municipioName) : null;
    const slug = item ? slugify(item.nombre) : id;
    const path = municipioSlug
      ? `${adminBase}/${municipioSlug}/${slug}`
      : `${adminBase}/patrimonio/${id}`;
    navigate(path);
  };

  const showCategoryClass = (categoria) =>
    typeof categoria === "string" ? categoria.toLowerCase() : "";

  const getRandomItems = (items, count) => {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };

  const patrimoniosAleatorios = useMemo(
    () => getRandomItems(todosPatrimonios, 12),
    [todosPatrimonios]
  );

  const nombreMunicipio = municipioSeleccionado
    ? municipios.find(m => String(m.id) === String(municipioSeleccionado))?.nombre || ""
    : "";

  return (
    <section>
      <div className="page-hero">
        <h1 className="hero-title">Cátalogo de patrimonio cultural  del estado de Sonora</h1>
        {nombreMunicipio && (
          <p className="hero-sub">Patrimonios en {nombreMunicipio}</p>
        )}
        {!nombreMunicipio && (
          <p className="hero-sub">El Catálogo de Patrimonio Cultural del estado de Sonora es un instrumento de registro, salvaguarda y difusión del acervo que conforma la identidad del estado. A través de él, la ciudadanía, investigadores e instituciones acceden a información sistematizada sobre bienes materiales, inmateriales y naturales que constituyen el legado colectivo de Sonora. Este esfuerzo conjunto permite integrar un registro representativo, incluyente y en permanente actualización del patrimonio cultural del estado.</p>
        )}
      </div>

      <PatrimonioStatsCard
        material={statsData.material}
        inmaterial={statsData.inmaterial}
        natural={statsData.natural}
      />

      <div className="municipio-selector-wrapper">
        <div className="municipio-selector-content">
          <div className="search-box-container" ref={searchInputRef}>
            <div className="filter-header">
              <span className="filter-label">Buscar en el catálogo</span>
            </div>
            <div className="search-box-input-wrapper">
              <input
                type="text"
                placeholder="Escribe el nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onFocus={() => busqueda.trim() !== "" && setMostrarResultados(true)}
                className="patrimonio-search-input"
              />
              {busqueda && (
                <button
                  className="search-clear-btn"
                  onClick={() => {
                    setBusqueda("");
                    setMostrarResultados(false);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            
            {mostrarResultados && resultadosBusqueda.length > 0 && (
              <div className="search-results-dropdown">
                {resultadosBusqueda.map((item) => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => handleSelectResultado(item.id)}
                  >
                    <div className="result-image">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        onError={(e) => {
                          e.target.src = "https://placehold.co/50x50?text=Sin+img";
                        }}
                      />
                    </div>
                    <div className="result-content">
                      <div className="result-name">{item.nombre}</div>
                      <div className="result-category">
                        <span className={`result-badge ${getCategoryClass(item.categoria)}`}>
                          {getCategoryLabel(item.categoria)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mostrarResultados && busqueda.trim() !== "" && resultadosBusqueda.length === 0 && (
              <div className="search-no-results">
                No se encontraron patrimonios
              </div>
            )}
          </div>

          <div>
            <div className="filter-header">
              <span className="filter-label">Filtrar por municipio</span>
            </div>
            <select
              id="municipio-select"
              value={municipioSeleccionado}
              onChange={(e) => setMunicipioSeleccionado(e.target.value)}
              className="municipio-select-main"
            >
              <option value="">Todos los municipios</option>
              {municipios.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="filter-header">
              <span className="filter-label">Filtrar por categoría</span>
            </div>
            <select
              id="categoria-select"
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="municipio-select-main"
            >
              <option value="">Todas las categorías</option>
              <option value="material">Material</option>
              <option value="inmaterial">Inmaterial</option>
              <option value="natural">Natural</option>
            </select>
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapView patrimonios={patrimonios} expanded={false} municipios={municipios} />
      </div>

      <section className="popular-section">
        <h2 className="section-title">Consulta el catálogo</h2>
        <div className="catalogo-button-container">
          <button
            className="catalogo-view-btn"
            onClick={() => navigate(`${adminBase}/catalogo`)}
          >
            Ver catálogo completo →
          </button>
        </div>
        <div className="popular-row">
          {patrimoniosAleatorios.map((item) => (
            <article
              key={item.id}
              className="popular-card"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigateToDetalle(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigateToDetalle(item.id);
                }
              }}
            >
              <div className="popular-thumb">
                <img 
                  src={item.imagen} 
                  alt={item.nombre}
                  onError={(e) => {
                    e.target.src = "https://placehold.co/600x400?text=Sin+imagen";
                  }}
                />
              </div>
              <div className="popular-content">
                <h3 className="popular-name">{item.nombre}</h3>
                <div className="popular-badges-container">
                  {getMunicipioName(item, municipios) && (
                    <span className="popular-municipio-badge">
                      {getMunicipioName(item, municipios)}
                    </span>
                  )}
                  <span className={`popular-category-badge ${getCategoryClass(item.categoria)}`}>
                    {getCategoryLabel(item.categoria)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="catalogo-button-container">
          <button
            className="catalogo-view-btn"
            onClick={() => navigate(`${adminBase}/catalogo`)}
          >
            Ver catálogo completo →
          </button>
        </div>
      </section>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon"><img src={mapaIcon} alt="Explorar mapa" /></div>
          <div>
            <div className="feature-title">Explora el mapa</div>
            <div className="feature-desc">Navega fácilmente por sitios históricos y festividades locales con información práctica y fotos.</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><img src={historiaIcon} alt="Aprender historia" /></div>
          <div>
            <div className="feature-title">Aprende sobre la historia</div>
            <div className="feature-desc">Cada punto incluye contexto histórico breve y referencias para profundizar en el patrimonio.</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><img src={infoIcon} alt="Información accesible" /></div>
          <div>
            <div className="feature-title">Información accesible</div>
            <div className="feature-desc">Datos completos y verificados de cada sitio: Nombre, ubicación y descripción.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home