/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // ✅ Estado inicial leído directamente de localStorage
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('nombre');
    if (token && rol) {
      return { token, rol, nombre };
    }
    return null;
  });

  // Ya no necesitas loading porque la lectura es sincrónica.
  // Si quieres mantener loading por compatibilidad, fíjalo en false.
  const loading = false;

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      // loginService ya guarda en localStorage, pero actualizamos el estado
      setUser({ token: data.token, rol: data.rol, nombre: data.nombre });
      return { success: true, rol: data.rol };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    setUser(null);
    navigate('/login');
  };

  const value = { user, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};