import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "../components/MapView";

function Detail() {
  const { id } = useParams();
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Datos simulados (luego vendrán desde la API)
  const patrimonios = [
    {
      id: "1",
      nombre: "Catedral de Hermosillo",
      descripcion:
        "La Catedral Metropolitana de Hermosillo, oficialmente conocida como Catedral de la Asunción, es uno de los principales monumentos históricos y religiosos del estado de Sonora. Construida en el siglo XVII, esta majestuosa estructura religiosa se destaca por su arquitectura colonial con elementos neoclásicos. La fachada presenta un hermoso trabajo en cantera rosa, mientras que su interior alberga valiosas obras de arte sacro. Ubicada en el corazón del centro histórico de Hermosillo, la Catedral es un lugar de gran importancia espiritual y cultural que atrae tanto a devotos como a turistas interesados en la historia arquitectónica y religiosa de la región.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG/1280px-Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG?_=20120911015059",
      categoria: "material",
      lat: 29.0729,
      lng: -110.9559,
    },
    {
      id: "2",
      nombre: "Cerro de la Campana",
      descripcion:
        "El Cerro de la Campana es un mirador natural emblemático que ofrece una vista panorámica de la ciudad de Hermosillo. Esta elevación geográfica se ha convertido en uno de los símbolos más reconocibles de la capital sonorense. El sitio es popular entre turistas y residentes locales que buscan disfrutar de vistas espectaculares especialmente al atardecer, cuando la ciudad se tiñe con tonos dorados y anaranjados. El acceso al mirador es relativamente fácil y seguro, con áreas habilitadas para que los visitantes puedan contemplar el paisaje urbano desde diversas perspectivas. Además de su valor turístico, el Cerro de la Campana tiene importance histórica y representa un punto de referencia geográfica y cultural para los hermosillenses.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Cerro_de_la_Campana_HMO_2.JPG/640px-Cerro_de_la_Campana_HMO_2.JPG",
      categoria: "material",
      lat: 29.0817,
      lng: -110.9614,
    },
    {
      id: "3",
      nombre: "Fiestas del Pitic",
      descripcion:
        "Las Fiestas del Pitic son un festival cultural anual que celebra la fundación de Hermosillo con una serie de eventos artísticos, musicales y culturales. Pitic fue el nombre prehispánico de Hermosillo, y estas festividades honran la rica herencia cultural y las tradiciones de la región. Durante estos días, la ciudad se llena de vida con conciertos, exposiciones de arte, actividades para la familia, danzas tradicionales y gastronomía típica de Sonora. El festival es una oportunidad para que residentes y visitantes compartan un espíritu de celebración y reconozcan la importancia histórica del territorio. Las Fiestas del Pitic representan un puente entre el pasado prehispánico y la modernidad, mostrando la identidad cultural vibrante de Hermosillo.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Fiestas_del_Pitic.jpg/640px-Fiestas_del_Pitic.jpg",
      categoria: "inmaterial",
      lat: 29.075,
      lng: -110.96,
    },
  ];

  const patrimonio = patrimonios.find((p) => p.id === id);

  if (!patrimonio) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  return (
    <div className="page-inner detail-page">
      <nav className="breadcrumbs">
        <Link to="/">Inicio</Link>
        <span className="crumb-sep">›</span>
        <Link to="/">Patrimonio</Link>
        <span className="crumb-sep">›</span>
        <span className="crumb-current">{patrimonio.nombre}</span>
      </nav>

      <div className="detail-header">
        <h1 className="detail-title">{patrimonio.nombre}</h1>
      </div>

      <div className="detail-layout">
        <section className="detail-card">
          <div className="detail-image-container" aria-label="Imagen del patrimonio">
            <img
              src={patrimonio.imagen}
              alt={patrimonio.nombre}
              className="detail-image"
              onClick={() => setIsImageOpen(true)}
            />
            <button
              className="image-zoom"
              type="button"
              onClick={() => setIsImageOpen(true)}
              aria-label="Ver imagen en grande"
            >
              ⤢
            </button>
          </div>

          <div className="detail-info">
            <p className="detail-description">{patrimonio.descripcion}</p>

            <div className="detail-category-below">
              Categoría: <span className="category-badge">{patrimonio.categoria}</span>
            </div>
          </div>
        </section>
g
        <aside className="detail-location">
          <h2 className="section-title">Ubicación</h2>
          <div className="detail-map">
            <MapView patrimonios={[patrimonio]} center={[patrimonio.lat, patrimonio.lng]} zoom={15} />
          </div>
        </aside>
      </div>

      {isImageOpen && (
        <div className="image-modal" role="dialog" aria-modal="true" onClick={() => setIsImageOpen(false)}>
          <div className="image-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Cerrar imagen"
              className="image-modal-close"
              onClick={() => setIsImageOpen(false)}
            >
              ×
            </button>
            <img src={patrimonio.imagen} alt={patrimonio.nombre} className="image-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Detail;