import "../styles/pages/Acerca.css";

function Acerca() {
  return (
    <section className="page-inner acerca-page">
      <h1 className="hero-title" style={{ textAlign: 'center' }}>Acerca del proyecto</h1>

      <div className="card" style={{ marginTop: '1rem' }}>
        <p className="lead">
          <strong>Redescubramos Sonora</strong> es una plataforma digital dedicada a la difusión, preservación y localización del patrimonio cultural material del estado de Sonora. Nuestro objetivo es poner al alcance del público una herramienta sencilla, intuitiva y accesible que permita explorar, conocer y valorar la riqueza histórica y cultural de nuestra región.
        </p>
        <p style={{ marginTop: '0.75rem', color: 'var(--muted)' }}>
          Reunimos datos verificados, fotografías y descripciones breves que ayudan tanto a turistas como a estudiantes y gestores culturales a localizar y entender cada sitio.
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="heading-2">Por qué usar esta plataforma</h3>
        <ul style={{ fontSize: '1.05rem', lineHeight: '1.8', color: '#333', paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.6rem' }}><strong>Fácil e intuitiva:</strong> interfaz limpia que prioriza la información relevante.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>Orientada al viajero:</strong> sugerencias de rutas y datos prácticos para visitas.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>Con enfoque cultural:</strong> contexto histórico y referencias para quienes desean profundizar.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>Abierta y escalable:</strong> pensada para integrar contribuciones y crecer con la comunidad.</li>
        </ul>
      </div>

     
    </section>
  );
}

export default Acerca;
    