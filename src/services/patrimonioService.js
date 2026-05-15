import api from "./apiService";

// Públicos
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

// Admin (requieren auth + rol admin)
export const createPatrimonio = async (formData) => {
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