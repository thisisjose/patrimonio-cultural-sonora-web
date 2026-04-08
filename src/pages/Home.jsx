import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import mapaIcon from "../Icons/mapa.png";
import historiaIcon from "../Icons/historia.png";
import infoIcon from "../Icons/info.png";

function Home() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [patrimonios, setPatrimonios] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("http://localhost:3000/api/patrimonios", {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        setPatrimonios(
          data.map((item) => ({
            ...item,
            lat: item.latitud,
            lng: item.longitud,
            imagen: item.imagen_url ?? item.imagen,
          }))
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error fetching patrimonios:", error);
        }
      });

    return () => controller.abort();
  }, []);

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
          {patrimonios.slice(0, 6).map((item) => (
            <article key={item.id} className="popular-card">
              <div className="popular-content">
                <h3 className="popular-name">{item.nombre}</h3>
                <p className="popular-meta">{item.descripcion}</p>
              </div>
              <div className="popular-thumb">
                <img src={item.imagen} alt={item.nombre} />
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