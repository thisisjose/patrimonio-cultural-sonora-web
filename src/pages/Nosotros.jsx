import "../styles/pages/Nosotros.css";

function Nosotros() {
  return (
    <section className="page-inner nosotros-page">
      <header className="nosotros-header">
        <h1 className="hero-title">Nosotros</h1>
        <p className="nosotros-intro">
          Conoce a quienes colaboran en el desarrollo y la continuidad de Patrimonio Sonorense.
        </p>
      </header>

      <div className="nosotros-grid">
        <article className="nosotros-card">
          <div className="nosotros-card-heading">
            <div className="nosotros-avatar" role="img" aria-label="Avatar de José Valenzuela">
              JV
            </div>
            <div>
              <h2>José Valenzuela</h2>
              <p className="nosotros-role">Desarrollo de la plataforma</p>
            </div>
          </div>

          <p className="nosotros-description">
            Contribuyo al desarrollo integral de Patrimonio Sonorense: construyo la interfaz con React
            y el backend con Node.js y Express, integro APIs y PostgreSQL, e implemento funcionalidades
            y servicios. También participo en el despliegue y mantenimiento de la plataforma.
          </p>

          <ul className="nosotros-contributions">
            <li><strong>Frontend:</strong> desarrollo de interfaces con React.</li>
            <li><strong>Backend:</strong> desarrollo con Node.js y Express.</li>
            <li><strong>Integraciones:</strong> consumo de APIs e integración de servicios y funcionalidades.</li>
            <li><strong>Datos:</strong> trabajo con PostgreSQL.</li>
            <li><strong>Continuidad:</strong> participación en el despliegue y mantenimiento de la plataforma.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

export default Nosotros;
