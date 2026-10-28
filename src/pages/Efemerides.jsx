import "../styles/pages/Efemerides.css";
import { Link } from "react-router-dom";

function Efemerides() {
  return (
    <main className="efemerides-page">
      <header className="efemerides-header">
        <h1 className="efemerides-title">Efemérides de Sonora</h1>
        <nav className="efemerides-breadcrumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span className="efemerides-breadcrumb-separator" aria-hidden="true">
            ›
          </span>
          <span aria-current="page">Efemérides de Sonora</span>
        </nav>
      </header>

      <div className="efemerides-frame">
        <iframe
          src="https://efemerides.redescubramossonora.mx/views/Calendario.html"
          title="Calendario de efemérides de Sonora"
          loading="lazy"
        />
      </div>
    </main>
  );
}

export default Efemerides;
