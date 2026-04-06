import MapView from "../components/MapView";
import mapaIcon from "../Icons/mapa.png";
import historiaIcon from "../Icons/historia.png";
import infoIcon from "../Icons/info.png";

function Home() {

  // Datos simulados (luego vendrán de la API)
  const patrimonios = [
    {
      id: 1,
      nombre: "Catedral de Hermosillo",
      descripcion: "Uno de los principales monumentos históricos del estado.",
      categoria: "material",
      lat: 29.0729,
      lng: -110.9559,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG/1280px-Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG?_=20120911015059",
    },
    {
      id: 2,
      nombre: "Cerro de la Campana",
      descripcion: "Mirador emblemático de Hermosillo.",
      categoria: "material",
      lat: 29.0817,
      lng: -110.9614,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Cerro_de_la_Campana_HMO.jpg/640px-Cerro_de_la_Campana_HMO.jpg",
    },
    {
      id: 3,
      nombre: "Fiestas del Pitic",
      descripcion: "Festival cultural anual en Hermosillo.",
      categoria: "inmaterial",
      lat: 29.075,
      lng: -110.96,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Fiestas_del_Pitic.jpg/640px-Fiestas_del_Pitic.jpg",
    },
    {
      id: 4,
      nombre: "Museo de Sonora",
      descripcion: "Un vistazo completo a la historia natural y cultural del estado.",
      categoria: "material",
      lat: 29.079,
      lng: -110.955,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Museo_Costumbrista_de_Sonora03.JPG/640px-Museo_Costumbrista_de_Sonora03.JPG",
    },
    {
      id: 5,
      nombre: "Danza del Venado",
      descripcion: "Tradición indígena de los yaquis que mezcla rito y danza.",
      categoria: "inmaterial",
      lat: 29.070,
      lng: -110.950,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Danza_del_venado-02.jpg/640px-Danza_del_venado-02.jpg",
    },
    {
      id: 6,
      nombre: "Ruta del Adobe",
      descripcion: "Pueblos tradicionales que conservan la construcción en adobe.",
      categoria: "biocultural",
      lat: 29.082,
      lng: -110.965,
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Im%C3%A1genes_de_Catamarca_2023_06.jpg/640px-Im%C3%A1genes_de_Catamarca_2023_06.jpg",
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

      <div className="map-wrapper">
        <MapView patrimonios={patrimonios} />
      </div>

      <section className="popular-section">
        <h2 className="section-title">Lo más popular</h2>
        <div className="popular-row">
          {patrimonios.map((item) => (
            <article key={item.id} className="popular-card">
              <div className="popular-content">
                <h3 className="popular-name">{item.nombre}</h3>
                <p className="popular-meta">{item.descripcion}</p>
              </div>
              <div className="popular-thumb">
                <img src={item.imagen} alt={item.nombre} />
                <span className={`category-badge popular-badge ${item.categoria}`}>{item.categoria}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Home