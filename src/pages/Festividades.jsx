import { Link } from 'react-router-dom';
import FestividadesCalendario from '../components/FestividadesCalendario';
import '../styles/pages/Festividades.css';

function Festividades() {
  return (
    <main className="festividades-page">
      <header className="festividades-header">
        <h1 className="festividades-title">Festividades de Sonora</h1>
        <nav className="festividades-breadcrumbs" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Festividades de Sonora</span>
        </nav>
      </header>
      <FestividadesCalendario idPrefix="festividades-page" />
    </main>
  );
}

export default Festividades;
