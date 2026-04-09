import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import mapaIcon from "../Icons/mapa.png";
import historiaIcon from "../Icons/historia.png";
import infoIcon from "../Icons/info.png";
import { getPatrimonios, getMunicipios } from "../services/patrimonioService";

function Home() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState("");
  const [todosPatrimonios, setTodosPatrimonios] = useState([]);

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

  // Filtrar patrimonios cuando se selecciona un municipio
  useEffect(() => {
    if (!municipioSeleccionado) {
      setPatrimonios([]);
      return;
    }

    // Convertir a string para comparación segura
    const filtered = todosPatrimonios.filter(
      (item) => String(item.municipioId) === String(municipioSeleccionado)
    );

    setPatrimonios(filtered);
  }, [municipioSeleccionado, todosPatrimonios]);

  const showCategoryClass = (categoria) =>
    typeof categoria === "string" ? categoria.toLowerCase() : "";

  return (
    <section>
      <div className="page-hero">
        <h1 className="hero-title">Patrimonio cultural del estado de Sonora</h1>
        <p className="hero-sub">Descubre monumentos, festividades y elementos culturales del estado a través de un mapa interactivo que concentra información histórica y visual.</p>
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
          <label htmlFor="municipio-select" className="municipio-label">
            Filtrar patrimonios por municipio
          </label>
          <select
            id="municipio-select"
            value={municipioSeleccionado}
            onChange={(e) => setMunicipioSeleccionado(e.target.value)}
            className="municipio-select-main"
          >
            <option value="">Selecciona un municipio</option>
            {municipios.map((municipio) => (
              <option key={municipio.id} value={municipio.id}>
                {municipio.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`map-wrapper ${mapExpanded ? "map-expanded" : ""}`}>
        <button
          className="map-expand-btn"
          onClick={() => setMapExpanded((prev) => !prev)}
          type="button"
        >
        </button>
        <MapView patrimonios={patrimonios} expanded={mapExpanded} />
      </div>

      <section className="popular-section">
        <h2 className="section-title">Lo más popular</h2>
        <div className="popular-row">
          {todosPatrimonios.slice(0, 6).map((item) => (
            <article key={item.id} className="popular-card">
              <div className="popular-content">
                <h3 className="popular-name">{item.nombre}</h3>
                <p className="popular-meta">{item.descripcion}</p>
              </div>
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
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Home