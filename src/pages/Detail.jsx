import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "../components/MapView";
import { getPatrimonioById } from "../services/patrimonioService";

function Detail() {
  const { id } = useParams();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [patrimonio, setPatrimonio] = useState();

  const API_BASE = "http://localhost:3000";

  useEffect(() => {
    const cargarPatrimonio = async () => {
      try {
        const item = await getPatrimonioById(id);
        if (!item) {
          setPatrimonio(null);
          return;
        }

        setPatrimonio({
          ...item,
          lat: item.latitud,
          lng: item.longitud,
          imagen: item.imagen_url
            ? item.imagen_url.startsWith("http")
              ? item.imagen_url
              : `${API_BASE}${item.imagen_url}`
            : "https://placehold.co/600x400?text=Sin+imagen",
          tags: item.tags || [],
        });
      } catch (error) {
        console.error("Error fetching patrimonio:", error);
        setPatrimonio(null);
      }
    };

    cargarPatrimonio();
  }, [id]);

  if (patrimonio === undefined) {
    return null;
  }

  if (patrimonio === null) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  const tags = Array.isArray(patrimonio.tags) ? patrimonio.tags : [];
  const formatTag = (tag) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag.nombre === "string") return tag.nombre;
    return String(tag ?? "");
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${patrimonio.lat},${patrimonio.lng}`
  )}`;

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
              onError={(e) => {
                e.target.src = "https://placehold.co/600x400?text=Sin+imagen";
              }}
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

            <div className="detail-tags-below">
              {tags.length > 0 ? (
                <>
                  Tag{tags.length > 1 ? "s" : ""}: {tags.map((tag, index) => (
                    <span key={index} className="tag-badge">
                      {formatTag(tag)}
                    </span>
                  ))}
                </>
              ) : (
                <>Tag: <span className="tag-badge">Sin tag</span></>
              )}
            </div>
          </div>
        </section>

        <aside className="detail-location">
          <h2 className="section-title">Ubicación</h2>
          <div className="detail-map">
            <MapView
              patrimonios={[patrimonio]}
              center={[patrimonio.lat, patrimonio.lng]}
              zoom={15}
              interactive={false}
            />
          </div>
          <a
            className="detail-map-link"
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Abrir en Google Maps
          </a>
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