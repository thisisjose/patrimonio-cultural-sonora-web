import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

import {
  getMetricasPatrimonios,
  getAllPatrimoniosAdmin,
  createPatrimonio,
  updatePatrimonio,
  deletePatrimonio,
  descargarExcelPatrimonios,
  cambiarEstadoPatrimonio,
} from "../../services/patrimonioService";

import { getMunicipios } from "../../services/municipioService";
import { getAllTags, updateTag, deleteTag } from "../../services/tagService";
import { useAuth } from "../../Hooks/useAuth";
import { API_HOST } from "../../services/apiConfig.js";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey } from "../../utils/categoryUtils";

import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../../styles/pages/admin/Dashboard.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ---------- COMPONENTE MAP PICKER ----------
function MapPicker({ ubicaciones = [], onLocationAdd }) {
  const defaultCenter = ubicaciones.length > 0
    ? [ubicaciones[0].latitud, ubicaciones[0].longitud]
    : [29.0729, -110.9559];

  const handleClick = (e) => {
    const { lat, lng } = e.latlng;
    const nombre = window.prompt("Nombre opcional para este punto (ej: Entrada principal)", "");
    if (nombre !== null) {
      onLocationAdd({ lat, lng }, nombre || "");
    }
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "500px", width: "100%", borderRadius: "var(--radius-sm)", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors, &copy; Carto'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={handleClick} />
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

// ---------- COMPONENTE MAPA ESTÁTICO ----------
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

// ---------- SANITIZER HTML ----------
function sanitizeDescriptionHtml(html) {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "P", "DIV", "BR", "UL", "OL", "LI", "FONT"]);

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const fragment = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) fragment.appendChild(cleanedChild);
    });

    const tag = node.tagName.toUpperCase();
    if (allowedTags.has(tag)) {
      const el = document.createElement(tag);
      if (tag === "FONT" && node.hasAttribute("color")) {
        el.setAttribute("color", node.getAttribute("color"));
      }
      el.appendChild(fragment);
      return el;
    }

    return fragment;
  };

  const wrapper = document.createElement("div");
  const source = doc.body.firstChild;
  if (source) {
    source.childNodes.forEach((child) => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) wrapper.appendChild(cleanedChild);
    });
  }

  let cleanedHtml = wrapper.innerHTML;
  cleanedHtml = cleanedHtml.replace(/<(p|div)><\/\1>/g, "");
  return cleanedHtml.trim();
}

// ---------- RICH TEXT EDITOR ----------
function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  const presetColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FFA500', '#FF00FF', '#00FFFF', '#808080', '#800000',
    '#800080', '#008080',
  ];

  const updateValue = (html) => {
    const cleanHtml = sanitizeDescriptionHtml(html);
    if (cleanHtml !== value) {
      onChange(cleanHtml);
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;
    const sanitized = sanitizeDescriptionHtml(value || "");
    if (editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
  }, [value]);

  const applyFormat = (command, commandValue = null) => {
    document.execCommand(command, false, commandValue);
    updateValue(editorRef.current?.innerHTML || "");
    editorRef.current?.focus();
    if (command === 'foreColor' && commandValue) {
      setSelectedColor(commandValue);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleInput = () => {
    updateValue(editorRef.current?.innerHTML || "");
  };

  const togglePicker = (e) => {
    e.preventDefault();
    setIsColorPickerOpen((prev) => !prev);
  };

  const handleColorSelect = (color) => {
    applyFormat('foreColor', color);
    setIsColorPickerOpen(false);
  };

  const handleClearColor = () => {
    applyFormat('foreColor', '#000000');
    setIsColorPickerOpen(false);
  };

  return (
    <div className={`richtext-editor ${focused ? "focused" : ""}`}>
      <div className="richtext-toolbar">
        <button type="button" className="editor-button" title="Negrita" onMouseDown={(e) => { e.preventDefault(); applyFormat("bold"); }}><strong>B</strong></button>
        <button type="button" className="editor-button" title="Cursiva" onMouseDown={(e) => { e.preventDefault(); applyFormat("italic"); }}><em>I</em></button>
        <button type="button" className="editor-button" title="Párrafo" onMouseDown={(e) => { e.preventDefault(); applyFormat("formatBlock", "p"); }}>P</button>
        <button type="button" className="editor-button" title="Lista con viñetas" onMouseDown={(e) => { e.preventDefault(); applyFormat("insertUnorderedList"); }}>•</button>
        <button type="button" className="editor-button" title="Lista numerada" onMouseDown={(e) => { e.preventDefault(); applyFormat("insertOrderedList"); }}>1.</button>

        <div className="color-picker-dropdown" ref={pickerRef}>
          <button
            type="button"
            className="color-picker-button"
            title="Color de texto"
            onMouseDown={togglePicker}
          >
            <span className="color-indicator" style={{ backgroundColor: selectedColor }} />
          </button>
          {isColorPickerOpen && (
            <div className="color-picker-dropdown-content">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ backgroundColor: color }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleColorSelect(color);
                  }}
                  title={color}
                />
              ))}
              <button
                type="button"
                className="clear-color-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleClearColor();
                }}
                title="Quitar color (negro)"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        className="editor-content form-input"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); updateValue(editorRef.current?.innerHTML || ""); }}
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
}

