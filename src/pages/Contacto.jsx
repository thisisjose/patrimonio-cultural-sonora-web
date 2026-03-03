function Contacto() {
  return (
    <section className="contacto-container">
      <h1 className="hero-title" style={{ textAlign: 'center' }}>Contáctanos</h1>

      <div className="contacto-grid">
        <div className="contacto-card">
          <h3>📍 Ubicación</h3>
          <p>C.d Obregón, Sonora<br />Estado de Sonora, México</p>
        </div>

        <div className="contacto-card">
          <h3>📧 Email</h3>
          <p>
            <a href="mailto:info@redescubrarossonora.mx">info@redescubrarossonora.mx</a>
          </p>
        </div>
      </div>

      <div className="contacto-phone">
        <h3>📞 Teléfono</h3>
        <p>
          <strong>+52 (662) 123-4567</strong><br />Disponible de lunes a viernes, 9:00 AM - 5:00 PM
        </p>
      </div>

      <div style={{ marginTop: '1.75rem', padding: '1.5rem', background: 'linear-gradient(180deg, rgba(26,95,62,0.04), rgba(216,155,58,0.03))', borderRadius: '10px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
          <strong style={{ color: 'var(--green-700)' }}>Aceptamos sugerencias:</strong> Si conoces un sitio cultural que debería estar en el mapa, o tienes información para mejorar algún registro, nos encantaría escucharte. Tu contribución ayuda a que Redescubramos Sonora sea más completo y preciso.
        </p>
      </div>
    </section>
  );
}

export default Contacto;
