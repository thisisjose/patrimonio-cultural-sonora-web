import "../styles/pages/Acerca.css";

function Acerca() {
  return (
    <section className="page-inner acerca-page">
      <h1 className="hero-title" style={{ textAlign: 'center' }}>Acerca del proyecto</h1>

      <div className="card" style={{ marginTop: '1rem', textAlign: 'justify' }}>
        
        <p className="lead" style={{ whiteSpace: 'nowrap', color: '#000', textAlign: 'center' }}>Este proyecto se enmarca principalmente en las Convenciones de la UNESCO ratificadas por México:</p>

        <ul style={{ marginTop: '0.75rem', fontSize: '1.05rem', lineHeight: '1.8', color: '#000', paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.6rem' }}>Convención para la Protección del Patrimonio Mundial, Cultural y Natural (UNESCO, 1972) — ratificada por México en 1984, es el instrumento internacional más relevante para la protección de bienes culturales y naturales.</li>
          <li style={{ marginBottom: '0.6rem' }}>Convención para la Salvaguardia del Patrimonio Cultural Inmaterial (UNESCO, 2003) — ratificada por México en 2006, cubre tradiciones orales, fiestas, saberes y prácticas comunitarias.</li>
          <li style={{ marginBottom: '0.6rem' }}>Convención sobre la Protección y Promoción de la Diversidad de las Expresiones Culturales (UNESCO, 2005) — ratificada por México en 2007, protege la diversidad de manifestaciones culturales.</li>
          <li style={{ marginBottom: '0.6rem' }}>Convención sobre la Protección del Patrimonio Cultural Subacuático (UNESCO, 2001) — ratificada por México en 2006, relevante si el sitio documenta bienes en entornos acuáticos.</li>
        </ul>
      </div>

    </section>
  );
}

export default Acerca;
    