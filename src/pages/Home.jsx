import MapView from "../components/MapView";

function Home() {

  // Datos simulados (luego vendrán de la API)
  const patrimonios = [
    {
      id: 1,
      nombre: "Catedral de Hermosillo",
      descripcion: "Uno de los principales monumentos históricos del estado.",
      lat: 29.0729,
      lng: -110.9559,
    },
    {
      id: 2,
      nombre: "Cerro de la Campana",
      descripcion: "Mirador emblemático de Hermosillo.",
      lat: 29.0817,
      lng: -110.9614,
    },
    {
      id: 3,
      nombre: "Fiestas del Pitic",
      descripcion: "Festival cultural anual en Hermosillo.",
      lat: 29.075,
      lng: -110.96,
    },
  ];

  return (
    <section>
      <div className="page-hero">
        <h1 className="hero-title">Patrimonio cultural del estado de Sonora</h1>
        <p className="hero-sub">Descubre monumentos, festividades y elementos culturales del estado a través de un mapa interactivo que concentra información histórica y visual.</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🗺️</div>
          <div>
            <div className="feature-title">Explora el mapa</div>
            <div className="feature-desc">Navega fácilmente por sitios históricos y festividades locales con información práctica y fotos.</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <div>
            <div className="feature-title">Aprende sobre la historia</div>
            <div className="feature-desc">Cada punto incluye contexto histórico breve y referencias para profundizar en el patrimonio.</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <div>
            <div className="feature-title">Información accesible</div>
            <div className="feature-desc">Datos completos y verificados de cada sitio: ubicación, horarios y referencias para planificar visitas.</div>
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapView patrimonios={patrimonios} />
      </div>


    </section>
  );
}

export default Home;