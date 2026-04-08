import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MapView from "../components/MapView";

function Detail() {
  const { id } = useParams();
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [patrimonio, setPatrimonio] = useState();

  useEffect(() => {
    const controller = new AbortController();

    fetch("http://localhost:3000/api/patrimonios", {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const found = data
          .map((item) => ({
            ...item,
            lat: item.latitud,
            lng: item.longitud,
            imagen: item.imagen_url ?? item.imagen,
          }))
          .find((item) => String(item.id) === id);

        setPatrimonio(found ?? null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error fetching patrimonio:", error);
        }
      });

    return () => controller.abort();
  }, [id]);

  if (patrimonio === undefined) {
    return null;
  }

  if (patrimonio === null) {
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