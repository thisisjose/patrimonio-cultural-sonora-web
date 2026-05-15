import api from "./apiService";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  // Guardar token y datos en localStorage
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("nombre", response.data.nombre);
    localStorage.setItem("rol", response.data.rol);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("nombre");
  localStorage.removeItem("rol");
};