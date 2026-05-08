import { Link } from "react-router-dom";
import "../styles/pages/NotFound.css";

function NotFound() {
  return (
    <div className="page-inner notfound-page">
      <div className="notfound-card">
        <h2 className="notfound-title">Página no encontrada</h2>
        <p className="notfound-text">La ruta que buscas no existe. Regresa al mapa para continuar explorando.</p>
        <div className="notfound-actions">
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
