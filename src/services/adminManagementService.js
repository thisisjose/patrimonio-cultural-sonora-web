import api from "./apiService";

export const listarAdmins = async () => {
  const response = await api.get("/supremo/admins");
  return response.data;
};

export const getAdminById = async (id) => {
  const response = await api.get(`/supremo/admins/${id}`);
  return response.data;
};

export const crearAdmin = async (adminData) => {
  const response = await api.post("/supremo/admins", adminData);
  return response.data;
};

export const editarAdmin = async (id, adminData) => {
  const response = await api.put(`/supremo/admins/${id}`, adminData);
  return response.data;
};

export const eliminarAdmin = async (id) => {
  const response = await api.delete(`/supremo/admins/${id}`);
  return response.data;
};