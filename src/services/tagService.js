import api from "./apiService";

export const getAllTags = async () => {
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