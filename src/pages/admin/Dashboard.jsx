import React, { useEffect, useMemo, useState } from "react";
import {
  getPatrimonios,
  createPatrimonio,
  updatePatrimonio,
  deletePatrimonio,
  getMunicipios,
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

  return (
    <>
      <style>{STYLE}</style>

      {/* MODAL NUEVO con múltiples imágenes */}
      {modalNuevo && (
        <div className="overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nuevo Patrimonio</div>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={formNuevo.nombre} onChange={e => setFormNuevo({...formNuevo, nombre: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Municipio</label>
                  <select className="form-input" value={formNuevo.municipioId} onChange={e => setFormNuevo({...formNuevo, municipioId: e.target.value})}>
                    <option value="">Selecciona</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-input" value={formNuevo.categoria} onChange={e => setFormNuevo({...formNuevo, categoria: e.target.value})}>
                    <option>Material</option><option>Inmaterial</option><option>Biocultural</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📍 Selecciona la ubicación en el mapa</label>
                <MapPicker latitud={formNuevo.latitud} longitud={formNuevo.longitud} onLocationSelect={handleMapSelectNuevo} />
                {formNuevo.latitud && formNuevo.longitud && (
                  <div className="form-row" style={{ marginTop: "8px" }}>
                    <div className="form-group"><label>Latitud</label><input className="form-input" value={formNuevo.latitud} readOnly /></div>
                    <div className="form-group"><label>Longitud</label><input className="form-input" value={formNuevo.longitud} readOnly /></div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Imagen de portada</label>
                <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadNuevo} />
                {formNuevo.portadaFile && <small>Archivo seleccionado: {formNuevo.portadaFile.name}</small>}
              </div>

              <div className="form-group">
                <label className="form-label">Galería de imágenes (puedes seleccionar varias)</label>
                <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadNuevo} />
                {formNuevo.imagenesFiles.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    {formNuevo.imagenesFiles.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span>{file.name}</span>
                        <button type="button" className="ab delete" style={{ padding: "2px 8px" }} onClick={() => removeGaleriaFileNuevo(idx)}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tags (separados por coma)</label>
                <input className="form-input" value={formNuevo.tagsInput} onChange={e => setFormNuevo({...formNuevo, tagsInput: e.target.value})} placeholder="Ej: colonial, museo, histórico" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input form-textarea" value={formNuevo.descripcion} onChange={e => setFormNuevo({...formNuevo, descripcion: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarNuevo} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER con galería */}
      {modalVer && (
        <div className="overlay" onClick={cerrarVer}>
          <div className="modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modalVer.nombre}</div>
              <button className="modal-close" onClick={cerrarVer}>✕</button>
            </div>
            <div className="modal-body">
              <img src={modalVer.imagen} alt={modalVer.nombre} className="modal-img" />
              <div className="modal-badges">
                <span className={`bcat ${modalVer.categoria.toLowerCase()}`}>{modalVer.categoria}</span>
                <span className={`bst ${modalVer.estado.toLowerCase()}`}>
                  <span className={`dot ${modalVer.estado === "Registrado" ? "green" : "amber"}`} />
                  {modalVer.estado}
                </span>
              </div>
              {modalVer.descripcion && <p className="modal-desc">{modalVer.descripcion}</p>}
              <div className="modal-grid">
                <div className="modal-field"><div className="mf-label">Municipio</div><div className="mf-value">{modalVer.ubicacion}</div></div>
                <div className="modal-field"><div className="mf-label">Latitud</div><div className="mf-value mono">{modalVer.latitud}</div></div>
                <div className="modal-field"><div className="mf-label">Longitud</div><div className="mf-value mono">{modalVer.longitud}</div></div>
                <div className="modal-field"><div className="mf-label">Registro</div><div className="mf-value mono">{modalVer.fechaRegistro}</div></div>
                <div className="modal-field"><div className="mf-label">Actualización</div><div className="mf-value mono">{modalVer.fechaActualizacion}</div></div>
              </div>
              {modalVer.galeria && modalVer.galeria.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Galería de imágenes</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                    {modalVer.galeria.map(img => (
                      <img key={img.id} src={img.url} alt="galería" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--gray-200)" }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="ab edit" onClick={() => { cerrarVer(); abrirEditar(modalVer); }}>Editar</button>
              <button className="btn-secondary" onClick={cerrarVer}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR con manejo de galería */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Editar Patrimonio</div>
              <button className="modal-close" onClick={cerrarEditar}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={formEditar.nombre || ""} onChange={e => setFormEditar({...formEditar, nombre: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Municipio</label>
                  <select className="form-input" value={formEditar.municipioId || ""} onChange={e => setFormEditar({...formEditar, municipioId: e.target.value})}>
                    <option value="">Selecciona</option>
                    {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select className="form-input" value={formEditar.categoria || "Material"} onChange={e => setFormEditar({...formEditar, categoria: e.target.value})}>
                    <option>Material</option><option>Inmaterial</option><option>Biocultural</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📍 Selecciona la ubicación en el mapa</label>
                <MapPicker key={`${formEditar.latitud}-${formEditar.longitud}`} latitud={formEditar.latitud} longitud={formEditar.longitud} onLocationSelect={handleMapSelectEditar} />
                {formEditar.latitud && formEditar.longitud && (
                  <div className="form-row" style={{ marginTop: "8px" }}>
                    <div className="form-group"><label>Latitud</label><input className="form-input" value={formEditar.latitud} readOnly /></div>
                    <div className="form-group"><label>Longitud</label><input className="form-input" value={formEditar.longitud} readOnly /></div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tags (separados por coma)</label>
                <input className="form-input" value={formEditar.tagsInput || ""} onChange={e => setFormEditar({...formEditar, tagsInput: e.target.value})} placeholder="Ej: colonial, museo" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea className="form-input form-textarea" value={formEditar.descripcion || ""} onChange={e => setFormEditar({...formEditar, descripcion: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Imagen actual (portada)</label>
                {modalEditar?.imagen && (
                  <img src={modalEditar.imagen} alt="actual" style={{ maxWidth: "100%", maxHeight: "150px", marginBottom: "8px", borderRadius: "8px" }} />
                )}
                <label className="form-label" style={{ marginTop: "8px" }}>Cambiar portada</label>
                <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadEditar} />
                {formEditar.portadaFile && <small>Archivo seleccionado: {formEditar.portadaFile.name}</small>}
              </div>

              <div className="form-group">
                <label className="form-label">Galería actual</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                  {formEditar.galeriaActual?.map(img => (
                    <div key={img.id} style={{ position: "relative", width: "80px" }}>
                      <img src={img.url} alt="galería" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--gray-200)" }} />
                      <label style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", fontSize: "11px" }}>
                        <input type="checkbox" checked={formEditar.imagenesAEliminar?.includes(img.id)} onChange={() => toggleEliminarImagen(img.id)} />
                        Eliminar
                      </label>
                    </div>
                  ))}
                </div>
                <label className="form-label">Agregar nuevas imágenes a la galería</label>
                <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadEditar} />
                {formEditar.imagenesFiles?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    {formEditar.imagenesFiles.map((file, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span>{file.name}</span>
                        <button type="button" className="ab delete" style={{ padding: "2px 8px" }} onClick={() => {
                          setFormEditar(prev => ({
                            ...prev,
                            imagenesFiles: prev.imagenesFiles.filter((_, i) => i !== idx)
                          }));
                        }}>Quitar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarEdicion} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
              <button className="btn-secondary" onClick={cerrarEditar}>Cancelar</button>
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
`;