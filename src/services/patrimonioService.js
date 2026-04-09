import axios from "axios";

const API_URL = "http://localhost:3000/api";

// 🔥 TOKEN MANUAL (pegas aquí el de Thunder Client)
const MANUAL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiYWRtaW4iLCJpYXQiOjE3NzU3Njc0NzQsImV4cCI6MTc3NTg1Mzg3NH0.j1pUAmGBdGwsGltF-Hs-u63AtfgxKZ27PNog5Mvmlq0";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para enviar el token
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

// Obtener todos los patrimonios
export const getPatrimonios = async () => {
  const response = await api.get("/admin/patrimonios");
  return response.data;
};

// Obtener un patrimonio por ID
export const getPatrimonioById = async (id) => {
  const response = await api.get(`/admin/patrimonios/${id}`);
  return response.data;
};

// Crear patrimonio
export const createPatrimonio = async (formData) => {
  const response = await api.post("/admin/patrimonios", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Actualizar patrimonio
// export const updatePatrimonio = async (id, data) => {
//   const response = await api.put(`/admin/patrimonios/${id}`, data);
//   return response.data;
// };
export const updatePatrimonio = async (id, data, isFormData = false) => {
  const config = {
    method: 'put',
    url: `/admin/patrimonios/${id}`,
    data: data,
  };
  if (isFormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  }
  const response = await api(config);
  return response.data;
};

// Eliminar patrimonio
export const deletePatrimonio = async (id) => {
  const response = await api.delete(`/admin/patrimonios/${id}`);
  return response.data;
};

// Obtener municipios
export const getMunicipios = async () => {
  const response = await api.get("/municipios");
  return response.data;
};

// Obtener tags
export const getTags = async () => {
  const response = await api.get("/tags");
  return response.data;
};