import api from "./apiService";

// Público
export const getAllTags = async () => {
  const response = await api.get("/tags");
  return response.data;
};

// Admin (requieren auth + rol admin)
export const updateTag = async (id, nombre) => {
  const response = await api.put(`/admin/tags/${id}`, { nombre });
  return response.data;
};

export const deleteTag = async (id) => {
  const response = await api.delete(`/admin/tags/${id}`);
  return response.data;
};