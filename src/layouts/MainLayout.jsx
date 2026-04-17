import { Outlet, Link, NavLink } from "react-router-dom";
import { useState } from "react";
import RSicono from "../Icons/RSicono.png";

function MainLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-container">
      <header className="site-header">
        <div className="container">
          <div className="logo">
            <img src={RSicono} alt="Redescubramos Sonora" style={{ width: "44px", height: "44px", objectFit: "contain", filter: "invert(1)" }} />
            <div>
              <div>Redescubramos</div>
              <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Sonora</div>
            </div>
          </div>

          <nav className="nav-links" role="navigation" aria-label="Main">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              Mapa
            </NavLink>
            <NavLink to="/acerca" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Acerca
            </NavLink>
            <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Contacto
            </NavLink>
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
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end onClick={() => setOpen(false)}>
                  Mapa
                </NavLink>
                <NavLink to="/acerca" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                  Acerca
                </NavLink>
                <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                  Contacto
                </NavLink>
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
        <small>Diseño y desarrollo — patrimonio cultural de Sonora</small>
      </footer>
    </div>
  );
}

export default MainLayout;