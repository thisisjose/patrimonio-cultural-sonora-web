import axios from "axios";

const API_URL = "http://localhost:3000/api";

const MANUAL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiYWRtaW4iLCJpYXQiOjE3NzgxMjY1MDgsImV4cCI6MTc3ODIxMjkwOH0.gNEPMqQiZ5sBYLOa0lRITNTA_YPFR1tfRpSQaSo1LnY";

const api = axios.create({
  baseURL: API_URL,
});

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

// ========== ENDPOINTS PÚBLICOS ==========
export const getPatrimonios = async (params = {}) => {
  const response = await api.get("/patrimonios", { params });
  return response.data;
};

export const getPatrimonioById = async (id) => {
  const response = await api.get(`/patrimonios/${id}`);
  return response.data;
};

export const getMunicipios = async () => {
  const response = await api.get("/municipios");
  return response.data;
};

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

// ========== ENDPOINTS DE ADMINISTRACIÓN ==========
export const createPatrimonio = async (formData) => {
  // Asegurar que "ubicaciones" sea un JSON string si existe
  const ubicacionesRaw = formData.get("ubicaciones");
  if (ubicacionesRaw && typeof ubicacionesRaw !== "string") {
    formData.set("ubicaciones", JSON.stringify(ubicacionesRaw));
  }
  const response = await api.post("/admin/patrimonios", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updatePatrimonio = async (id, data) => {
  const isFormData = data instanceof FormData;
  if (isFormData) {
    const ubicacionesRaw = data.get("ubicaciones");
    if (ubicacionesRaw && typeof ubicacionesRaw !== "string") {
      data.set("ubicaciones", JSON.stringify(ubicacionesRaw));
    }
    const response = await api.put(`/admin/patrimonios/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } else {
    // Objeto JSON plano
    const response = await api.put(`/admin/patrimonios/${id}`, data);
    return response.data;
  }
};

export const deletePatrimonio = async (id) => {
  const response = await api.delete(`/admin/patrimonios/${id}`);
  return response.data;
};

export const exportarPatrimoniosExcel = async () => {
  const response = await api.get("/admin/exportar-excel", { responseType: "blob" });
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