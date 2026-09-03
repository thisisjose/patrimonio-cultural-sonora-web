import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Hooks/useAuth";
import logoPatrimonio from "../Icons/LogoPatrimonioSonorense-removebg-preview.png";
import "../styles/layouts/AdminLayout.css";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isSupremo = user?.rol === "admin_supremo";

  return (
    <div className="app-container">
      <header className="site-header">
        <div className="container">
          <Link to="/admin" className="logo" aria-label="Ir al inicio de administración">
            <div className="logo-mark">
              <img src={logoPatrimonio} alt="Logo Patrimonio Sonorense" />
            </div>
            <div className="logo-text">
              <div className="logo-main">Patrimonio</div>
              <div className="admin-badge">Sonorense · Panel de administración</div>
            </div>
          </Link>

          <nav className="nav-links" role="navigation" aria-label="Admin">
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end
            >
              Inicio
            </NavLink>
            <NavLink
              to="/admin/acerca"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Acerca
            </NavLink>
            <NavLink
              to="/admin/contacto"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Contacto
            </NavLink>
            <NavLink
              to="/admin/catalogo"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Dashboard
            </NavLink>
            {isSupremo && (
              <NavLink
                to="/admin/usuarios"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Usuarios
              </NavLink>
            )}
            <button onClick={handleLogout} className="nav-link logout-btn">
              Cerrar sesión
            </button>
          </nav>

          <button
            className="mobile-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {open && (
          <div className="mobile-menu">
            <div className="container mobile-menu-inner">
              <div className="mobile-menu-nav">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  onClick={() => setOpen(false)}
                >
                  Inicio
                </NavLink>
                <NavLink
                  to="/admin/acerca"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  onClick={() => setOpen(false)}
                >
                  Acerca
                </NavLink>
                <NavLink
                  to="/admin/contacto"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  onClick={() => setOpen(false)}
                >
                  Contacto
                </NavLink>
                <NavLink
                  to="/admin/catalogo"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  onClick={() => setOpen(false)}
                >
                  Catálogo
                </NavLink>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </NavLink>
                {isSupremo && (
                  <NavLink
                    to="/admin/usuarios"
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                    onClick={() => setOpen(false)}
                  >
                    Usuarios
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="logout-mobile"
                >
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

      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <Link to="/admin" className="logo-mark" aria-label="Ir al inicio de administración">
                  <img src={logoPatrimonio} alt="" />
                </Link>
                <div>
                  <div className="footer-logo-main">Patrimonio</div>
                  <div className="footer-logo-sub">Sonorense</div>
                </div>
              </div>
              <p className="footer-desc">
                Panel de administración — Gestión y difusión del patrimonio cultural material del estado de Sonora.
              </p>
            </div>

            <div className="footer-section">
              <h4>Navegación</h4>
              <ul className="footer-links">
                <li><NavLink to="/admin">Inicio</NavLink></li>
                <li><NavLink to="/admin/catalogo">Catálogo</NavLink></li>
                <li><NavLink to="/admin/acerca">Acerca</NavLink></li>
                <li><NavLink to="/admin/contacto">Contacto</NavLink></li>
                <li><NavLink to="/admin/dashboard">Dashboard</NavLink></li>
                {isSupremo && <li><NavLink to="/admin/usuarios">Usuarios</NavLink></li>}
              </ul>
            </div>

            <div className="footer-section">
              <h4>Usuario</h4>
              <p><strong>Bienvenido,</strong><br />{user?.nombre} ({user?.rol})</p>
              <p>
                <strong>Email:</strong><br />
                <a href={`mailto:${user?.email || "admin@redescubramossonora.mx"}`}>
                  {user?.email || "admin@redescubramossonora.mx"}
                </a>
              </p>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <p>&copy; {currentYear} Patrimonio Sonorense. Todos los derechos reservados.</p>
            <p className="footer-credits">Panel administrativo · Patrimonio cultural de Sonora</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;