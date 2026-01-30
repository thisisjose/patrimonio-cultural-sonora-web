import { Outlet, Link } from "react-router-dom";

function MainLayout() {
  return (
    <div className="app-container">
      <header>
        <h2>Redescubramos Sonora</h2>
        <nav>
          <Link to="/">Mapa</Link>
          <Link to="/acerca">Acerca del proyecto</Link>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer>
        <small>
          Diseño y desarrollo de un sitio web de patrimonio cultural de Sonora
        </small>
      </footer>
    </div>
  );
}

export default MainLayout;
