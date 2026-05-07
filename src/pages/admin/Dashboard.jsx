import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  getPatrimonios,
  createPatrimonio,
  updatePatrimonio,
  deletePatrimonio,
  getMunicipios,
  descargarExcelPatrimonios,
  getTags,
  updateTag,
  deleteTag,
} from "../../services/patrimonioService";

// ----- Importaciones para el mapa -----
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Componente Mapa: permite agregar puntos al hacer clic y muestra los puntos existentes
function MapPicker({ ubicaciones = [], onLocationAdd }) {
  // Determinar el centro del mapa: si hay ubicaciones, usa la primera; si no, usa un centro por defecto
  const defaultCenter = ubicaciones.length > 0
    ? [ubicaciones[0].latitud, ubicaciones[0].longitud]
    : [29.0729, -110.9559];

  const handleClick = (e) => {
    const { lat, lng } = e.latlng;
    const nombre = window.prompt("Nombre opcional para este punto (ej: Entrada principal)", "");
    if (nombre !== null) { // Si el usuario cancela no se agrega
      onLocationAdd({ lat, lng }, nombre || "");
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "300px", width: "100%", borderRadius: "var(--radius-sm)", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors, &copy; Carto'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={handleClick} />
      {/* Mostrar todos los marcadores de las ubicaciones */}
      {ubicaciones.map((ubi, idx) => (
        <Marker key={idx} position={[ubi.latitud, ubi.longitud]}>
          <Popup>
            {ubi.nombre_punto || "Sin nombre"}<br />
            {ubi.es_principal && <strong>📍 Principal</strong>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click(e) { onClick(e); } });
  return null;
}

// Componente para mostrar un mapa estático (solo lectura) en el modal Ver
function StaticMap({ ubicaciones }) {
  const center = ubicaciones.length > 0
    ? [ubicaciones[0].latitud, ubicaciones[0].longitud]
    : [29.0729, -110.9559];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "250px", width: "100%", borderRadius: "var(--radius-sm)", marginTop: "12px" }}
      zoomControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" />
      {ubicaciones.map((ubi, idx) => (
        <Marker key={idx} position={[ubi.latitud, ubi.longitud]}>
          <Popup>{ubi.nombre_punto || "Punto"}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function AdminDashboard() {
  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [filtro, setFiltro] = useState({
    municipio: "Todos",
    categoria: "Todas",
    estado: "Todos",
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [modalVer, setModalVer] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({
    id: null,
    nombre: "",
    municipioId: "",
    categoria: "Material",
    descripcion: "",
    ubicaciones: [],      // array de objetos { nombre_punto, latitud, longitud, es_principal }
    tags: [],
    newTagInput: "",
    portadaFile: null,
    imagenesFiles: [],
    galeriaActual: [],
    imagenesAEliminar: [],
  });

  const [modalNuevo, setModalNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    municipioId: "",
    categoria: "Material",
    descripcion: "",
    ubicaciones: [],
    tags: [],
    newTagInput: "",
    portadaFile: null,
    imagenesFiles: [],
  });

  const [modalTagsOpen, setModalTagsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost:3000";

  const municipioNombrePorId = useMemo(() => {
    const map = new Map();
    municipios.forEach((m) => map.set(String(m.id), m.nombre));
    return map;
  }, [municipios]);

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      const [respPatrimonios, respMunicipios, respTags] = await Promise.all([
        getPatrimonios(),
        getMunicipios(),
        getTags(),
      ]);
      setMunicipios(Array.isArray(respMunicipios) ? respMunicipios : []);
      setTagsList(Array.isArray(respTags) ? respTags : []);
      const lista = Array.isArray(respPatrimonios) ? respPatrimonios : respPatrimonios?.data || [];
      setPatrimonios(lista);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Gestión global de tags
  const handleEditTag = async (tag) => {
    const nuevoNombre = window.prompt("Nuevo nombre del tag:", tag.nombre);
    if (nuevoNombre && nuevoNombre.trim() !== tag.nombre) {
      try {
        await updateTag(tag.id, nuevoNombre.trim());
        await cargarDatos();
      } catch (err) {
        console.error(err);
        alert("Error al actualizar el tag.");
      }
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!window.confirm(`¿Eliminar el tag "${tag.nombre}"? Se removerá de todos los patrimonios.`)) return;
    try {
      await deleteTag(tag.id);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el tag.");
    }
  };

  // Abrir modales
  const abrirVer = (item) => setModalVer(item);
  const cerrarVer = () => setModalVer(null);

  const abrirEditar = (item) => {
    const tagsActuales = (item.tags || []).map(t => typeof t === 'object' ? t.nombre : t);
    setFormEditar({
      id: item.id,
      nombre: item.nombre,
      municipioId: item.municipioId,
      categoria: item.categoria,
      descripcion: item.descripcion,
      ubicaciones: item.ubicaciones || [],
      tags: tagsActuales,
      newTagInput: "",
      portadaFile: null,
      imagenesFiles: [],
      galeriaActual: item.galeria || [],
      imagenesAEliminar: [],
    });
    setModalEditar(item);
  };

  const cerrarEditar = () => {
    setModalEditar(null);
    setFormEditar({});
  };

  // Helper para agregar/quitar tags
  const addTagToForm = (form, setForm, tagNombre) => {
    const nuevo = tagNombre.trim().toLowerCase();
    if (nuevo && !form.tags.includes(nuevo)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, nuevo], newTagInput: "" }));
    }
  };

  const removeTagFromForm = (form, setForm, tagNombre) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagNombre) }));
  };

  // Funciones para manejar ubicaciones
  const agregarUbicacion = (form, setForm, coords, nombrePunto = "") => {
    const nuevasUbicaciones = [...form.ubicaciones];
    const esPrincipal = nuevasUbicaciones.length === 0;
    nuevasUbicaciones.push({
      nombre_punto: nombrePunto,
      latitud: coords.lat,
      longitud: coords.lng,
      es_principal: esPrincipal,
    });
    setForm(prev => ({ ...prev, ubicaciones: nuevasUbicaciones }));
  };

  const eliminarUbicacion = (form, setForm, index) => {
    const nuevas = form.ubicaciones.filter((_, i) => i !== index);
    if (nuevas.length > 0 && !nuevas.some(u => u.es_principal)) {
      nuevas[0].es_principal = true;
    }
    setForm(prev => ({ ...prev, ubicaciones: nuevas }));
  };

  const actualizarNombreUbicacion = (form, setForm, index, nuevoNombre) => {
    const nuevas = [...form.ubicaciones];
    nuevas[index].nombre_punto = nuevoNombre;
    setForm(prev => ({ ...prev, ubicaciones: nuevas }));
  };

  const marcarPrincipal = (form, setForm, index) => {
    const nuevas = form.ubicaciones.map((ubi, i) => ({
      ...ubi,
      es_principal: i === index,
    }));
    setForm(prev => ({ ...prev, ubicaciones: nuevas }));
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
      formData.append("municipioId", formNuevo.municipioId);
      formData.append("ubicaciones", JSON.stringify(formNuevo.ubicaciones));
      if (formNuevo.portadaFile) formData.append("portada", formNuevo.portadaFile);
      formNuevo.imagenesFiles.forEach(file => formData.append("imagenes", file));
      formNuevo.tags.forEach(tag => formData.append("tags[]", tag));
      await createPatrimonio(formData);
      setModalNuevo(false);
      setFormNuevo({
        nombre: "",
        municipioId: "",
        categoria: "Material",
        descripcion: "",
        ubicaciones: [],
        tags: [],
        newTagInput: "",
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
      const hayArchivos = formEditar.portadaFile || formEditar.imagenesFiles.length > 0 || formEditar.imagenesAEliminar.length > 0;
      if (hayArchivos) {
        const fd = new FormData();
        fd.append("nombre", formEditar.nombre);
        fd.append("categoria", formEditar.categoria);
        fd.append("descripcion", formEditar.descripcion);
        fd.append("municipioId", formEditar.municipioId);
        fd.append("ubicaciones", JSON.stringify(formEditar.ubicaciones));
        if (formEditar.tags && formEditar.tags.length > 0) {
          formEditar.tags.forEach(tag => fd.append("tags[]", tag));
        } else {
          fd.append("tags", "");
        }
        if (formEditar.portadaFile) fd.append("portada", formEditar.portadaFile);
        formEditar.imagenesFiles.forEach(file => fd.append("imagenes", file));
        if (formEditar.imagenesAEliminar.length) {
          fd.append("eliminarImagenesIds", formEditar.imagenesAEliminar.join(","));
        }
        dataToSend = fd;
      } else {
        dataToSend = {
          nombre: formEditar.nombre,
          categoria: formEditar.categoria,
          descripcion: formEditar.descripcion,
          municipioId: formEditar.municipioId,
          ubicaciones: formEditar.ubicaciones,
          tags: formEditar.tags || [],
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

  // Transformar datos para la UI
  const patrimoniosUI = useMemo(() => {
    return patrimonios.map((item) => {
      const ubicaciones = item.ubicaciones || [];
      const principal = ubicaciones.find(u => u.es_principal) || ubicaciones[0];
      return {
        id: item.id,
        nombre: item.nombre ?? "",
        categoria: item.categoria ?? "Material",
        descripcion: item.descripcion ?? "",
        ubicaciones: ubicaciones,
        latitud: principal?.latitud || "",
        longitud: principal?.longitud || "",
        imagen: item.imagen_url
          ? item.imagen_url.startsWith("http")
            ? item.imagen_url
            : `${API_BASE}${item.imagen_url}`
          : "https://placehold.co/600x400?text=Sin+imagen",
        galeria: (item.galeria || []).map(g => ({
          id: g.id,
          url: g.url.startsWith("http") ? g.url : `${API_BASE}${g.url}`
        })),
        municipioId: item.municipioId,
        ubicacion: municipioNombrePorId.get(String(item.municipioId)) || "Sin municipio",
        estado: "Registrado",
        fechaRegistro: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
        fechaActualizacion: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—",
        tags: item.tags || [],
      };
    });
  }, [patrimonios, municipioNombrePorId, API_BASE]);

  const filtrados = patrimoniosUI.filter((p) => {
    const matchesMunicipio = filtro.municipio === "Todos" || String(p.municipioId) === String(filtro.municipio);
    const matchesCategoria = filtro.categoria === "Todas" || p.categoria === filtro.categoria;
    const matchesEstado = filtro.estado === "Todos" || p.estado === filtro.estado;
    let matchesSearch = true;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      const nombreMatch = p.nombre.toLowerCase().includes(term);
      const descripcionMatch = p.descripcion.toLowerCase().includes(term);
      const ubicacionMatch = p.ubicacion.toLowerCase().includes(term);
      const tagsMatch = p.tags.some(tag => {
        const tagName = typeof tag === 'object' ? tag.nombre : tag;
        return tagName && tagName.toLowerCase().includes(term);
      });
      matchesSearch = nombreMatch || descripcionMatch || ubicacionMatch || tagsMatch;
    }
    return matchesMunicipio && matchesCategoria && matchesEstado && matchesSearch;
  });

  const registrados = patrimoniosUI.filter((p) => p.estado === "Registrado").length;
  const pendientes = patrimoniosUI.filter((p) => p.estado === "Pendiente").length;

  // Lightbox
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

      {/* MODAL NUEVO PATRIMONIO */}
      {modalNuevo && (
        <div className="overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nuevo Patrimonio</div>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <div className="modal-body two-columns">
              <div className="edit-left">
                <div className="form-group">
                  <label className="form-label">Imagen de portada</label>
                  <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadNuevo} />
                  {formNuevo.portadaFile && (
                    <div style={{ marginTop: "8px" }}>
                      <img src={URL.createObjectURL(formNuevo.portadaFile)} alt="Vista previa portada" style={{ maxWidth: "100%", maxHeight: "160px", borderRadius: "var(--radius-sm)", border: "1px solid var(--gray-200)" }} />
                      <small style={{ display: "block", marginTop: "4px" }}>{formNuevo.portadaFile.name}</small>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Galería de imágenes (varias)</label>
                  <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadNuevo} />
                  {formNuevo.imagenesFiles.length > 0 && (
                    <div className="gallery-grid" style={{ marginTop: "12px" }}>
                      {formNuevo.imagenesFiles.map((file, idx) => (
                        <div key={idx} className="gallery-item">
                          <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                          <button type="button" className="ab delete small" onClick={() => removeGaleriaFileNuevo(idx)} style={{ marginTop: "4px", width: "auto", padding: "2px 8px" }}>Quitar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="edit-right">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={formNuevo.nombre} onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Municipio</label>
                    <select className="form-input" value={formNuevo.municipioId} onChange={e => setFormNuevo({ ...formNuevo, municipioId: e.target.value })}>
                      <option value="">Selecciona</option>
                      {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select className="form-input" value={formNuevo.categoria} onChange={e => setFormNuevo({ ...formNuevo, categoria: e.target.value })}>
                      <option>Material</option><option>Inmaterial</option><option>Biocultural</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="current-tags">
                    {formNuevo.tags.map(tag => (
                      <span key={tag} className="tag-badge editable">
                        {tag}
                        <button type="button" className="remove-tag" onClick={() => removeTagFromForm(formNuevo, setFormNuevo, tag)}>✕</button>
                      </span>
                    ))}
                    {formNuevo.tags.length === 0 && <span className="no-tags">Sin tags</span>}
                  </div>
                  <div className="add-tag-row">
                    <input type="text" className="form-input" placeholder="Nuevo tag" value={formNuevo.newTagInput} onChange={e => setFormNuevo(prev => ({ ...prev, newTagInput: e.target.value }))} onKeyPress={e => e.key === 'Enter' && addTagToForm(formNuevo, setFormNuevo, formNuevo.newTagInput)} />
                    <button type="button" className="btn-secondary small" onClick={() => addTagToForm(formNuevo, setFormNuevo, formNuevo.newTagInput)}>Agregar</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-input form-textarea" value={formNuevo.descripcion} onChange={e => setFormNuevo({ ...formNuevo, descripcion: e.target.value })} />
                </div>

                {/* Ubicaciones múltiples con mapa y marcadores */}
                <div className="form-group">
                  <label className="form-label">📍 Puntos de ubicación (haz clic en el mapa para agregar)</label>
                  <MapPicker 
                    ubicaciones={formNuevo.ubicaciones}
                    onLocationAdd={(coords, nombre) => agregarUbicacion(formNuevo, setFormNuevo, coords, nombre)} 
                  />
                  {formNuevo.ubicaciones.length > 0 && (
                    <div className="ubicaciones-list">
                      {formNuevo.ubicaciones.map((ubi, idx) => (
                        <div key={idx} className="ubicacion-item">
                          <div className="ubicacion-header">
                            <input
                              type="text"
                              className="form-input ubicacion-nombre"
                              value={ubi.nombre_punto || ""}
                              placeholder="Nombre del punto"
                              onChange={(e) => actualizarNombreUbicacion(formNuevo, setFormNuevo, idx, e.target.value)}
                            />
                            <div className="ubicacion-actions">
                              {!ubi.es_principal && (
                                <button type="button" className="ab small" onClick={() => marcarPrincipal(formNuevo, setFormNuevo, idx)}>★ Principal</button>
                              )}
                              {ubi.es_principal && <span className="principal-badge">Principal</span>}
                              <button type="button" className="ab delete small" onClick={() => eliminarUbicacion(formNuevo, setFormNuevo, idx)}>Eliminar</button>
                            </div>
                          </div>
                          <div className="ubicacion-coords">
                            <span>Lat: {ubi.latitud}</span>
                            <span>Lng: {ubi.longitud}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarNuevo} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER */}
      {modalVer && (
        <div className="overlay" onClick={cerrarVer}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modalVer.nombre}</div>
              <button className="modal-close" onClick={cerrarVer}>✕</button>
            </div>
            <div className="modal-body two-columns">
              <div className="view-left">
                <div className="view-main-image">
                  <img src={modalVer.imagen} alt={modalVer.nombre} onClick={() => { const allImages = [{ url: modalVer.imagen, alt: modalVer.nombre }, ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))]; openLightbox(allImages, 0); }} style={{ cursor: 'pointer' }} />
                  <button className="image-zoom-btn" onClick={() => { const allImages = [{ url: modalVer.imagen, alt: modalVer.nombre }, ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))]; openLightbox(allImages, 0); }}>⤢</button>
                </div>
                {modalVer.galeria && modalVer.galeria.length > 0 && (
                  <div className="view-gallery">
                    <label className="form-label">Galería de imágenes</label>
                    <div className="gallery-grid">
                      {modalVer.galeria.map((img, idx) => (
                        <div key={img.id} className="gallery-item">
                          <img src={img.url} alt={`galería ${idx}`} onClick={() => { const allImages = [{ url: modalVer.imagen, alt: modalVer.nombre }, ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))]; openLightbox(allImages, idx + 1); }} style={{ cursor: 'pointer' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="view-right">
                <div className="view-badges">
                  <span className={`bcat ${modalVer.categoria.toLowerCase()}`}>{modalVer.categoria}</span>
                  <span className={`bst ${modalVer.estado.toLowerCase()}`}><span className={`dot ${modalVer.estado === "Registrado" ? "green" : "amber"}`} />{modalVer.estado}</span>
                </div>
                {modalVer.descripcion && (
                  <div className="view-description"><h3 className="section-title-small">Descripción</h3><p>{modalVer.descripcion}</p></div>
                )}
                <div className="view-tags"><h3 className="section-title-small">Tags</h3><div className="tags-list">{modalVer.tags && modalVer.tags.length > 0 ? modalVer.tags.map((tag, idx) => (<span key={idx} className="tag-badge">{typeof tag === 'object' ? tag.nombre : tag}</span>)) : (<span className="tag-badge">Sin tags</span>)}</div></div>
                
                {/* Mostrar todas las ubicaciones con mapa estático */}
                <div className="view-location">
                  <h3 className="section-title-small">Ubicaciones</h3>
                  {modalVer.ubicaciones && modalVer.ubicaciones.length > 0 ? (
                    <>
                      {modalVer.ubicaciones.map((ubi, idx) => (
                        <div key={idx} className="location-item">
                          <div><strong>{ubi.nombre_punto || `Punto ${idx+1}`}</strong> {ubi.es_principal && <span className="principal-badge">Principal</span>}</div>
                          <div className="location-coords">
                            <span>Lat: {ubi.latitud}</span>
                            <span>Lng: {ubi.longitud}</span>
                          </div>
                          <a href={`https://www.google.com/maps?q=${ubi.latitud},${ubi.longitud}`} target="_blank" rel="noreferrer" className="maps-link">Ver en mapa</a>
                        </div>
                      ))}
                      <StaticMap ubicaciones={modalVer.ubicaciones} />
                    </>
                  ) : (
                    <div className="no-tags">Sin ubicaciones registradas</div>
                  )}
                </div>
                
                <div className="view-dates"><div><strong>Fecha de registro:</strong> {modalVer.fechaRegistro}</div><div><strong>Última actualización:</strong> {modalVer.fechaActualizacion}</div></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="ab edit" onClick={() => { cerrarVer(); abrirEditar(modalVer); }}>Editar</button>
              <button className="btn-secondary" onClick={cerrarVer}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Editar Patrimonio</div>
              <button className="modal-close" onClick={cerrarEditar}>✕</button>
            </div>
            <div className="modal-body two-columns">
              <div className="edit-left">
                <div className="form-group">
                  <label className="form-label">Imagen de portada actual</label>
                  {modalEditar?.imagen && (
                    <div className="edit-portada-wrapper">
                      <img src={modalEditar.imagen} alt="portada actual" className="edit-portada-preview" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, 0); }} style={{ cursor: 'pointer' }} />
                      <button className="image-zoom-btn-small" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, 0); }}>⤢</button>
                    </div>
                  )}
                  <label className="form-label" style={{ marginTop: "12px" }}>Cambiar portada</label>
                  <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadEditar} />
                  {formEditar.portadaFile && <small>Archivo seleccionado: {formEditar.portadaFile.name}</small>}
                </div>
                <div className="form-group">
                  <label className="form-label">Galería actual</label>
                  <div className="gallery-grid">
                    {formEditar.galeriaActual?.map((img, idx) => (
                      <div key={img.id} className="gallery-item">
                        <img src={img.url} alt="galería" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, idx + 1); }} style={{ cursor: 'pointer' }} />
                        <label className="gallery-check"><input type="checkbox" checked={formEditar.imagenesAEliminar?.includes(img.id)} onChange={() => toggleEliminarImagen(img.id)} /> Eliminar</label>
                      </div>
                    ))}
                  </div>
                  <label className="form-label" style={{ marginTop: "12px" }}>Agregar nuevas imágenes</label>
                  <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadEditar} />
                  {formEditar.imagenesFiles?.length > 0 && (
                    <div className="new-images-list">
                      {formEditar.imagenesFiles.map((file, idx) => (
                        <div key={idx} className="new-image-item"><span>{file.name}</span><button type="button" className="ab delete small" onClick={() => { setFormEditar(prev => ({ ...prev, imagenesFiles: prev.imagenesFiles.filter((_, i) => i !== idx) })); }}>Quitar</button></div>
                      ))}
                    </div>
                  )}
                </div>
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
                    <label className="form-label">Tags</label>
                    <div className="current-tags">
                      {formEditar.tags?.map(tag => (
                        <span key={tag} className="tag-badge editable">
                          {tag}
                          <button type="button" className="remove-tag" onClick={() => removeTagFromForm(formEditar, setFormEditar, tag)}>✕</button>
                        </span>
                      ))}
                      {(!formEditar.tags || formEditar.tags.length === 0) && <span className="no-tags">Sin tags</span>}
                    </div>
                    <div className="add-tag-row">
                      <input type="text" className="form-input" placeholder="Nuevo tag" value={formEditar.newTagInput || ""} onChange={e => setFormEditar(prev => ({ ...prev, newTagInput: e.target.value }))} onKeyPress={e => e.key === 'Enter' && addTagToForm(formEditar, setFormEditar, formEditar.newTagInput)} />
                      <button type="button" className="btn-secondary small" onClick={() => addTagToForm(formEditar, setFormEditar, formEditar.newTagInput)}>Agregar</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="edit-right">
                <div className="form-group">
                  <label className="form-label">Municipio</label>
                  <select className="form-input" value={formEditar.municipioId || ""} onChange={e => setFormEditar({...formEditar, municipioId: e.target.value})}>
                    <option value="">Selecciona</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                
                {/* Ubicaciones múltiples con mapa y marcadores */}
                <div className="form-group">
                  <label className="form-label">📍 Puntos de ubicación (haz clic en el mapa para agregar)</label>
                  <MapPicker 
                    ubicaciones={formEditar.ubicaciones}
                    onLocationAdd={(coords, nombre) => agregarUbicacion(formEditar, setFormEditar, coords, nombre)} 
                  />
                  {formEditar.ubicaciones.length > 0 && (
                    <div className="ubicaciones-list">
                      {formEditar.ubicaciones.map((ubi, idx) => (
                        <div key={idx} className="ubicacion-item">
                          <div className="ubicacion-header">
                            <input
                              type="text"
                              className="form-input ubicacion-nombre"
                              value={ubi.nombre_punto || ""}
                              placeholder="Nombre del punto"
                              onChange={(e) => actualizarNombreUbicacion(formEditar, setFormEditar, idx, e.target.value)}
                            />
                            <div className="ubicacion-actions">
                              {!ubi.es_principal && (
                                <button type="button" className="ab small" onClick={() => marcarPrincipal(formEditar, setFormEditar, idx)}>★ Principal</button>
                              )}
                              {ubi.es_principal && <span className="principal-badge">Principal</span>}
                              <button type="button" className="ab delete small" onClick={() => eliminarUbicacion(formEditar, setFormEditar, idx)}>Eliminar</button>
                            </div>
                          </div>
                          <div className="ubicacion-coords">
                            <span>Lat: {ubi.latitud}</span>
                            <span>Lng: {ubi.longitud}</span>
                          </div>
                        </div>
                      ))}
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

      {/* MODAL GESTIÓN TAGS */}
      {modalTagsOpen && (
        <div className="overlay" onClick={() => setModalTagsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Administrar Tags</div>
              <button className="modal-close" onClick={() => setModalTagsOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tags-management-list">
                {tagsList.map(tag => (
                  <div key={tag.id} className="tag-management-item">
                    <span className="tag-name">{tag.nombre}</span>
                    <div className="tag-actions">
                      <button className="ab edit small" onClick={() => handleEditTag(tag)}>Editar</button>
                      <button className="ab delete small" onClick={() => handleDeleteTag(tag)}>Eliminar</button>
                    </div>
                  </div>
                ))}
                {tagsList.length === 0 && <div className="empty">No hay tags creados</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalTagsOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            <button className="lightbox-prev" onClick={prevImage}>‹</button>
            <img className="lightbox-image" src={lightboxImages[lightboxIndex]?.url} alt={lightboxImages[lightboxIndex]?.alt || 'Imagen'} />
            <button className="lightbox-next" onClick={nextImage}>›</button>
            <div className="lightbox-counter">{lightboxIndex + 1} / {lightboxImages.length}</div>
          </div>
        </div>
      )}

      {/* PÁGINA PRINCIPAL */}
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
            <div className="fpill"><select className="fsel" value={filtro.municipio} onChange={e => setFiltro({...filtro, municipio: e.target.value})}><option value="Todos">Todos</option>{municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
            <div className="fpill"><select className="fsel" value={filtro.categoria} onChange={e => setFiltro({...filtro, categoria: e.target.value})}><option value="Todas">Todas</option><option>Material</option><option>Inmaterial</option><option>Biocultural</option></select></div>
            <div className="fpill"><select className="fsel" value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})}><option value="Todos">Todos</option><option>Pendiente</option><option>Registrado</option></select></div>
            <div className="fpill" style={{ flex: '1 1 240px' }}><input type="text" className="fsel" placeholder="Buscar por nombre, descripción, municipio o tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '5px 8px' }} /></div>
            <div className="spacer" />
            <button className="fpill" onClick={() => setModalTagsOpen(true)} style={{ background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: '20px', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🏷️ Gestionar Tags</button>
            <button className="fpill" onClick={descargarExcelPatrimonios} style={{ background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: '20px', padding: '5px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Exportar a Excel"><img src="/xls.png" alt="Exportar Excel" style={{ width: '20px', height: '20px' }} /></button>
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
/* Nuevos estilos para badges editables y gestión de tags */
.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.tag-badge.editable {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--gray-100);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}
.remove-tag {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--gray-600);
  display: inline-flex;
  align-items: center;
  padding: 0;
}
.remove-tag:hover {
  color: var(--red-600);
}
.add-tag-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-secondary.small {
  padding: 5px 12px;
  font-size: 12px;
  white-space: nowrap;
}
.no-tags {
  font-size: 12px;
  color: var(--gray-400);
  font-style: italic;
}

/* Gestión global de tags */
.tags-management-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}
.tag-management-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--gray-50);
  border-radius: var(--radius-sm);
  border: 1px solid var(--gray-200);
}
.tag-name {
  font-weight: 500;
  color: var(--gray-900);
}
.tag-actions {
  display: flex;
  gap: 8px;
}
.ab.small {
  padding: 4px 12px;
  font-size: 11px;
  width: auto;
  height: auto;
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

/* Estilos para múltiples ubicaciones */
.ubicaciones-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ubicacion-item {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
  padding: 12px;
}
.ubicacion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.ubicacion-nombre {
  flex: 2;
  min-width: 150px;
}
.ubicacion-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.principal-badge {
  background: var(--green-100);
  color: var(--green-800);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.ubicacion-coords {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  font-family: monospace;
  color: var(--gray-600);
}
.location-item {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 12px;
}
.location-item:last-child {
  border-bottom: none;
}
`;

