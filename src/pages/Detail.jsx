import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "../components/MapView";
import { getPatrimonioById } from "../services/patrimonioService";

const API_BASE = "http://localhost:3000";

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

const buildImageList = (item) => {
  const list = [];
  const main = normalizeImage(item.imagen_url || item.imagen || item.portada);
  if (main) list.push(main);

  const gallery = item.galeria || item.galeria_actual || item.imagenes || [];
  if (Array.isArray(gallery)) {
    gallery.forEach((entry) => {
      const url = normalizeImage(entry);
      if (url && !list.includes(url)) list.push(url);
    });
  }

  if (list.length === 0) {
    list.push("https://placehold.co/600x400?text=Sin+imagen");
  }

  return list;
};

function Detail() {
  const { id } = useParams();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [patrimonio, setPatrimonio] = useState();

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
          imagen: normalizeImage(item.imagen_url || item.imagen || item.portada) || "https://placehold.co/600x400?text=Sin+imagen",
          tags: item.tags || [],
          galeria: Array.isArray(item.galeria) ? item.galeria : item.galeria_actual || item.imagenes || [],
        });
      } catch (error) {
        console.error("Error fetching patrimonio:", error);
        setPatrimonio(null);
      }
    };

    cargarPatrimonio();
  }, [id]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [patrimonio]);

  const images = useMemo(() => (patrimonio ? buildImageList(patrimonio) : []), [patrimonio]);

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

  const prevImage = () => {
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentImageIndex((current) => (current + 1) % images.length);
  };

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
          <div className="detail-image-container" aria-label="Galería del patrimonio">
            <img
              src={images[currentImageIndex]}
              alt={`${patrimonio.nombre} foto ${currentImageIndex + 1}`}
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

          {images.length > 1 && (
            <div className="detail-carousel-controls">
              <button type="button" className="btn-secondary" onClick={prevImage}>
                Anterior
              </button>
              <span className="carousel-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button type="button" className="btn-primary" onClick={nextImage}>
                Siguiente
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`thumb-button ${index === currentImageIndex ? "active" : ""}`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <img src={src} alt={`${patrimonio.nombre} miniatura ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="detail-info">
            <p className="detail-description">{patrimonio.descripcion}</p>

            <div className="detail-category-below">
              Categoría: <span className="category-badge">{patrimonio.categoria}</span>
            </div>

            <div className="detail-tags-below">
              {tags.length > 0 ? (
                <>
                  Tag{tags.length > 1 ? "s" : ""}:{" "}
                  {tags.map((tag, index) => (
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
            <img
              src={images[currentImageIndex]}
              alt={`${patrimonio.nombre} imagen ampliada`}
              className="image-modal-img"
            />
            {images.length > 1 && (
              <div className="image-modal-nav">
                <button type="button" onClick={prevImage}>
                  Anterior
                </button>
                <button type="button" onClick={nextImage}>
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Detail;