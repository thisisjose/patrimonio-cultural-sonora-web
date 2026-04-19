import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  getPatrimonios,
  createPatrimonio,
  updatePatrimonio,
  deletePatrimonio,
  getMunicipios,
  descargarExcelPatrimonios,
} from "../../services/patrimonioService";

// ----- Importaciones para el mapa -----
import { MapContainer, TileLayer, useMapEvents, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapPicker({ latitud, longitud, onLocationSelect }) {
  const [position, setPosition] = useState(() => {
    if (latitud && longitud) {
      return { lat: parseFloat(latitud), lng: parseFloat(longitud) };
    }
    return { lat: 29.0729, lng: -110.9559 };
  });

  const handleClick = (e) => {
    const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
    setPosition(newPos);
    onLocationSelect(newPos);
  };

  return (
    <MapContainer
      center={[position.lat, position.lng]}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "var(--radius-sm)", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors, &copy; Carto'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={handleClick} />
      <Marker position={[position.lat, position.lng]} />
    </MapContainer>
  );
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e); } });
  return null;
}

export default function AdminDashboard() {
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  const [filtro, setFiltro] = useState({
    municipio: "Todos",
    categoria: "Todas",
    estado: "Todos",
  });

  const [modalVer, setModalVer] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({});

  const [modalNuevo, setModalNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    municipioId: "",
    categoria: "Material",
    descripcion: "",
    latitud: "",
    longitud: "",
    tagsInput: "",
    portadaFile: null,
    imagenesFiles: [],        // ✅ múltiples archivos para galería
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost:3000";

  const municipioNombrePorId = useMemo(() => {
    const map = new Map();
    municipios.forEach((m) => map.set(String(m.id), m.nombre));
    return map;
  }, [municipios]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      const [respPatrimonios, respMunicipios] = await Promise.all([
        getPatrimonios(),
        getMunicipios(),
      ]);
      setMunicipios(Array.isArray(respMunicipios) ? respMunicipios : []);
      const lista = Array.isArray(respPatrimonios) ? respPatrimonios : respPatrimonios?.data || [];
      setPatrimonios(lista);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los patrimonios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirVer = (item) => setModalVer(item);
  const cerrarVer = () => setModalVer(null);

  const abrirEditar = (item) => {
    setFormEditar({
      id: item.id,
      nombre: item.nombre,
      municipioId: item.municipioId,
      categoria: item.categoria,
      descripcion: item.descripcion,
      latitud: item.latitud,
      longitud: item.longitud,
      tagsInput: (item.tags || []).map(t => t.nombre || t).join(", "),
      portadaFile: null,
      imagenesFiles: [],                 // nuevas imágenes a agregar
      galeriaActual: item.galeria || [], // imágenes existentes { id, url }
      imagenesAEliminar: [],             // ids de imágenes a borrar
    });
    setModalEditar(item);
  };

  const cerrarEditar = () => {
    setModalEditar(null);
    setFormEditar({});
  };

  // Manejadores para creación
  const handlePortadaUploadNuevo = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormNuevo(prev => ({ ...prev, portadaFile: file }));
  };

  const handleGaleriaUploadNuevo = (e) => {
    const files = Array.from(e.target.files || []);
    setFormNuevo(prev => ({ ...prev, imagenesFiles: [...prev.imagenesFiles, ...files] }));
  };

  const removeGaleriaFileNuevo = (index) => {
    setFormNuevo(prev => ({
      ...prev,
      imagenesFiles: prev.imagenesFiles.filter((_, i) => i !== index)
    }));
  };

  const guardarNuevo = async () => {
    try {
      setSaving(true);
      setError("");
      const formData = new FormData();
      formData.append("nombre", formNuevo.nombre);
      formData.append("categoria", formNuevo.categoria);
      formData.append("descripcion", formNuevo.descripcion);
      formData.append("latitud", formNuevo.latitud);
      formData.append("longitud", formNuevo.longitud);
      formData.append("municipioId", formNuevo.municipioId);
      if (formNuevo.portadaFile) formData.append("portada", formNuevo.portadaFile);
      // Agregar cada imagen de galería
      formNuevo.imagenesFiles.forEach(file => {
        formData.append("imagenes", file);
      });
      if (formNuevo.tagsInput.trim()) {
        const tagsArray = formNuevo.tagsInput.split(",").map(t => t.trim()).filter(t => t);
        tagsArray.forEach(tag => formData.append("tags[]", tag));
      }
      await createPatrimonio(formData);
      setModalNuevo(false);
      setFormNuevo({
        nombre: "",
        municipioId: "",
        categoria: "Material",
        descripcion: "",
        latitud: "",
        longitud: "",
        tagsInput: "",
        portadaFile: null,
        imagenesFiles: [],
      });
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  // Manejadores para edición
  const handlePortadaUploadEditar = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormEditar(prev => ({ ...prev, portadaFile: file }));
  };

  const handleGaleriaUploadEditar = (e) => {
    const files = Array.from(e.target.files || []);
    setFormEditar(prev => ({ ...prev, imagenesFiles: [...prev.imagenesFiles, ...files] }));
  };

  const toggleEliminarImagen = (id) => {
    setFormEditar(prev => {
      const esta = prev.imagenesAEliminar.includes(id);
      return {
        ...prev,
        imagenesAEliminar: esta
          ? prev.imagenesAEliminar.filter(i => i !== id)
          : [...prev.imagenesAEliminar, id]
      };
    });
  };

  const guardarEdicion = async () => {
    try {
      setSaving(true);
      setError("");
      let dataToSend;
      // Si hay archivos nuevos o imágenes a eliminar, usar FormData
      if (formEditar.portadaFile || formEditar.imagenesFiles.length > 0 || formEditar.imagenesAEliminar.length > 0) {
        const fd = new FormData();
        fd.append("nombre", formEditar.nombre);
        fd.append("categoria", formEditar.categoria);
        fd.append("descripcion", formEditar.descripcion);
        fd.append("latitud", formEditar.latitud);
        fd.append("longitud", formEditar.longitud);
        fd.append("municipioId", formEditar.municipioId);
        if (formEditar.tagsInput?.trim()) {
          const tagsArray = formEditar.tagsInput.split(",").map(t => t.trim()).filter(t => t);
          tagsArray.forEach(tag => fd.append("tags[]", tag));
        }
        if (formEditar.portadaFile) fd.append("portada", formEditar.portadaFile);
        // Agregar nuevas imágenes de galería
        formEditar.imagenesFiles.forEach(file => fd.append("imagenes", file));
        // Enviar IDs a eliminar como string separado por comas (backend modificado lo parsea)
        if (formEditar.imagenesAEliminar.length) {
          fd.append("eliminarImagenesIds", formEditar.imagenesAEliminar.join(","));
        }
        dataToSend = fd;
      } else {
        // Envío como JSON
        dataToSend = {
          nombre: formEditar.nombre,
          categoria: formEditar.categoria,
          descripcion: formEditar.descripcion,
          latitud: formEditar.latitud,
          longitud: formEditar.longitud,
          municipioId: formEditar.municipioId,
          tags: formEditar.tagsInput?.split(",").map(t => t.trim()).filter(t => t) || [],
        };
      }
      await updatePatrimonio(formEditar.id, dataToSend);
      cerrarEditar();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este patrimonio?")) return;
    try {
      setSaving(true);
      await deletePatrimonio(id);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  const handleMapSelectNuevo = (coords) => {
    setFormNuevo(prev => ({
      ...prev,
      latitud: coords.lat.toString(),
      longitud: coords.lng.toString(),
    }));
  };

  const handleMapSelectEditar = (coords) => {
    setFormEditar(prev => ({
      ...prev,
      latitud: coords.lat.toString(),
      longitud: coords.lng.toString(),
    }));
  };

  const patrimoniosUI = useMemo(() => {
    const mapPatrimonio = (item) => {
      const municipioId = item.municipioId ?? item.municipio?.id ?? "";
      const municipioNombre = municipioNombrePorId.get(String(municipioId)) || "Sin municipio";
      return {
        id: item.id,
        nombre: item.nombre ?? "",
        categoria: item.categoria ?? "Material",
        descripcion: item.descripcion ?? "",
        latitud: item.latitud ?? "",
        longitud: item.longitud ?? "",
        imagen: item.imagen_url
          ? item.imagen_url.startsWith("http")
            ? item.imagen_url
            : `${API_BASE}${item.imagen_url}`
          : "https://placehold.co/600x400?text=Sin+imagen",
        galeria: (item.galeria || []).map(g => ({
          id: g.id,
          url: g.url.startsWith("http") ? g.url : `${API_BASE}${g.url}`
        })),
        municipioId,
        ubicacion: municipioNombre,
        estado: "Registrado",
        fechaRegistro: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
        fechaActualizacion: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—",
        tags: item.tags || [],
      };
    };
    return patrimonios.map(mapPatrimonio);
  }, [patrimonios, municipioNombrePorId, API_BASE]);

  const filtrados = patrimoniosUI.filter(
    (p) =>
      (filtro.municipio === "Todos" || String(p.municipioId) === String(filtro.municipio)) &&
      (filtro.categoria === "Todas" || p.categoria === filtro.categoria) &&
      (filtro.estado === "Todos" || p.estado === filtro.estado)
  );

  const registrados = patrimoniosUI.filter((p) => p.estado === "Registrado").length;
  const pendientes = patrimoniosUI.filter((p) => p.estado === "Pendiente").length;

  // Lightbox state
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxImages, setLightboxImages] = useState([]);
const [lightboxIndex, setLightboxIndex] = useState(0);

const openLightbox = (images, startIndex) => {
  setLightboxImages(images);
  setLightboxIndex(startIndex);
  setLightboxOpen(true);
};

const closeLightbox = useCallback(() => {
  setLightboxOpen(false);
  setLightboxImages([]);
  setLightboxIndex(0);
}, []);

const nextImage = useCallback(() => {
  setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
}, [lightboxImages.length]);

const prevImage = useCallback(() => {
  setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
}, [lightboxImages.length]);

// Manejo de teclado
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [lightboxOpen, nextImage, prevImage, closeLightbox]);

  return (
    <>
      <style>{STYLE}</style>

      {/* MODAL NUEVO - Diseño mejorado (dos columnas como editar) */}
{modalNuevo && (
  <div className="overlay" onClick={() => setModalNuevo(false)}>
    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">Nuevo Patrimonio</div>
        <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
      </div>
      <div className="modal-body two-columns">
        {/* Columna izquierda: imágenes */}
        <div className="edit-left">
          <div className="form-group">
            <label className="form-label">Imagen de portada</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handlePortadaUploadNuevo}
            />
            {formNuevo.portadaFile && (
              <div style={{ marginTop: "8px" }}>
                <img
                  src={URL.createObjectURL(formNuevo.portadaFile)}
                  alt="Vista previa portada"
                  style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-200)" }}
                />
                <small style={{ display: "block", marginTop: "4px" }}>{formNuevo.portadaFile.name}</small>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Galería de imágenes (varias)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="form-input"
              onChange={handleGaleriaUploadNuevo}
            />
            {formNuevo.imagenesFiles.length > 0 && (
              <div className="gallery-grid" style={{ marginTop: "12px" }}>
                {formNuevo.imagenesFiles.map((file, idx) => (
                  <div key={idx} className="gallery-item">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`preview-${idx}`}
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      className="ab delete small"
                      onClick={() => removeGaleriaFileNuevo(idx)}
                      style={{ marginTop: "4px", width: "auto", padding: "2px 8px" }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: campos y mapa */}
        <div className="edit-right">
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              className="form-input"
              value={formNuevo.nombre}
              onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Municipio</label>
              <select
                className="form-input"
                value={formNuevo.municipioId}
                onChange={e => setFormNuevo({ ...formNuevo, municipioId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={formNuevo.categoria}
                onChange={e => setFormNuevo({ ...formNuevo, categoria: e.target.value })}
              >
                <option>Material</option>
                <option>Inmaterial</option>
                <option>Biocultural</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (separados por coma)</label>
            <input
              className="form-input"
              value={formNuevo.tagsInput}
              onChange={e => setFormNuevo({ ...formNuevo, tagsInput: e.target.value })}
              placeholder="Ej: colonial, museo, histórico"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input form-textarea"
              value={formNuevo.descripcion}
              onChange={e => setFormNuevo({ ...formNuevo, descripcion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">📍 Selecciona la ubicación en el mapa</label>
            <MapPicker
              latitud={formNuevo.latitud}
              longitud={formNuevo.longitud}
              onLocationSelect={handleMapSelectNuevo}
            />
            {formNuevo.latitud && formNuevo.longitud && (
              <div className="form-row" style={{ marginTop: "12px" }}>
                <div className="form-group">
                  <label>Latitud</label>
                  <input className="form-input" value={formNuevo.latitud} readOnly />
                </div>
                <div className="form-group">
                  <label>Longitud</label>
                  <input className="form-input" value={formNuevo.longitud} readOnly />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-primary" onClick={guardarNuevo} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button className="btn-secondary" onClick={() => setModalNuevo(false)}>
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL VER - con lightbox */}
{modalVer && (
  <div className="overlay" onClick={cerrarVer}>
    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">{modalVer.nombre}</div>
        <button className="modal-close" onClick={cerrarVer}>✕</button>
      </div>
      <div className="modal-body two-columns">
        {/* Columna izquierda: imágenes */}
        <div className="view-left">
          <div className="view-main-image">
            <img
              src={modalVer.imagen}
              alt={modalVer.nombre}
              onClick={() => {
                const allImages = [
                  { url: modalVer.imagen, alt: modalVer.nombre },
                  ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))
                ];
                openLightbox(allImages, 0);
              }}
              style={{ cursor: 'pointer' }}
            />
            <button
              className="image-zoom-btn"
              onClick={() => {
                const allImages = [
                  { url: modalVer.imagen, alt: modalVer.nombre },
                  ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))
                ];
                openLightbox(allImages, 0);
              }}
              aria-label="Ver galería"
            >
              ⤢
            </button>
          </div>
          {modalVer.galeria && modalVer.galeria.length > 0 && (
            <div className="view-gallery">
              <label className="form-label">Galería de imágenes</label>
              <div className="gallery-grid">
                {modalVer.galeria.map((img, idx) => (
                  <div key={img.id} className="gallery-item">
                    <img
                      src={img.url}
                      alt={`galería ${idx}`}
                      onClick={() => {
                        const allImages = [
                          { url: modalVer.imagen, alt: modalVer.nombre },
                          ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))
                        ];
                        openLightbox(allImages, idx + 1); // +1 porque la portada es la primera
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: información (sin cambios) */}
        <div className="view-right">
          <div className="view-badges">
            <span className={`bcat ${modalVer.categoria.toLowerCase()}`}>{modalVer.categoria}</span>
            <span className={`bst ${modalVer.estado.toLowerCase()}`}>
              <span className={`dot ${modalVer.estado === "Registrado" ? "green" : "amber"}`} />
              {modalVer.estado}
            </span>
          </div>

          {modalVer.descripcion && (
            <div className="view-description">
              <h3 className="section-title-small">Descripción</h3>
              <p>{modalVer.descripcion}</p>
            </div>
          )}

          <div className="view-tags">
            <h3 className="section-title-small">Tags</h3>
            <div className="tags-list">
              {modalVer.tags && modalVer.tags.length > 0 ? (
                modalVer.tags.map((tag, idx) => (
                  <span key={idx} className="tag-badge">{typeof tag === 'object' ? tag.nombre : tag}</span>
                ))
              ) : (
                <span className="tag-badge">Sin tags</span>
              )}
            </div>
          </div>

          <div className="view-location">
            <h3 className="section-title-small">Ubicación</h3>
            <div className="location-coords">
              <div><strong>Municipio:</strong> {modalVer.ubicacion}</div>
              <div><strong>Latitud:</strong> <span className="mono">{modalVer.latitud}</span></div>
              <div><strong>Longitud:</strong> <span className="mono">{modalVer.longitud}</span></div>
            </div>
            {modalVer.latitud && modalVer.longitud && (
              <a
                href={`https://www.google.com/maps?q=${modalVer.latitud},${modalVer.longitud}`}
                target="_blank"
                rel="noreferrer noopener"
                className="maps-link"
              >
                Abrir en Google Maps
              </a>
            )}
          </div>

          <div className="view-dates">
            <div><strong>Fecha de registro:</strong> {modalVer.fechaRegistro}</div>
            <div><strong>Última actualización:</strong> {modalVer.fechaActualizacion}</div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="ab edit" onClick={() => { cerrarVer(); abrirEditar(modalVer); }}>Editar</button>
        <button className="btn-secondary" onClick={cerrarVer}>Cerrar</button>
      </div>
    </div>
  </div>
)}

      {/* MODAL EDITAR - Nuevo diseño amplio y estructurado */}
{/* MODAL EDITAR - con lightbox en las imágenes actuales */}
{modalEditar && (
  <div className="overlay" onClick={cerrarEditar}>
    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title">Editar Patrimonio</div>
        <button className="modal-close" onClick={cerrarEditar}>✕</button>
      </div>
      <div className="modal-body two-columns">
        {/* Columna izquierda: imágenes */}
        <div className="edit-left">
          {/* Portada actual con clic para lightbox */}
          <div className="form-group">
            <label className="form-label">Imagen de portada actual</label>
            {modalEditar?.imagen && (
              <div className="edit-portada-wrapper">
                <img
                  src={modalEditar.imagen}
                  alt="portada actual"
                  className="edit-portada-preview"
                  onClick={() => {
                    // Construir lista de imágenes actuales (sin las nuevas)
                    const currentImages = [
                      { url: modalEditar.imagen, alt: 'Portada' },
                      ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))
                    ];
                    openLightbox(currentImages, 0);
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <button
                  className="image-zoom-btn-small"
                  onClick={() => {
                    const currentImages = [
                      { url: modalEditar.imagen, alt: 'Portada' },
                      ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))
                    ];
                    openLightbox(currentImages, 0);
                  }}
                >
                  ⤢
                </button>
              </div>
            )}
            <label className="form-label" style={{ marginTop: "12px" }}>Cambiar portada</label>
            <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadEditar} />
            {formEditar.portadaFile && <small>Archivo seleccionado: {formEditar.portadaFile.name}</small>}
          </div>

          {/* Galería actual con clic para lightbox */}
          <div className="form-group">
            <label className="form-label">Galería actual</label>
            <div className="gallery-grid">
              {formEditar.galeriaActual?.map((img, idx) => (
                <div key={img.id} className="gallery-item">
                  <img
                    src={img.url}
                    alt="galería"
                    onClick={() => {
                      const currentImages = [
                        { url: modalEditar.imagen, alt: 'Portada' },
                        ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))
                      ];
                      openLightbox(currentImages, idx + 1);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="gallery-check">
                    <input
                      type="checkbox"
                      checked={formEditar.imagenesAEliminar?.includes(img.id)}
                      onChange={() => toggleEliminarImagen(img.id)}
                    />
                    Eliminar
                  </label>
                </div>
              ))}
            </div>
            <label className="form-label" style={{ marginTop: "12px" }}>Agregar nuevas imágenes</label>
            <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadEditar} />
            {formEditar.imagenesFiles?.length > 0 && (
              <div className="new-images-list">
                {formEditar.imagenesFiles.map((file, idx) => (
                  <div key={idx} className="new-image-item">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="ab delete small"
                      onClick={() => {
                        setFormEditar(prev => ({
                          ...prev,
                          imagenesFiles: prev.imagenesFiles.filter((_, i) => i !== idx)
                        }));
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resto del formulario (nombre, descripción, categoría, tags) - sin cambios */}
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" value={formEditar.nombre || ""} onChange={e => setFormEditar({...formEditar, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input form-textarea" value={formEditar.descripcion || ""} onChange={e => setFormEditar({...formEditar, descripcion: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={formEditar.categoria || "Material"} onChange={e => setFormEditar({...formEditar, categoria: e.target.value})}>
                <option>Material</option><option>Inmaterial</option><option>Biocultural</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (separados por coma)</label>
              <input className="form-input" value={formEditar.tagsInput || ""} onChange={e => setFormEditar({...formEditar, tagsInput: e.target.value})} placeholder="Ej: colonial, museo" />
            </div>
          </div>
        </div>

        {/* Columna derecha: mapa y municipio (sin cambios) */}
        <div className="edit-right">
          <div className="form-group">
            <label className="form-label">Municipio</label>
            <select className="form-input" value={formEditar.municipioId || ""} onChange={e => setFormEditar({...formEditar, municipioId: e.target.value})}>
              <option value="">Selecciona</option>
              {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">📍 Selecciona la ubicación en el mapa</label>
            <MapPicker
              key={`${formEditar.latitud}-${formEditar.longitud}`}
              latitud={formEditar.latitud}
              longitud={formEditar.longitud}
              onLocationSelect={handleMapSelectEditar}
            />
            {formEditar.latitud && formEditar.longitud && (
              <div className="form-row" style={{ marginTop: "12px" }}>
                <div className="form-group"><label>Latitud</label><input className="form-input" value={formEditar.latitud} readOnly /></div>
                <div className="form-group"><label>Longitud</label><input className="form-input" value={formEditar.longitud} readOnly /></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn-primary" onClick={guardarEdicion} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
        <button className="btn-secondary" onClick={cerrarEditar}>Cancelar</button>
      </div>
    </div>
  </div>
)}

{/* Lightbox / Galería modal */}
{lightboxOpen && (
  <div className="lightbox-overlay" onClick={closeLightbox}>
    <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
      <button className="lightbox-close" onClick={closeLightbox}>✕</button>
      <button className="lightbox-prev" onClick={prevImage}>‹</button>
      <img
        className="lightbox-image"
        src={lightboxImages[lightboxIndex]?.url}
        alt={lightboxImages[lightboxIndex]?.alt || 'Imagen'}
      />
      <button className="lightbox-next" onClick={nextImage}>›</button>
      <div className="lightbox-counter">
        {lightboxIndex + 1} / {lightboxImages.length}
      </div>
    </div>
  </div>
)}

      {/* PÁGINA PRINCIPAL (sin cambios) */}
      <div className="page">
        <div className="page-header">
          <div className="page-title">Patrimonios</div>
          <div className="page-crumb">Administración · Patrimonios Culturales</div>
        </div>
        <button className="btn-primary" onClick={() => setModalNuevo(true)}>+ Nuevo Patrimonio</button>
        {error && <div className="error-banner">{error}</div>}

        <div className="metrics">
          <div className="m-card"><div><div className="m-label">Pendientes</div><div className="m-value">{pendientes}</div><div className="m-sub">Requieren revisión</div></div></div>
          <div className="m-card"><div><div className="m-label">Registrados</div><div className="m-value">{registrados}</div><div className="m-sub">Catalogados y activos</div></div></div>
          <div className="m-card"><div><div className="m-label">Total</div><div className="m-value">{patrimoniosUI.length}</div><div className="m-sub">En el inventario</div></div></div>
        </div>

        <div className="card">
          <div className="tbar">
            <div className="fpill">
              <select className="fsel" value={filtro.municipio} onChange={e => setFiltro({...filtro, municipio: e.target.value})}>
                <option value="Todos">Todos</option>
                {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="fpill">
              <select className="fsel" value={filtro.categoria} onChange={e => setFiltro({...filtro, categoria: e.target.value})}>
                <option value="Todas">Todas</option><option>Material</option><option>Inmaterial</option><option>Biocultural</option>
              </select>
            </div>
            <div className="fpill">
              <select className="fsel" value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})}>
                <option value="Todos">Todos</option><option>Pendiente</option><option>Registrado</option>
              </select>
            </div>
            <div className="spacer" />
            <button
              className="fpill"
              onClick={descargarExcelPatrimonios}
              style={{
                background: 'var(--gray-50)',
                border: '1.5px solid var(--gray-200)',
                borderRadius: '20px',
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Exportar a Excel">
              <img src="/xls.png" alt="Exportar Excel" style={{ width: '20px', height: '20px' }} />
            </button>
            <span className="cnt">{filtrados.length} registros</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>ID</th><th>Imagen</th><th>Patrimonio</th><th>Categoría</th><th>Estado</th><th>Registro</th><th>Actualización</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="8"><div className="empty">Cargando...</div></td></tr> : filtrados.length === 0 ? <tr><td colSpan="8"><div className="empty">Sin resultados</div></td></tr> : filtrados.map(item => (
                  <tr key={item.id}>
                    <td><span className="tid">#{item.id}</span></td>
                    <td><img src={item.imagen} alt={item.nombre} className="thumb" /></td>
                    <td><div className="ttitle">{item.nombre}</div><div className="tloc">{item.ubicacion}, Sonora</div></td>
                    <td><span className={`bcat ${item.categoria.toLowerCase()}`}>{item.categoria}</span></td>
                    <td><span className={`bst ${item.estado.toLowerCase()}`}><span className={`dot ${item.estado === "Registrado" ? "green" : "amber"}`} />{item.estado}</span></td>
                    <td><span className="tdate">{item.fechaRegistro}</span></td>
                    <td><span className="tdate">{item.fechaActualizacion}</span></td>
                    <td><div><button className="ab view" onClick={() => abrirVer(item)}>Ver</button><button className="ab edit" onClick={() => abrirEditar(item)}>Editar</button><button className="ab delete" onClick={() => onDelete(item.id)}>Eliminar</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-900: #0d3320;
    --green-800: #134d30;
    --green-700: #1a6640;
    --green-600: #1f7a4c;
    --green-500: #27a060;
    --green-100: #dcf5e8;
    --gray-900: #111714;
    --gray-700: #2a332e;
    --gray-600: #3d4d45;
    --gray-400: #6b7d73;
    --gray-200: #cdd8d2;
    --gray-100: #e8efeb;
    --gray-50:  #f4f7f5;
    --amber-500: #f59e0b;
    --amber-100: #fef3c7;
    --red-600:   #dc2626;
    --red-100:   #fee2e2;
    --radius-sm: 6px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
    --shadow-md: 0 4px 12px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.06);
    --shadow-xl: 0 20px 60px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.10);
  }

  body { margin: 0; background: var(--gray-50); font-family: 'DM Sans', sans-serif; color: var(--gray-900); }

  .page { padding: 28px 24px; width: 100%; }
  .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .page-title  { font-size: 21px; font-weight: 700; color: var(--gray-900); }
  .page-crumb  { font-size: 12px; color: var(--gray-400); margin-top: 3px; }

  .metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 26px; }
  .m-card {
    background: white; border-radius: var(--radius-lg); padding: 18px 22px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100);
    display: flex; align-items: center; gap: 16px;
    transition: box-shadow .2s, transform .2s;
  }
  .m-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .m-label { font-size: 11px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .05em; }
  .m-value { font-size: 30px; font-weight: 700; color: var(--gray-900); line-height: 1.1; font-family: 'DM Mono', monospace; }
  .m-sub   { font-size: 11.5px; color: var(--gray-400); }

  .card { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }

  .tbar { padding: 13px 18px; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
  .fpill { display: flex; align-items: center; gap: 5px; background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 20px; padding: 5px 10px; font-size: 12px; font-weight: 500; color: var(--gray-700); }
  .fsel  { background: transparent; border: none; outline: none; font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 500; color: var(--gray-700); cursor: pointer; appearance: none; padding-right: 8px; }
  .farrow { font-size: 9px; color: var(--gray-400); margin-left: -5px; }
  .spacer { flex: 1; }
  .cnt { background: var(--green-100); color: var(--green-800); font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }

  .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; min-width: 680px; }
  thead tr { background: var(--gray-50); }
  th { padding:11px 14px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--gray-400); text-align:left; white-space:nowrap; }
  td { padding:12px 14px; border-top:1px solid var(--gray-100); font-size:13px; color:var(--gray-700); vertical-align:middle; }
  tr:hover td { background: var(--gray-50); }

  .tid    { font-family:'DM Mono',monospace; font-size:11.5px; color:var(--gray-400); }
  .thumb  { width:44px; height:44px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--gray-200); }
  .ttitle { font-weight:600; color:var(--gray-900); margin-bottom:2px; font-size:13.5px; }
  .tloc   { font-size:11.5px; color:var(--gray-400); }

  .bcat { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; background:var(--gray-100); color:var(--gray-600); white-space:nowrap; }
  .bcat.material    { background:#e0f2fe; color:#0369a1; }
  .bcat.inmaterial  { background:#f3e8ff; color:#7c3aed; }
  .bcat.biocultural { background:#fef9c3; color:#854d0e; }

  .bst { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; }
  .bst.pendiente  { background:var(--amber-100); color:#92400e; }
  .bst.registrado { background:var(--green-100); color:var(--green-800); }
  .dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .dot.amber { background:var(--amber-500); }
  .dot.green { background:var(--green-500); }

  .tdate { font-size:12px; font-family:'DM Mono',monospace; color:var(--gray-400); white-space:nowrap; }

  .ab { padding:6px 12px; border-radius:var(--radius-sm); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all .18s ease; white-space:nowrap; display:inline-flex; align-items:center; gap:5px; width:70px; height:30px; border-radius:8px; justify-content:center; font-size:14px; margin:1px; }
  .ab:active { transform:scale(.95); }
  .ab.edit   { background:var(--gray-100); color:var(--gray-700); margin-right:5px; }
  .ab.edit:hover { background:var(--gray-200); color:var(--gray-900); }
  .ab.view   { background:#e0f2fe; color:#0369a1; margin-right:5px; }
  .ab.view:hover { background:#bae6fd; color:#075985; }
  .ab.delete { background:var(--red-100); color:var(--red-600); }
  .ab.delete:hover { background:#fecaca; color:#991b1b; }

  .empty { padding:50px 24px; text-align:center; color:var(--gray-400); font-size:13.5px; }
  .empty-icon { font-size:32px; margin-bottom:10px; }

  /* ── MODAL ── */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .modal {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideUp .2s ease;
    overflow: hidden;
  }
  @keyframes slideUp { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }

  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--gray-100);
    flex-shrink: 0;
  }
  .modal-title { font-size: 17px; font-weight: 700; color: var(--gray-900); }
  .modal-crumb { font-size: 12px; color: var(--gray-400); margin-top: 3px; font-family: 'DM Mono', monospace; }
  .modal-close {
    background: var(--gray-100); border: none; cursor: pointer;
    width: 30px; height: 30px; border-radius: 50%;
    font-size: 13px; color: var(--gray-600);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .15s;
  }
  .modal-close:hover { background: var(--gray-200); }

  .modal-body {
    padding: 20px 22px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-img {
    width: 100%; height: 200px; object-fit: cover;
    border-radius: var(--radius-sm); border: 1px solid var(--gray-100);
  }

  .modal-badges { display: flex; gap: 8px; flex-wrap: wrap; }

  .modal-desc { font-size: 13.5px; color: var(--gray-600); line-height: 1.6; }

  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-field { background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--gray-100); }
  .mf-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-400); margin-bottom: 4px; }
  .mf-value { font-size: 13.5px; font-weight: 600; color: var(--gray-900); }
  .mf-value.mono { font-family: 'DM Mono', monospace; font-weight: 400; font-size: 12.5px; }

  .modal-footer {
    padding: 14px 22px;
    border-top: 1px solid var(--gray-100);
    display: flex; gap: 8px; justify-content: flex-end;
    flex-shrink: 0;
  }

  .btn-primary {
    background: var(--green-700); color: white; border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s;
    margin: 10px;
  }
  .btn-primary:hover { background: var(--green-800); }

  .btn-secondary {
    background: var(--gray-100); color: var(--gray-700); border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s;
  }
  .btn-secondary:hover { background: var(--gray-200); }

  /* FORM */
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-400); }
  .form-input {
    background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);
    padding: 8px 11px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--gray-900);
    outline: none; transition: border-color .15s; width: 100%;
  }
  .form-input:focus { border-color: var(--green-500); background: white; }
  .form-textarea { min-height: 80px; resize: vertical; }

  /* Modal más grande */
.modal.modal-large {
  max-width: 1100px;
  width: 90vw;
}

/* Layout de dos columnas */
.modal-body.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* Ajustes para la galería */
.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
.gallery-item {
  width: 100px;
  text-align: center;
}
.gallery-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
}
.gallery-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  margin-top: 4px;
  justify-content: center;
}

.new-images-list {
  margin-top: 8px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  padding: 8px;
}
.new-image-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--gray-200);
}
.new-image-item:last-child { border-bottom: none; }
.ab.delete.small {
  padding: 2px 8px;
  font-size: 11px;
  width: auto;
  height: auto;
}

.edit-portada-preview {
  max-width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  border: 1px solid var(--gray-200);
}

/* Responsive */
@media (max-width: 800px) {
  .modal-body.two-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .modal.modal-large {
    width: 95vw;
  }
}

/* Estilos para el modal de ver */
.view-main-image {
  position: relative;
  margin-bottom: 20px;
}
.view-main-image img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
}
.image-zoom-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0,0,0,0.6);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: background 0.2s;
}
.image-zoom-btn:hover {
  background: rgba(0,0,0,0.8);
}

.view-gallery {
  margin-top: 16px;
}
.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
.gallery-item {
  width: 100px;
  height: 100px;
  cursor: pointer;
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
  transition: transform 0.2s;
}
.gallery-item img:hover {
  transform: scale(1.05);
}

.view-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.view-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.section-title-small {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gray-400);
  margin-bottom: 8px;
}
.view-description p {
  font-size: 14px;
  line-height: 1.5;
  color: var(--gray-700);
}
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-badge {
  background: var(--gray-100);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: var(--gray-700);
}
.location-coords {
  background: var(--gray-50);
  padding: 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--gray-100);
}
.mono {
  font-family: 'DM Mono', monospace;
}
.maps-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--green-700);
  text-decoration: none;
  font-weight: 500;
  font-size: 13px;
}
.maps-link:hover {
  text-decoration: underline;
}
.view-dates {
  font-size: 12px;
  color: var(--gray-500);
  border-top: 1px solid var(--gray-100);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
.lightbox-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}
.lightbox-close {
  position: absolute;
  top: -40px;
  right: -40px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.lightbox-close:hover {
  background: rgba(255,255,255,0.4);
}
.lightbox-prev,
.lightbox-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 48px;
  cursor: pointer;
  width: 60px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  border-radius: 8px;
}
.lightbox-prev { left: -70px; }
.lightbox-next { right: -70px; }
.lightbox-prev:hover,
.lightbox-next:hover {
  background: rgba(255,255,255,0.4);
}
.lightbox-counter {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-family: 'DM Mono', monospace;
}
.image-zoom-btn-small {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.5);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-portada-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}
@media (max-width: 768px) {
  .lightbox-prev { left: 10px; font-size: 32px; width: 40px; height: 60px; }
  .lightbox-next { right: 10px; font-size: 32px; width: 40px; height: 60px; }
  .lightbox-close { top: 10px; right: 10px; }
  .lightbox-counter { bottom: -30px; }
}
`;