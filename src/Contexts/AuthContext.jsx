/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService, logout as logoutService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('token');
    const rol = sessionStorage.getItem('rol');
    const nombre = sessionStorage.getItem('nombre');
    if (token && rol) {
      return { token, rol, nombre };
    }
    return null;
  });

  const loading = false;

  const login = async (email, password) => {
    try {
      const data = await loginService(email, password);
      setUser({ token: data.token, rol: data.rol, nombre: data.nombre });
      return { success: true, rol: data.rol };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    logoutService(); 
    setUser(null);
    navigate('/login');
  };

  const value = { user, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};