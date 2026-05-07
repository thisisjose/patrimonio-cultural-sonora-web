import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import MapView from "../components/MapView";
import { getPatrimonioById, getMunicipios, getPatrimonios } from "../services/patrimonioService";

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

function normalizePatrimonioData(item) {
  return {
    ...item,
    lat: item.latitud ?? item.lat ?? null,
    lng: item.longitud ?? item.lng ?? null,
    imagen: normalizeImage(item.imagen_url || item.imagen || item.portada) || "https://placehold.co/600x400?text=Sin+imagen",
    tags: Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : [],
    galeria: Array.isArray(item.galeria)
      ? item.galeria
      : Array.isArray(item.galeria_actual)
      ? item.galeria_actual
      : Array.isArray(item.imagenes)
      ? item.imagenes
      : [],
  };
}

// Función para convertir imagen URL a base64
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
};

// Función para generar y descargar PDF
const downloadPatrimonioPDF = async (item, municipioNombre, images) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // Helper para dibujar líneas divisorias
    const drawLine = (y) => {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // ===== TÍTULO =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Azul profesional
    const titleLines = doc.splitTextToSize(item.nombre, pageWidth - margin * 2);
    doc.text(titleLines, margin, currentY);
    currentY += (titleLines.length * 10) + 5;

    // ===== INFORMACIÓN BÁSICA =====
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const infoText = `Municipio: ${municipioNombre} | Categoría: ${item.categoria || "No especificada"}`;
    doc.text(infoText, margin, currentY);
    currentY += 10;
    
    drawLine(currentY - 5);

    // ===== ETIQUETAS =====
    if (item.tags && item.tags.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text("Etiquetas:", margin, currentY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const tagText = item.tags.map((t) => (typeof t === "string" ? t : t.nombre)).join(", ");
      const tagLines = doc.splitTextToSize(tagText, pageWidth - margin * 2 - 20);
      doc.text(tagLines, margin + 20, currentY);
      currentY += (tagLines.length * 5) + 5;
    }

    // ===== DESCRIPCIÓN =====
    currentY += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text("Descripción", margin, currentY);
    currentY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const descLines = doc.splitTextToSize(item.descripcion || "Sin descripción", pageWidth - margin * 2);
    doc.text(descLines, margin, currentY);
    currentY += (descLines.length * 5) + 15;

    // ===== GALERÍA =====
    if (images && images.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text("Galería", margin, currentY);
      currentY += 8;

      const imagesPerRow = 3;
      const gap = 3; // Espacio entre imágenes
      const availableWidth = pageWidth - (margin * 2) - (gap * (imagesPerRow - 1));
      const imageWidth = availableWidth / imagesPerRow;
      const imageHeight = imageWidth * 0.75; 
      const imagesToShow = Math.min(images.length, 6);

      let xPos = margin;
      let rowY = currentY;

      for (let i = 0; i < imagesToShow; i++) {
        try {
          const base64Image = await urlToBase64(images[i]);
          if (base64Image) {
            const colIndex = i % imagesPerRow;
            
            if (colIndex === 0 && i > 0) {
              rowY += imageHeight + gap;
            }

            // Validar que no se salga de la hoja
            if (rowY + imageHeight > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              rowY = margin;
            }

            doc.addImage(base64Image, "JPEG", margin + (colIndex * (imageWidth + gap)), rowY, imageWidth, imageHeight);
          }
        } catch (error) {
          console.error(`Error procesando imagen ${i}:`, error);
        }
      }
    }

    doc.save(`${item.nombre}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error al generar el PDF.");
  }
};


function PatrimonioDetailEntry({ item, municipioNombre }) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = useMemo(() => buildImageList(item), [item]);

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const formatTag = (tag) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag.nombre === "string") return tag.nombre;
    return String(tag ?? "");
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item.lat},${item.lng}`
  )}`;

  const prevImage = () => {
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentImageIndex((current) => (current + 1) % images.length);
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item]);

  return (
    <article className="detail-entry">
      <div className="detail-header">
        <div className="detail-header-content">
          <h2 className="detail-title">{item.nombre}</h2>
          <p className="detail-subtitle">Municipio: {municipioNombre}</p>
        </div>
      </div>

      <div className="detail-layout">
        <section className="detail-card">
          <div className="detail-image-container" aria-label={`Galería de ${item.nombre}`}>
            <img
              src={images[currentImageIndex]}
              alt={`${item.nombre} foto ${currentImageIndex + 1}`}
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
                  <img src={src} alt={`${item.nombre} miniatura ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="detail-info">
            <p className="detail-description">{item.descripcion}</p>

            <div className="detail-category-below">
              Categoría: <span className="category-badge">{item.categoria}</span>
            </div>

            <div className="detail-tags-below">
              {tags.length > 0 ? (
                <>
                  Tag{tags.length > 1 ? "s" : ""}: {" "}
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
              patrimonios={[item]}
              center={[item.lat, item.lng]}
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
         <a
          className="detail-map-link"
          onClick={() => downloadPatrimonioPDF(item, municipioNombre, images)}
          aria-label="Descargar información en PDF"
          title="Descargar información del patrimonio"
        >
          Descargar PDF
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
              alt={`${item.nombre} imagen ampliada`}
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
    </article>
  );
}

function Detail() {
  const { id } = useParams();
  const [patrimonio, setPatrimonio] = useState();
  const [municipios, setMunicipios] = useState([]);
  const [municipioPatrimonios, setMunicipioPatrimonios] = useState([]);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState(null);
  const [municipioLoading, setMunicipioLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const municipiosData = await getMunicipios();
        if (Array.isArray(municipiosData)) {
          setMunicipios(municipiosData);
        }

        const item = await getPatrimonioById(id);
        if (!item) {
          setPatrimonio(null);
          return;
        }

        setPatrimonio(normalizePatrimonioData(item));
      } catch (error) {
        console.error("Error fetching patrimonio:", error);
        setPatrimonio(null);
      }
    };

    cargarDatos();
  }, [id]);

  const cargarPatrimoniosMunicipio = async (municipioId) => {
    if (!municipioId) return;
    setSelectedMunicipioId(municipioId);
    setMunicipioLoading(true);
    setMunicipioPatrimonios([]);

    try {
      const items = await getPatrimonios();
      const filtered = Array.isArray(items)
        ? items
            .filter((item) => String(item.municipioId) === String(municipioId))
            .map((item) => normalizePatrimonioData(item))
        : [];
      setMunicipioPatrimonios(filtered);
    } catch (error) {
      console.error("Error loading patrimonios de municipio:", error);
      setMunicipioPatrimonios([]);
    } finally {
      setMunicipioLoading(false);
    }
  };

  useEffect(() => {
    setMunicipioPatrimonios([]);
    setSelectedMunicipioId(null);
  }, [patrimonio]);

  if (patrimonio === undefined) {
    return null;
  }

  if (patrimonio === null) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  const nombreMunicipio = patrimonio && patrimonio.municipioId
    ? municipios.find((m) => String(m.id) === String(patrimonio.municipioId))?.nombre || "Municipio"
    : "Municipio";

  const showMunicipioDetails = Boolean(selectedMunicipioId);

  return (
    <div className="page-inner detail-page">
      <nav className="breadcrumbs">
        <Link to="/">Inicio</Link>
        <span className="crumb-sep">›</span>
        <Link to="/">Patrimonio</Link>
        <span className="crumb-sep">›</span>
        {patrimonio && patrimonio.municipioId ? (
          <>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => cargarPatrimoniosMunicipio(patrimonio.municipioId)}
            >
              {nombreMunicipio}
            </button>
            <span className="crumb-sep">›</span>
          </>
        ) : null}
        <span className="crumb-current">{showMunicipioDetails ? nombreMunicipio : patrimonio.nombre}</span>
      </nav>

      {showMunicipioDetails ? (
        <section className="municipio-details">
          <h2 className="section-title">Patrimonios en {nombreMunicipio}</h2>
          {municipioLoading ? (
            <p className="lead">Cargando detalles de {nombreMunicipio}...</p>
          ) : municipioPatrimonios.length === 0 ? (
            <p className="lead">No se encontraron patrimonios en {nombreMunicipio}.</p>
          ) : (
            municipioPatrimonios.map((item) => (
              <PatrimonioDetailEntry key={item.id} item={item} municipioNombre={nombreMunicipio} />
            ))
          )}
        </section>
      ) : (
        <PatrimonioDetailEntry item={patrimonio} municipioNombre={nombreMunicipio} />
      )}
    </div>
  );
}

export default Detail;