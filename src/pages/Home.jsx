import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import mapaIcon from "../Icons/mapa.png";
import historiaIcon from "../Icons/historia.png";
import infoIcon from "../Icons/info.png";
import { getPatrimonios, getMunicipios } from "../services/patrimonioService";

function Home() {
  const navigate = useNavigate();
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

  const API_BASE = "http://localhost:3000";

  // Cargar municipios y todos los patrimonios al montar el componente
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
          // Procesar patrimonios igual que en Dashboard
          const procesados = patrimoniosData.map((item) => ({
            ...item,
            lat: item.latitud,
            lng: item.longitud,
            imagen: item.imagen_url
              ? item.imagen_url.startsWith("http")
                ? item.imagen_url
                : `${API_BASE}${item.imagen_url}`
              : "https://placehold.co/600x400?text=Sin+imagen",
          }));
          setTodosPatrimonios(procesados);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    cargarDatos();
  }, []);

  // Leer parámetro municipioId de la URL y establecer el filtro
  useEffect(() => {
    const municipioIdParam = searchParams.get("municipioId");
    if (municipioIdParam) {
      setMunicipioSeleccionado(municipioIdParam);
    }
  }, [searchParams]);

  // Filtrar patrimonios cuando se selecciona un municipio o categoría
  useEffect(() => {
    const filtered = todosPatrimonios.filter((item) => {
      const matchMunicipio = municipioSeleccionado
        ? String(item.municipioId) === String(municipioSeleccionado)
        : true;
      const matchCategoria = categoriaSeleccionada
        ? String(item.categoria).toLowerCase() === categoriaSeleccionada
        : true;
      return matchMunicipio && matchCategoria;
    });

    setPatrimonios(filtered);
  }, [categoriaSeleccionada, municipioSeleccionado, todosPatrimonios]);

  // Manejar búsqueda en tiempo real
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

  // Cerrar resultados cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar navegación a detalle desde búsqueda
  const handleSelectResultado = (id) => {
    setBusqueda("");
    setMostrarResultados(false);
    navigate(`/patrimonio/${id}`);
  };

  const showCategoryClass = (categoria) =>
    typeof categoria === "string" ? categoria.toLowerCase() : "";

  // Obtener nombre del municipio seleccionado
  const nombreMunicipio = municipioSeleccionado
    ? municipios.find(m => String(m.id) === String(municipioSeleccionado))?.nombre || ""
    : "";

  return (
    <section>
      <div className="page-hero">
        <h1 className="hero-title">Patrimonio cultural del estado de Sonora</h1>
        {nombreMunicipio && (
          <p className="hero-sub">Patrimonios en {nombreMunicipio}</p>
        )}
        {!nombreMunicipio && (
          <p className="hero-sub">Descubre monumentos, festividades y elementos culturales del estado a través de un mapa interactivo que concentra información histórica y visual.</p>
        )}
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon"><img src={mapaIcon} alt="Explorar mapa" /></div>
          <div>
            <div className="feature-title">Explora el   mapa</div>
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

      <div className="municipio-selector-wrapper">
        <div className="municipio-selector-content">
          <div className="search-box-container" ref={searchInputRef}>
            <div className="filter-header">
              <span className="filter-label">Buscar patrimonio</span>
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
                        <span className={`result-badge ${String(item.categoria).toLowerCase()}`}>
                          {item.categoria}
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
              <option value="biocultural">Biocultural</option>
            </select>
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapView patrimonios={patrimonios} expanded={false} />
      </div>

      <section className="popular-section">
        <h2 className="section-title">Lo más popular</h2>
        <div className="popular-row">
          {todosPatrimonios.slice(0, 6).map((item) => (
            <article key={item.id} className="popular-card">
              <div className="popular-thumb">
                <img 
                  src={item.imagen} 
                  alt={item.nombre}
                  onError={(e) => {
                    e.target.src = "https://placehold.co/600x400?text=Sin+imagen";
                  }}
                />
                <span className={`category-badge popular-badge ${showCategoryClass(item.categoria)}`}>{item.categoria}</span>
              </div>
              <div className="popular-content">
                <h3 className="popular-name">{item.nombre}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Home