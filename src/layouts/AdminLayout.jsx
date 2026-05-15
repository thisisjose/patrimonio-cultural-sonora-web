// src/layouts/AdminLayout.jsx
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import RSicono from "../Icons/RSicono.png";
import "../styles/layouts/AdminLayout.css"; 

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isSupremo = user?.rol === "admin_supremo";

  return (
    <div className="app-container">
      <header className="site-header">
        <div className="container">
          <div className="logo">
            <img
              src={RSicono}
              alt="Redescubramos Sonora"
              style={{ width: "44px", height: "44px", objectFit: "contain", filter: "invert(1)" }}
            />
            <div>
              <div>Redescubramos Sonora</div>
              <div className="mobile-user-welcome">Bienvenido, {user?.nombre} ({user?.rol})</div>
            </div>
          </div>

          <nav className="nav-links" role="navigation" aria-label="Admin">
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} end>
              Home
            </NavLink>
            <NavLink to="/admin/acerca" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Acerca
            </NavLink>
            <NavLink to="/admin/contacto" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Contacto
            </NavLink>
            <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Dashboard
            </NavLink>
            {isSupremo && (
              <NavLink to="/admin/usuarios" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                Usuarios
              </NavLink>
            )}
            <button onClick={handleLogout} className="nav-link logout-btn" style={{ background: "none", border: "none", cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </nav>

          <button
            className="mobile-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>

        {open && (
          <div className="mobile-menu">
            <div className="container mobile-menu-inner">
              <div className="mobile-menu-nav">
                <NavLink to="/admin" end onClick={() => setOpen(false)}>
                  Home
                </NavLink>
                <NavLink to="/admin/acerca" onClick={() => setOpen(false)}>
                  Acerca
                </NavLink>
                <NavLink to="/admin/contacto" onClick={() => setOpen(false)}>
                  Contacto
                </NavLink>
                <NavLink to="/admin/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                {isSupremo && (
                  <NavLink to="/admin/usuarios" onClick={() => setOpen(false)}>
                    Usuarios
                  </NavLink>
                )}
                <button onClick={() => { handleLogout(); setOpen(false); }} className="logout-mobile">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="content">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer>
        <small>Panel de administración — Patrimonio cultural de Sonora</small>
      </footer>
    </div>
  );
};

export default AdminLayout;