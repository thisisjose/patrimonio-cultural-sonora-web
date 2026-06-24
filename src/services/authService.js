import api from "./apiService";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  if (response.data.token) {
    sessionStorage.setItem("token", response.data.token);
    sessionStorage.setItem("nombre", response.data.nombre);
    sessionStorage.setItem("rol", response.data.rol);
  }
  return response.data;
};

export const logout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("nombre");
  sessionStorage.removeItem("rol");
};