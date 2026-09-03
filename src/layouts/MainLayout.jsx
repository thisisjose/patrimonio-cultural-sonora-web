import { Outlet, Link, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logoPatrimonio from "../Icons/LogoPatrimonioSonorense-removebg-preview.png";

function MainLayout() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);

  const currentYear = new Date().getFullYear();

  // Cerrar el menú si se hace clic fuera del header
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="app-container">
      <header className="site-header" ref={headerRef}>
        <div className="container">
          <Link to="/" className="logo">
            <div className="logo-mark">
              <img src={logoPatrimonio} alt="Logo Patrimonio Sonorense" />
            </div>
            <div className="logo-text">
              <div className="logo-main">Patrimonio</div>
              <div className="logo-sub">Sonorense</div>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="nav-links" role="navigation" aria-label="Main">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Catálogo
            </NavLink>
            <NavLink to="/acerca" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Acerca
            </NavLink>
            <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Contacto
            </NavLink>
          </nav>

          {/* Botón Hamburguesa */}
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

        {/* Desplegable Móvil */}
        <div className={`mobile-menu ${open ? 'open' : ''}`}>
          <div className="mobile-menu-inner">
            <nav className="mobile-menu-nav">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end onClick={() => setOpen(false)}>
                Inicio
              </NavLink>
              <NavLink to="/catalogo" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                Catálogo
              </NavLink>
              <NavLink to="/acerca" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                Acerca
              </NavLink>
              <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setOpen(false)}>
                Contacto
              </NavLink>
            </nav>
          </div>
        </div>
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
                <Link to="/" className="logo-mark" aria-label="Ir al inicio">
                  <img src={logoPatrimonio} alt="" />
                </Link>
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
                <li><NavLink to="/catalogo">Catálogo</NavLink></li>
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