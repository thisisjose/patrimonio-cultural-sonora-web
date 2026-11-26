import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logoPatrimonio from "../Icons/LogoPatrimonioSonorense-removebg-preview.png";

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [desktopAboutOpen, setDesktopAboutOpen] = useState(false);
  const headerRef = useRef(null);
  const aboutMenuRef = useRef(null);
  const desktopAboutButtonRef = useRef(null);
  const mobileAboutButtonRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const location = useLocation();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    function handlePointerDown(event) {
      if (aboutMenuRef.current && !aboutMenuRef.current.contains(event.target)) {
        setDesktopAboutOpen(false);
      }

      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMobileOpen(false);
        setMobileAboutOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") {
        return;
      }

      if (desktopAboutOpen || mobileOpen || mobileAboutOpen) {
        setDesktopAboutOpen(false);
        setMobileOpen(false);
        setMobileAboutOpen(false);

        if (desktopAboutOpen) {
          desktopAboutButtonRef.current?.focus();
        } else if (mobileAboutOpen) {
          mobileAboutButtonRef.current?.focus();
        } else {
          mobileToggleRef.current?.focus();
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopAboutOpen, mobileOpen, mobileAboutOpen]);

  const isAboutActive = ["/acerca", "/acerca-del-proyecto", "/nosotros"].includes(location.pathname);
  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileAboutOpen(false);
  };

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
          <nav className="nav-links" aria-label="Navegación principal">
            <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Catálogo
            </NavLink>
            <NavLink to="/efemerides" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Efemérides
            </NavLink>
            <NavLink to="/festividades" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Festividades
            </NavLink>
            <div
              className={`about-dropdown ${desktopAboutOpen ? "is-open" : ""}`}
              ref={aboutMenuRef}
              onMouseEnter={() => setDesktopAboutOpen(true)}
              onMouseLeave={() => setDesktopAboutOpen(false)}
            >
              <button
                type="button"
                className={`nav-link about-trigger ${isAboutActive ? "active" : ""}`}
                ref={desktopAboutButtonRef}
                aria-haspopup="true"
                aria-expanded={desktopAboutOpen}
                aria-controls="desktop-about-menu"
                onClick={() => setDesktopAboutOpen(true)}
              >
                Acerca
                <span className="about-chevron" aria-hidden="true">▾</span>
              </button>
              <div
                className="about-submenu"
                id="desktop-about-menu"
                aria-hidden={!desktopAboutOpen}
              >
                <NavLink to="/acerca-del-proyecto" onClick={() => setDesktopAboutOpen(false)}>
                  Acerca del proyecto
                </NavLink>
                <NavLink to="/nosotros" onClick={() => setDesktopAboutOpen(false)}>
                  Nosotros
                </NavLink>
              </div>
            </div>
            <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Contacto
            </NavLink>
          </nav>

          {/* Botón Hamburguesa */}
          <button
            className="mobile-toggle"
            ref={mobileToggleRef}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((isOpen) => !isOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Desplegable Móvil */}
        <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} id="mobile-navigation">
          <div className="mobile-menu-inner">
            <nav className="mobile-menu-nav" aria-label="Navegación móvil">
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end onClick={closeMobileMenu}>
                Inicio
              </NavLink>
              <NavLink to="/catalogo" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                Catálogo
              </NavLink>
              <NavLink to="/efemerides" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                Efemérides
              </NavLink>
              <NavLink to="/festividades" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                Festividades
              </NavLink>
              <div className={`mobile-about ${mobileAboutOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className={`nav-link mobile-about-trigger ${isAboutActive ? "active" : ""}`}
                  ref={mobileAboutButtonRef}
                  aria-expanded={mobileAboutOpen}
                  aria-controls="mobile-about-menu"
                  onClick={() => setMobileAboutOpen((isOpen) => !isOpen)}
                >
                  Acerca
                  <span className="about-chevron" aria-hidden="true">▾</span>
                </button>
                <div
                  className="mobile-about-submenu"
                  id="mobile-about-menu"
                  hidden={!mobileAboutOpen}
                >
                  <NavLink to="/acerca-del-proyecto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                    Acerca del proyecto
                  </NavLink>
                  <NavLink to="/nosotros" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
                    Nosotros
                  </NavLink>
                </div>
              </div>
              <NavLink to="/contacto" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenu}>
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

      <footer className="site-footer public-footer">
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
                <li><NavLink to="/efemerides">Efemérides</NavLink></li>
                <li><NavLink to="/festividades">Festividades</NavLink></li>
                <li><NavLink to="/acerca-del-proyecto">Acerca del proyecto</NavLink></li>
                <li><NavLink to="/nosotros">Nosotros</NavLink></li>
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