// ---------- INDICADOR DE PASOS ----------
const StepIndicator = ({ current, total }) => {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`step-dot ${i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
};

// ---------- COMPONENTE PRINCIPAL ----------
export default function AdminDashboard() {
  const { user } = useAuth();
  const isSupremo = user?.rol === "admin_supremo";

  const [patrimonios, setPatrimonios] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

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
    ubicaciones: [],
    tags: [],
    newTagInput: "",
    portadaFile: null,
    imagenesFiles: [],
    galeriaActual: [],
    imagenesAEliminar: [],
    estado: "pendiente",
    links: [],
    newLinkTitulo: "",
    newLinkUrl: "",
    manualCoordenadas: "",
    manualNombrePunto: "",
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
    links: [],
    newLinkTitulo: "",
    newLinkUrl: "",
    manualCoordenadas: "",
    manualNombrePunto: "",
  });

  const [modalTagsOpen, setModalTagsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [totales, setTotales] = useState({ total: 0, pendientes: 0, registrados: 0 });

  const [stepNuevo, setStepNuevo] = useState(0);
  const [stepEditar, setStepEditar] = useState(0);
  const [stepVer, setStepVer] = useState(0);

  const municipioNombrePorId = useMemo(() => {
    const map = new Map();
    municipios.forEach((m) => map.set(String(m.id), m.nombre));
    return map;
  }, [municipios]);

  // ---------- CARGA DE DATOS ----------
const cargarDatos = async (page = 1) => {
  try {
    setLoading(true);
    setError("");
    const [respPatrimonios, respMunicipios, respTags, respMetricas] = await Promise.all([
      getAllPatrimoniosAdmin(page, limit),
      getMunicipios(),
      getAllTags(),
      getMetricasPatrimonios(),  
    ]);
    setMunicipios(Array.isArray(respMunicipios) ? respMunicipios : []);
    setTagsList(Array.isArray(respTags) ? respTags : []);
    const data = respPatrimonios || {};
    setPatrimonios(data.patrimonios || []);
    setTotalPages(data.totalPages || 1);
    setCurrentPage(data.currentPage || page);
    setTotales(respMetricas || { total: 0, pendientes: 0, registrados: 0 });
  } catch (err) {
    console.error(err);
    setError("No se pudieron cargar los datos.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    cargarDatos(currentPage);
  }, [currentPage]);

  // ---------- FUNCIONES DE NAVEGACIÓN (pasos) ----------
  const goToNextNuevo = () => { if (stepNuevo < 2) setStepNuevo(stepNuevo + 1); };
  const goToPrevNuevo = () => { if (stepNuevo > 0) setStepNuevo(stepNuevo - 1); };
  const isLastStepNuevo = stepNuevo === 2;

  const goToNextEditar = () => { if (stepEditar < 2) setStepEditar(stepEditar + 1); };
  const goToPrevEditar = () => { if (stepEditar > 0) setStepEditar(stepEditar - 1); };
  const isLastStepEditar = stepEditar === 2;

  const goToNextVer = () => { if (stepVer < 2) setStepVer(stepVer + 1); };
  const goToPrevVer = () => { if (stepVer > 0) setStepVer(stepVer - 1); };
  const isLastStepVer = stepVer === 2;

  // ---------- MANEJADORES DE TAGS ----------
  const handleEditTag = async (tag) => {
    const nuevoNombre = window.prompt("Nuevo nombre del tag:", tag.nombre);
    if (nuevoNombre && nuevoNombre.trim() !== tag.nombre) {
      try {
        await updateTag(tag.id, nuevoNombre.trim());
        await cargarDatos(currentPage);
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
      await cargarDatos(currentPage);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el tag.");
    }
  };

  const handleCambiarEstado = async (patrimonio, nuevoEstado) => {
    const confirmMsg = `¿Cambiar estado de "${patrimonio.nombre}" a ${nuevoEstado === "registrado" ? "Registrado" : "Pendiente"}?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      setSaving(true);
      await cambiarEstadoPatrimonio(patrimonio.id, nuevoEstado);
      await cargarDatos(currentPage);
      if (modalVer) setModalVer(null);
    } catch (err) {
      console.error(err);
      alert("Error al cambiar el estado");
    } finally {
      setSaving(false);
    }
  };

  // ---------- ABRIR / CERRAR MODALES ----------
  const abrirVer = (item) => { setModalVer(item); setStepVer(0); };
  const cerrarVer = () => { setModalVer(null); setStepVer(0); };

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
      estado: item.estado || "pendiente",
      links: item.links || [],
      newLinkTitulo: "",
      newLinkUrl: "",
      manualCoordenadas: "",
      manualNombrePunto: "",
    });
    setModalEditar(item);
    setStepEditar(0);
  };

  const cerrarEditar = () => {
    setModalEditar(null);
    setStepEditar(0);
    setFormEditar({
      id: null,
      nombre: "",
      municipioId: "",
      categoria: "Material",
      descripcion: "",
      ubicaciones: [],
      tags: [],
      newTagInput: "",
      portadaFile: null,
      imagenesFiles: [],
      galeriaActual: [],
      imagenesAEliminar: [],
      estado: "pendiente",
      links: [],
      newLinkTitulo: "",
      newLinkUrl: "",
      manualCoordenadas: "",
      manualNombrePunto: "",
    });
  };

  // ---------- FUNCIONES DE MANIPULACIÓN DE FORMULARIOS ----------
  const addTagToForm = (form, setForm, tagNombre) => {
    const nuevo = tagNombre.trim().toLowerCase();
    if (nuevo && !form.tags.includes(nuevo)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, nuevo], newTagInput: "" }));
    }
  };

  const removeTagFromForm = (form, setForm, tagNombre) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagNombre) }));
  };

  const addLinkToForm = (form, setForm) => {
    const titulo = form.newLinkTitulo?.trim();
    const url = form.newLinkUrl?.trim();
    if (titulo && url) {
      setForm(prev => ({
        ...prev,
        links: [...prev.links, { titulo, url }],
        newLinkTitulo: "",
        newLinkUrl: ""
      }));
    }
  };

  const removeLinkFromForm = (form, setForm, index) => {
    setForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

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

  const agregarUbicacionManual = (form, setForm) => {
    const coordenadas = form.manualCoordenadas.trim();
    if (!coordenadas) {
      alert("Por favor ingresa las coordenadas en formato: latitud, longitud (ej: 12.34234234, -12.3543)");
      return;
    }
    const partes = coordenadas.split(",").map(p => p.trim());
    if (partes.length !== 2) {
      alert("Por favor ingresa las coordenadas en formato: latitud, longitud (ej: 12.34234234, -12.3543)");
      return;
    }
    const latitud = parseFloat(partes[0]);
    const longitud = parseFloat(partes[1]);
    if (isNaN(latitud) || isNaN(longitud)) {
      alert("Por favor ingresa valores numéricos válidos para latitud y longitud");
      return;
    }
    if (latitud < -90 || latitud > 90) {
      alert("La latitud debe estar entre -90 y 90");
      return;
    }
    if (longitud < -180 || longitud > 180) {
      alert("La longitud debe estar entre -180 y 180");
      return;
    }
    const nuevasUbicaciones = [...form.ubicaciones];
    const esPrincipal = nuevasUbicaciones.length === 0;
    nuevasUbicaciones.push({
      nombre_punto: form.manualNombrePunto || "",
      latitud: latitud,
      longitud: longitud,
      es_principal: esPrincipal,
    });
    setForm(prev => ({
      ...prev,
      ubicaciones: nuevasUbicaciones,
      manualCoordenadas: "",
      manualNombrePunto: "",
    }));
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

  // ---------- MANEJADORES DE ARCHIVOS (Nuevo) ----------
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

  // ---------- GUARDAR NUEVO ----------
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
      if (formNuevo.links && formNuevo.links.length) {
        formData.append("links", JSON.stringify(formNuevo.links));
      }
      await createPatrimonio(formData);
      setModalNuevo(false);
      setStepNuevo(0);
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
        links: [],
        newLinkTitulo: "",
        newLinkUrl: "",
        manualCoordenadas: "",
        manualNombrePunto: "",
      });
      await cargarDatos(currentPage);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- MANEJADORES DE ARCHIVOS (Editar) ----------
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

  // ---------- GUARDAR EDICIÓN ----------
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
        if (formEditar.estado) fd.append("estado", formEditar.estado);
        if (formEditar.links && formEditar.links.length) {
          fd.append("links", JSON.stringify(formEditar.links));
        } else {
          fd.append("links", JSON.stringify([]));
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
          links: formEditar.links || [],
        };
        if (formEditar.estado) dataToSend.estado = formEditar.estado;
      }
      await updatePatrimonio(formEditar.id, dataToSend);
      cerrarEditar();
      await cargarDatos(currentPage);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- ELIMINAR ----------
  const onDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este patrimonio?")) return;
    try {
      setSaving(true);
      await deletePatrimonio(id);
      await cargarDatos(currentPage);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el patrimonio.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- DATOS PARA LA TABLA ----------
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
            : `${API_HOST}${item.imagen_url}`
          : "https://placehold.co/600x400?text=Sin+imagen",
        galeria: (item.galeria || []).map(g => ({
          id: g.id,
          url: g.url.startsWith("http") ? g.url : `${API_HOST}${g.url}`
        })),
        municipioId: item.municipioId,
        ubicacion: municipioNombrePorId.get(String(item.municipioId)) || "Sin municipio",
        estado: item.estado,
        fechaRegistro: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—",
        fechaActualizacion: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "—",
        tags: item.tags || [],
        links: item.links || [],
      };
    });
  }, [patrimonios, municipioNombrePorId, API_HOST]);

  // ---------- FILTROS ----------
  const filtrados = patrimoniosUI.filter((p) => {
    const matchesMunicipio = filtro.municipio === "Todos" || String(p.municipioId) === String(filtro.municipio);
    const matchesCategoria = filtro.categoria === "Todas" || normalizeCategoryKey(p.categoria) === normalizeCategoryKey(filtro.categoria);
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

  // const registrados = patrimoniosUI.filter((p) => p.estado === "registrado").length;
  // const pendientes = patrimoniosUI.filter((p) => p.estado === "pendiente").length;

  // ---------- LIGHTBOX ----------
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

  // ---------- PAGINACIÓN ----------
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <>
      {/* ============ MODAL NUEVO ============ */}
      {modalNuevo && (
        <div className="overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nuevo Patrimonio</div>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <div className="modal-body">
              <StepIndicator current={stepNuevo} total={3} />

              {/* PASO 0: IMÁGENES */}
              {stepNuevo === 0 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Portada</h4>
                    {formNuevo.portadaFile && (
                      <div className="edit-portada-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        <img
                          src={URL.createObjectURL(formNuevo.portadaFile)}
                          alt="Vista previa portada"
                          className="edit-portada-preview"
                          onClick={() => {
                            const allImages = [
                              { url: URL.createObjectURL(formNuevo.portadaFile), alt: 'Portada' },
                              ...formNuevo.imagenesFiles.map((f, i) => ({ url: URL.createObjectURL(f), alt: `Galería ${i+1}` }))
                            ];
                            openLightbox(allImages, 0);
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <button
                          className="image-zoom-btn-small"
                          onClick={() => {
                            const allImages = [
                              { url: URL.createObjectURL(formNuevo.portadaFile), alt: 'Portada' },
                              ...formNuevo.imagenesFiles.map((f, i) => ({ url: URL.createObjectURL(f), alt: `Galería ${i+1}` }))
                            ];
                            openLightbox(allImages, 0);
                          }}
                        >⤢</button>
                      </div>
                    )}
                    <h4 className="section-title-small" style={{ marginTop: "12px" }}>Cambiar portada</h4>
                    <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadNuevo} />
                    {formNuevo.portadaFile && <small>Archivo seleccionado: {formNuevo.portadaFile.name}</small>}
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Galería de imágenes</h4>
                    <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadNuevo} />
                    {formNuevo.imagenesFiles.length > 0 && (
                      <div className="gallery-grid">
                        {formNuevo.imagenesFiles.map((file, idx) => {
                          const allImages = [
                            { url: URL.createObjectURL(formNuevo.portadaFile), alt: 'Portada' },
                            ...formNuevo.imagenesFiles.map((f, i) => ({ url: URL.createObjectURL(f), alt: `Galería ${i+1}` }))
                          ];
                          return (
                            <div key={idx} className="gallery-item">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`preview-${idx}`}
                                onClick={() => openLightbox(allImages, idx + 1)}
                                style={{ cursor: 'pointer' }}
                              />
                              <button type="button" className="ab delete small" onClick={() => removeGaleriaFileNuevo(idx)}>Quitar</button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 1: DATOS (sin cambios) */}
              {stepNuevo === 1 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <div className="form-section">
                      <h4 className="section-title-small">Nombre</h4>
                      <input className="form-input" value={formNuevo.nombre} onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })} />
                    </div>
                    <div className="form-section">
                      <h4 className="section-title-small">Descripción</h4>
                      <RichTextEditor
                        value={formNuevo.descripcion}
                        onChange={(value) => setFormNuevo({ ...formNuevo, descripcion: value })}
                      />
                    </div>
                  </div>
                  <div className="section-right">
                    <div className="form-section">
                      <h4 className="section-title-small">Municipio</h4>
                      <select className="form-input" value={formNuevo.municipioId} onChange={e => setFormNuevo({ ...formNuevo, municipioId: e.target.value })}>
                        <option value="">Selecciona</option>
                        {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Categoría</h4>
                      <select className="form-input" value={formNuevo.categoria} onChange={e => setFormNuevo({ ...formNuevo, categoria: e.target.value })}>
                        <option>Material</option>
                        <option>Inmaterial</option>
                        <option>Natural</option>
                      </select>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Tags</h4>
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

                    <div className="form-section">
                      <h4 className="section-title-small">Enlaces relacionados</h4>
                      <div className="links-list">
                        {formNuevo.links.map((link, idx) => (
                          <div key={idx} className="link-item">
                            <span><strong>{link.titulo}</strong>: <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></span>
                            <button type="button" className="ab delete small" onClick={() => removeLinkFromForm(formNuevo, setFormNuevo, idx)}>✕</button>
                          </div>
                        ))}
                        {formNuevo.links.length === 0 && <div className="no-tags">No hay enlaces agregados</div>}
                      </div>
                      <div className="add-link-row">
                        <input type="text" className="form-input" placeholder="Título" value={formNuevo.newLinkTitulo || ""} onChange={e => setFormNuevo(prev => ({ ...prev, newLinkTitulo: e.target.value }))} />
                        <input type="url" className="form-input" placeholder="URL" value={formNuevo.newLinkUrl || ""} onChange={e => setFormNuevo(prev => ({ ...prev, newLinkUrl: e.target.value }))} />
                        <button type="button" className="btn-secondary small" onClick={() => addLinkToForm(formNuevo, setFormNuevo)}>Agregar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: UBICACIONES (sin cambios) */}
              {stepNuevo === 2 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Mapa</h4>
                    <MapPicker ubicaciones={formNuevo.ubicaciones} onLocationAdd={(coords, nombre) => agregarUbicacion(formNuevo, setFormNuevo, coords, nombre)} />
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Ingreso manual y lista</h4>
                    <div className="manual-location-input">
                      <input
                        type="text"
                        placeholder="Coordenadas (lat, lng)"
                        value={formNuevo.manualCoordenadas}
                        onChange={(e) => setFormNuevo(prev => ({ ...prev, manualCoordenadas: e.target.value }))}
                        className="form-input"
                        style={{ marginBottom: "8px" }}
                      />
                      <input
                        type="text"
                        placeholder="Nombre del punto (opcional)"
                        value={formNuevo.manualNombrePunto}
                        onChange={(e) => setFormNuevo(prev => ({ ...prev, manualNombrePunto: e.target.value }))}
                        className="form-input"
                        style={{ marginBottom: "8px" }}
                      />
                      <button type="button" className="btn-secondary" onClick={() => agregarUbicacionManual(formNuevo, setFormNuevo)}>
                        Agregar ubicación
                      </button>
                    </div>
                    {formNuevo.ubicaciones.length > 0 && (
                      <div className="ubicaciones-list">
                        {formNuevo.ubicaciones.map((ubi, idx) => (
                          <div key={idx} className="ubicacion-item">
                            <div className="ubicacion-header">
                              <input type="text" className="form-input ubicacion-nombre" value={ubi.nombre_punto || ""} placeholder="Nombre del punto" onChange={(e) => actualizarNombreUbicacion(formNuevo, setFormNuevo, idx, e.target.value)} />
                              <div className="ubicacion-actions">
                                {!ubi.es_principal && <button type="button" className="ab small" onClick={() => marcarPrincipal(formNuevo, setFormNuevo, idx)}>★ Principal</button>}
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
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={goToPrevNuevo} disabled={stepNuevo === 0}>
                Anterior
              </button>
              {isLastStepNuevo ? (
                <button className="btn-primary" onClick={guardarNuevo} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              ) : (
                <button className="btn-primary" onClick={goToNextNuevo}>
                  Siguiente
                </button>
              )}
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL VER ============ */}
      {modalVer && (
        <div className="overlay" onClick={cerrarVer}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modalVer.nombre}</div>
              <button className="modal-close" onClick={cerrarVer}>✕</button>
            </div>
            <div className="modal-body">
              <StepIndicator current={stepVer} total={3} />

              {/* PASO 0: IMÁGENES */}
              {stepVer === 0 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Portada</h4>
                    {modalVer.imagen && (
                      <div className="edit-portada-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        <img
                          src={modalVer.imagen}
                          alt={modalVer.nombre}
                          className="edit-portada-preview"
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
                          className="image-zoom-btn-small"
                          onClick={() => {
                            const allImages = [
                              { url: modalVer.imagen, alt: modalVer.nombre },
                              ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))
                            ];
                            openLightbox(allImages, 0);
                          }}
                        >⤢</button>
                      </div>
                    )}
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Galería</h4>
                    {modalVer.galeria && modalVer.galeria.length > 0 ? (
                      <div className="gallery-grid">
                        {modalVer.galeria.map((img, idx) => {
                          const allImages = [
                            { url: modalVer.imagen, alt: modalVer.nombre },
                            ...(modalVer.galeria || []).map(g => ({ url: g.url, alt: modalVer.nombre }))
                          ];
                          return (
                            <div key={img.id} className="gallery-item">
                              <img
                                src={img.url}
                                alt={`galería ${idx}`}
                                onClick={() => openLightbox(allImages, idx + 1)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-tags">Sin imágenes en galería</div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 1: DATOS (sin cambios) */}
              {stepVer === 1 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <div className="form-section">
                      <h4 className="section-title-small">Nombre</h4>
                      <div className="form-value">{modalVer.nombre}</div>
                    </div>
                    {modalVer.descripcion && (
                      <div className="form-section">
                        <h4 className="section-title-small">Descripción</h4>
                        <div className="form-value description-text" dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(modalVer.descripcion) }} />
                      </div>
                    )}
                  </div>
                  <div className="section-right">
                    <div className="form-section">
                      <h4 className="section-title-small">Categoría</h4>
                      <span className={`bcat ${getCategoryClass(modalVer.categoria)}`}>{getCategoryLabel(modalVer.categoria)}</span>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Estado</h4>
                      <div className="view-badges">
                        <span className={`bst ${modalVer.estado}`}>
                          <span className={`dot ${modalVer.estado === "registrado" ? "green" : "amber"}`} />
                          {modalVer.estado === "registrado" ? "Registrado" : "Pendiente"}
                        </span>
                        {isSupremo && (
                          <button
                            className="ab editar"
                            onClick={() => handleCambiarEstado(modalVer, modalVer.estado === "pendiente" ? "registrado" : "pendiente")}
                          >
                            Cambiar estado
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Municipio</h4>
                      <div className="form-value">
                        {municipios.find(m => m.id === modalVer.municipioId)?.nombre || "No especificado"}
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Tags</h4>
                      <div className="tags-list">
                        {modalVer.tags && modalVer.tags.length > 0 ? (
                          modalVer.tags.map((tag, idx) => (
                            <span key={idx} className="tag-badge">
                              {typeof tag === 'object' ? tag.nombre : tag}
                            </span>
                          ))
                        ) : (
                          <span className="tag-badge">Sin tags</span>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Enlaces relacionados</h4>
                      {modalVer.links && modalVer.links.length > 0 ? (
                        <div className="links-list-view">
                          {modalVer.links.map((link, idx) => (
                            <div key={idx} className="link-item">
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.titulo || link.url}
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-tags">Sin enlaces registrados</div>
                      )}
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Fechas</h4>
                      <div className="view-dates">
                        <div><strong>Registro:</strong> {modalVer.fechaRegistro}</div>
                        <div><strong>Actualización:</strong> {modalVer.fechaActualizacion}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: UBICACIONES (sin cambios) */}
              {stepVer === 2 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Mapa</h4>
                    {modalVer.ubicaciones && modalVer.ubicaciones.length > 0 ? (
                      <StaticMap ubicaciones={modalVer.ubicaciones} />
                    ) : (
                      <div className="no-tags">Sin ubicaciones registradas</div>
                    )}
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Lista de ubicaciones</h4>
                    {modalVer.ubicaciones && modalVer.ubicaciones.length > 0 ? (
                      <div className="ubicaciones-list">
                        {modalVer.ubicaciones.map((ubi, idx) => (
                          <div key={idx} className="ubicacion-item">
                            <div className="ubicacion-header">
                              <strong>{ubi.nombre_punto || `Punto ${idx + 1}`}</strong>
                              {ubi.es_principal && <span className="principal-badge">Principal</span>}
                            </div>
                            <div className="ubicacion-coords">
                              <span>Lat: {ubi.latitud}</span>
                              <span>Lng: {ubi.longitud}</span>
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${ubi.latitud},${ubi.longitud}`}
                              target="_blank"
                              rel="noreferrer"
                              className="maps-link"
                            >
                              Ver en mapa
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-tags">Sin ubicaciones registradas</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={goToPrevVer} disabled={stepVer === 0}>
                Anterior
              </button>
              {isLastStepVer ? (
                <>
                  <button className="btn-primary" onClick={() => { cerrarVer(); abrirEditar(modalVer); }}>Editar</button>
                  <button className="btn-secondary" onClick={cerrarVer}>Cerrar</button>
                </>
              ) : (
                <button className="btn-primary" onClick={goToNextVer}>
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL EDITAR ============ */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Editar Patrimonio</div>
              <button className="modal-close" onClick={cerrarEditar}>✕</button>
            </div>
            <div className="modal-body">
              <StepIndicator current={stepEditar} total={3} />

              {/* PASO 0: IMÁGENES (sin cambios) */}
              {stepEditar === 0 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Portada actual</h4>
                    {modalEditar?.imagen && (
                      <div className="edit-portada-wrapper" style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                        <img src={modalEditar.imagen} alt="portada actual" className="edit-portada-preview" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, 0); }} style={{ cursor: 'pointer' }} />
                        <button className="image-zoom-btn-small" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, 0); }}>⤢</button>
                      </div>
                    )}
                    <h4 className="section-title-small" style={{ marginTop: "12px" }}>Cambiar portada</h4>
                    <input type="file" accept="image/*" className="form-input" onChange={handlePortadaUploadEditar} />
                    {formEditar.portadaFile && <small>Archivo seleccionado: {formEditar.portadaFile.name}</small>}
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Galería actual</h4>
                    <div className="gallery-grid">
                      {formEditar.galeriaActual?.map((img, idx) => (
                        <div key={img.id} className="gallery-item">
                          <img src={img.url} alt="galería" onClick={() => { const currentImages = [{ url: modalEditar.imagen, alt: 'Portada' }, ...(formEditar.galeriaActual || []).map(g => ({ url: g.url, alt: 'Galería' }))]; openLightbox(currentImages, idx + 1); }} style={{ cursor: 'pointer' }} />
                          <label className="gallery-check">
                            <input type="checkbox" checked={formEditar.imagenesAEliminar?.includes(img.id)} onChange={() => toggleEliminarImagen(img.id)} /> Eliminar
                          </label>
                        </div>
                      ))}
                    </div>
                    <h4 className="section-title-small" style={{ marginTop: "12px" }}>Agregar nuevas imágenes</h4>
                    <input type="file" accept="image/*" multiple className="form-input" onChange={handleGaleriaUploadEditar} />
                    {formEditar.imagenesFiles?.length > 0 && (
                      <div className="new-images-list">
                        {formEditar.imagenesFiles.map((file, idx) => (
                          <div key={idx} className="new-image-item">
                            <span>{file.name}</span>
                            <button type="button" className="ab delete small" onClick={() => { setFormEditar(prev => ({ ...prev, imagenesFiles: prev.imagenesFiles.filter((_, i) => i !== idx) })); }}>Quitar</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 1 y 2 de Editar (sin cambios) */}
              {stepEditar === 1 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <div className="form-section">
                      <h4 className="section-title-small">Nombre</h4>
                      <input className="form-input" value={formEditar.nombre || ""} onChange={e => setFormEditar({...formEditar, nombre: e.target.value})} />
                    </div>
                    <div className="form-section">
                      <h4 className="section-title-small">Descripción</h4>
                      <RichTextEditor
                        value={formEditar.descripcion || ""}
                        onChange={(value) => setFormEditar({ ...formEditar, descripcion: value })}
                      />
                    </div>
                  </div>
                  <div className="section-right">
                    <div className="form-section">
                      <h4 className="section-title-small">Municipio</h4>
                      <select className="form-input" value={formEditar.municipioId || ""} onChange={e => setFormEditar({...formEditar, municipioId: e.target.value})}>
                        <option value="">Selecciona</option>
                        {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                      </select>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Categoría</h4>
                      <select className="form-input" value={formEditar.categoria || "Material"} onChange={e => setFormEditar({...formEditar, categoria: e.target.value})}>
                        <option>Material</option>
                        <option>Inmaterial</option>
                        <option>Natural</option>
                      </select>
                    </div>

                    <div className="form-section">
                      <h4 className="section-title-small">Tags</h4>
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

                    {isSupremo && (
                      <div className="form-section">
                        <h4 className="section-title-small">Estado</h4>
                        <select className="form-input" value={formEditar.estado || "pendiente"} onChange={e => setFormEditar({...formEditar, estado: e.target.value})}>
                          <option value="pendiente">Pendiente</option>
                          <option value="registrado">Registrado</option>
                        </select>
                      </div>
                    )}

                    <div className="form-section">
                      <h4 className="section-title-small">Enlaces relacionados</h4>
                      <div className="links-list">
                        {formEditar.links.map((link, idx) => (
                          <div key={idx} className="link-item">
                            <span><strong>{link.titulo}</strong>: <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></span>
                            <button type="button" className="ab delete small" onClick={() => removeLinkFromForm(formEditar, setFormEditar, idx)}>✕</button>
                          </div>
                        ))}
                        {formEditar.links.length === 0 && <div className="no-links">No hay enlaces agregados</div>}
                      </div>
                      <div className="add-link-row">
                        <input type="text" className="form-input" placeholder="Título" value={formEditar.newLinkTitulo || ""} onChange={e => setFormEditar(prev => ({ ...prev, newLinkTitulo: e.target.value }))} />
                        <input type="url" className="form-input" placeholder="URL" value={formEditar.newLinkUrl || ""} onChange={e => setFormEditar(prev => ({ ...prev, newLinkUrl: e.target.value }))} />
                        <button type="button" className="btn-secondary small" onClick={() => addLinkToForm(formEditar, setFormEditar)}>Agregar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stepEditar === 2 && (
                <div className="section-two-col">
                  <div className="section-left">
                    <h4 className="section-title-small">Mapa</h4>
                    <MapPicker ubicaciones={formEditar.ubicaciones} onLocationAdd={(coords, nombre) => agregarUbicacion(formEditar, setFormEditar, coords, nombre)} />
                  </div>
                  <div className="section-right">
                    <h4 className="section-title-small">Ingreso manual y lista</h4>
                    <div className="manual-location-input">
                      <input
                        type="text"
                        placeholder="Coordenadas (lat, lng)"
                        value={formEditar.manualCoordenadas}
                        onChange={(e) => setFormEditar(prev => ({ ...prev, manualCoordenadas: e.target.value }))}
                        className="form-input"
                        style={{ marginBottom: "8px" }}
                      />
                      <input
                        type="text"
                        placeholder="Nombre del punto"
                        value={formEditar.manualNombrePunto}
                        onChange={(e) => setFormEditar(prev => ({ ...prev, manualNombrePunto: e.target.value }))}
                        className="form-input"
                        style={{ marginBottom: "8px" }}
                      />
                      <button type="button" className="btn-secondary" onClick={() => agregarUbicacionManual(formEditar, setFormEditar)}>
                        Agregar ubicación
                      </button>
                    </div>
                    {formEditar.ubicaciones.length > 0 && (
                      <div className="ubicaciones-list">
                        {formEditar.ubicaciones.map((ubi, idx) => (
                          <div key={idx} className="ubicacion-item">
                            <div className="ubicacion-header">
                              <input type="text" className="form-input ubicacion-nombre" value={ubi.nombre_punto || ""} placeholder="Nombre del punto" onChange={(e) => actualizarNombreUbicacion(formEditar, setFormEditar, idx, e.target.value)} />
                              <div className="ubicacion-actions">
                                {!ubi.es_principal && <button type="button" className="ab small" onClick={() => marcarPrincipal(formEditar, setFormEditar, idx)}>★ Principal</button>}
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
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={goToPrevEditar} disabled={stepEditar === 0}>
                Anterior
              </button>
              {isLastStepEditar ? (
                <button className="btn-primary" onClick={guardarEdicion} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              ) : (
                <button className="btn-primary" onClick={goToNextEditar}>
                  Siguiente
                </button>
              )}
              <button className="btn-secondary" onClick={cerrarEditar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL GESTIÓN TAGS ============ */}
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

      {/* ============ LIGHTBOX ============ */}
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

      {/* ============ PÁGINA PRINCIPAL ============ */}
      <div className="page">
        <div className="page-header">
          <div className="page-title">Patrimonios</div>
          <div className="page-crumb">Administración · Patrimonios Culturales</div>
        </div>
        <button className="btn-primary" onClick={() => { setModalNuevo(true); setStepNuevo(0); }}>+ Nuevo Patrimonio</button>
        {error && <div className="error-banner">{error}</div>}

        <div className="metrics">
  <div className="m-card">
    <div>
      <div className="m-label">Pendientes</div>
      <div className="m-value">{totales.pendientes}</div>
      <div className="m-sub">Requieren revisión</div>
    </div>
  </div>
  <div className="m-card">
    <div>
      <div className="m-label">Registrados</div>
      <div className="m-value">{totales.registrados}</div>
      <div className="m-sub">Catalogados y activos</div>
    </div>
  </div>
  <div className="m-card">
    <div>
      <div className="m-label">Total</div>
      <div className="m-value">{totales.total}</div>
      <div className="m-sub">En el inventario</div>
    </div>
  </div>
</div>

        <div className="card">
          <div className="tbar">
            <div className="fpill"><select className="fsel" value={filtro.municipio} onChange={e => setFiltro({...filtro, municipio: e.target.value})}><option value="Todos">Todos</option>{municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
            <div className="fpill"><select className="fsel" value={filtro.categoria} onChange={e => setFiltro({...filtro, categoria: e.target.value})}><option value="Todas">Todas</option><option>Material</option><option>Inmaterial</option><option>Natural</option></select></div>
            <div className="fpill"><select className="fsel" value={filtro.estado} onChange={e => setFiltro({...filtro, estado: e.target.value})}><option value="Todos">Todos</option><option value="pendiente">Pendiente</option><option value="registrado">Registrado</option></select></div>
            <div className="fpill search-field"><input type="text" className="fsel" placeholder="Buscar por nombre, descripción, municipio o tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '5px 8px' }} /></div>
            <div className="spacer" />
            <button className="fpill" onClick={() => setModalTagsOpen(true)} style={{ background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: '20px', padding: '5px 10px', cursor: 'pointer' }}>🏷️ Gestionar Tags</button>
            <button className="fpill" onClick={descargarExcelPatrimonios} style={{ background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', borderRadius: '20px', padding: '5px 10px', cursor: 'pointer' }} title="Exportar a Excel"><img src="/xls.png" alt="Exportar Excel" style={{ width: '20px', height: '20px' }} /></button>
            <span className="cnt">{filtrados.length} registros</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>ID</th><th>Imagen</th><th>Patrimonio</th><th>Categoría</th><th>Estado</th><th>Registro</th><th>Actualización</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8"><div className="empty">Cargando...</div></td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty">Sin resultados</div></td></tr>
                ) : (
                  filtrados.map(item => (
                    <tr key={item.id}>
                      <td><span className="tid">#{item.id}</span></td>
                      <td><img src={item.imagen} alt={item.nombre} className="thumb" /></td>
                      <td><div className="ttitle">{item.nombre}</div><div className="tloc">{item.ubicacion}, Sonora</div></td>
                      <td><span className={`bcat ${getCategoryClass(item.categoria)}`}>{getCategoryLabel(item.categoria)}</span></td>
                      <td><span className={`bst ${item.estado}`}><span className={`dot ${item.estado === "registrado" ? "green" : "amber"}`} />{item.estado === "registrado" ? "Registrado" : "Pendiente"}</span></td>
                      <td><span className="tdate">{item.fechaRegistro}</span></td>
                      <td><span className="tdate">{item.fechaActualizacion}</span></td>
                      <td><div className="action-buttons">
                        <button className="ab view" onClick={() => abrirVer(item)}>Ver</button>
                        <button className="ab edit" onClick={() => abrirEditar(item)}>Editar</button>
                        <button className="ab delete" onClick={() => onDelete(item.id)}>Eliminar</button>
                      </div></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px', padding: '8px 0' }}>
            <div>
              <button
                className="btn-secondary"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                style={{ marginRight: '8px' }}
              >
                ← Anterior
              </button>
              <span style={{ margin: '0 12px' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="btn-secondary"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                style={{ marginLeft: '8px' }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}