import axios from "axios";

const API_URL = "http://localhost:3000/api";

// ⚠️ Token manual solo para pruebas rápidas. Comenta esta línea y usa localStorage en producción.
const MANUAL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Nywibm9tYnJlIjoiam9zZWNpbjYiLCJpYXQiOjE3NzgxODc4NzIsImV4cCI6MTc3ODI3NDI3Mn0.bG4cAjw_DmJoiLwsAPLRwTg7995Y2txhK0NrvYWS9Z8";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para enviar el token (solo si existe)
api.interceptors.request.use(
  (config) => {
    const token = MANUAL_TOKEN || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== ENDPOINTS PÚBLICOS (sin necesidad de token) ==========

/**
 * Obtener todos los patrimonios con filtros opcionales
 * @param {Object} params - { categoria, tag }
 */
export const getPatrimonios = async (params = {}) => {
  const response = await api.get("/patrimonios", { params });
  return response.data;
};

/**
 * Obtener un patrimonio por ID
 */
export const getPatrimonioById = async (id) => {
  const response = await api.get(`/patrimonios/${id}`);
  return response.data;
};

/**
 * Obtener todos los municipios
 */
export const getMunicipios = async () => {
  const response = await api.get("/municipios");
  return response.data;
};

/**
 * Obtener todos los tags (con contador de usos)
 */
export const getTags = async () => {
  const response = await api.get("/tags");
  return response.data;
};

export const updateTag = async (id, nombre) => {
  const response = await api.put(`/admin/tags/${id}`, { nombre });
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await api.delete(`/admin/tags/${id}`);
  return response.data;
};

// ========== ENDPOINTS DE ADMINISTRACIÓN (requieren token en POST, DELETE) ==========

/**
 * Crear un nuevo patrimonio (solo admin)
 * @param {FormData} formData - Debe contener: nombre, descripcion, ubicacion, latitud, longitud, categoria, municipioId, tags (string con comas o array), portada (file), imagenes (files[])
 */
export const createPatrimonio = async (formData) => {
  const response = await api.post("/admin/patrimonios", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Actualizar un patrimonio
 * @param {number} id
 * @param {FormData|Object} data - Si incluye archivos usar FormData, si no un objeto plano.
 */
export const updatePatrimonio = async (id, data) => {
  const isFormData = data instanceof FormData;
  const config = {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
  };
  const response = await api.put(`/admin/patrimonios/${id}`, data, config);
  return response.data;
};

/**
 * Eliminar un patrimonio (solo admin)
 */
export const deletePatrimonio = async (id) => {
  const response = await api.delete(`/admin/patrimonios/${id}`);
  return response.data;
};

/**
 * Exportar patrimonios a Excel
 */
export const exportarPatrimoniosExcel = async () => {
  const response = await api.get("/admin/exportar-excel", {
    responseType: "blob", // Importante para manejar el archivo binario
  });
  return response.data;
};

export const descargarExcelPatrimonios = async () => {
  try {
    const blob = await exportarPatrimoniosExcel();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "patrimonios_sonora.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar el Excel:", error);
    throw error;
  }
};