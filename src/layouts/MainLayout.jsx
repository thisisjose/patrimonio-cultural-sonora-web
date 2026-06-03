import { Outlet, Link, NavLink } from "react-router-dom";
import { useState } from "react";

function MainLayout() {
  const [open, setOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <div className="app-container">
      <header className="site-header">
        <div className="container">
          <div className="logo">
            <div className="logo-mark">
              <span>PS</span>
            </div>
            <div className="logo-text">
              <div className="logo-main">Patrimonio</div>
              <div className="logo-sub">Sonorense</div>
            </div>
          </div>

          <nav className="nav-links" role="navigation" aria-label="Main">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              Inicio
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
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {open && (
          <div className="mobile-menu">
            <div className="container mobile-menu-inner">
              <div className="mobile-menu-nav">
                <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end onClick={() => setOpen(false)}>
                  Inicio
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

      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="logo-mark">
                  <span>PS</span>
                </div>
                <div>
                  <div className="footer-logo-main">Patrimonio</div>
                  <div className="footer-logo-sub">Sonorense</div>
                </div>
              </div>
              <p className="footer-desc">
                Plataforma digital dedicada a la difusión, preservación y localización del patrimonio cultural material del estado de Sonora.
              </p>
            </div>

            <div className="footer-section">
              <h4>Navegación</h4>
              <ul className="footer-links">
                <li><NavLink to="/">Inicio</NavLink></li>
                <li><NavLink to="/acerca">Acerca</NavLink></li>
                <li><NavLink to="/contacto">Contacto</NavLink></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Contacto</h4>
              <p>
                <strong>Ubicación:</strong><br />
                C. Obregón, Sonora, México
              </p>
              <p>
                <strong>Email:</strong><br />
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=olavo.rojas@redescubramossonora.mx" target="_blank" rel="noopener noreferrer">olavo.rojas@redescubramossonora.mx</a>
              </p>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <p>&copy; {currentYear} Patrimonio Sonorense. Todos los derechos reservados.</p>
            <p className="footer-credits">Diseñado para preservar y difundir el patrimonio cultural de Sonora</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;