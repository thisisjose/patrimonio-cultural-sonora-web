import api from "./apiService";

export const getPatrimonios = async (params = {}) => {
  const response = await api.get("/patrimonios", { params });
  return response.data;
};

export const getPatrimonioById = async (id) => {
  const response = await api.get(`/patrimonios/${id}`);
  return response.data;
};

export const getPatrimonioParaReporte = async (id) => {
  const response = await api.get(`/patrimonios/${id}/reporte`);
  return response.data;
};

export const getAllPatrimoniosAdmin = async (page = 1, limit = 10) => {
  const response = await api.get("/admin/patrimonios", {
    params: { page, limit } 
  });
  return response.data;
};

export const cambiarEstadoPatrimonio = async (id, estado) => {
  const response = await api.patch(`/admin/patrimonios/${id}/estado`, { estado });
  return response.data;
};

export const createPatrimonio = async (formData) => {
  const ubicacionesRaw = formData.get("ubicaciones");
  if (ubicacionesRaw && typeof ubicacionesRaw !== "string") {
    formData.set("ubicaciones", JSON.stringify(ubicacionesRaw));
  }
  const linksRaw = formData.get("links");
  if (linksRaw && typeof linksRaw !== "string") {
    formData.set("links", JSON.stringify(linksRaw));
  }
  const response = await api.post("/admin/patrimonios", formData);
  return response.data;
};

export const updatePatrimonio = async (id, data) => {
  const isFormData = data instanceof FormData;
  if (isFormData) {
    const ubicacionesRaw = data.get("ubicaciones");
    if (ubicacionesRaw && typeof ubicacionesRaw !== "string") {
      data.set("ubicaciones", JSON.stringify(ubicacionesRaw));
    }
    const linksRaw = data.get("links");
    if (linksRaw && typeof linksRaw !== "string") {
      data.set("links", JSON.stringify(linksRaw));
    }
    const response = await api.put(`/admin/patrimonios/${id}`, data);
    return response.data;
  } else {
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