import { Outlet, Link } from "react-router-dom";
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
            <Link to="/">Mapa</Link>
            <Link to="/acerca">Acerca</Link>
            <Link to="/contacto">Contacto</Link>
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
          <div style={{ background: "rgba(0,0,0,0.04)" }}>
            <div className="container" style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link to="/" onClick={() => setOpen(false)}>Mapa</Link>
                <Link to="/acerca" onClick={() => setOpen(false)}>Acerca</Link>
                <Link to="/contacto" onClick={() => setOpen(false)}>Contacto</Link>
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
