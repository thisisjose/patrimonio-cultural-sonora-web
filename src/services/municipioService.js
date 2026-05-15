import api from "./apiService";

export const getMunicipios = async () => {
  const response = await api.get("/municipios");
  return response.data;
};

export const getMunicipioWithPatrimonios = async (id, params = {}) => {
  const response = await api.get(`/municipios/${id}`, { params });
  return response.data;
};