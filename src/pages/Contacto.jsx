function Contacto() {
  return (
    <section className="contacto-container">
      <h1 className="contacto-title">
        Contáctanos
      </h1>

      <div className="contacto-grid">
        <div className="contacto-card">
          <h3>📍 Ubicación</h3>
          <p>
            C.d Obregón, Sonora<br />
            Estado de Sonora, México
          </p>
        </div>

        <div className="contacto-card">
          <h3>📧 Email</h3>
          <p>
            <a href="mailto:info@redescubrarossonora.mx">
              info@redescubrarossonora.mx
            </a>
          </p>
        </div>
      </div>

      <div className="contacto-phone">
        <h3>📞 Teléfono</h3>
        <p>
          <strong>+52 (662) 123-4567</strong><br />
          Disponible de lunes a viernes, 9:00 AM - 5:00 PM
        </p>
      </div>

      <div className="contacto-cta">
        <h3>¿Tienes una consulta?</h3>
        <p>
          Nos encantaría escuchar tus comentarios, sugerencias o preguntas sobre el patrimonio cultural de Sonora.
        </p>
        <button className="contacto-button">
          Enviar mensaje
        </button>
      </div>
    </section>
  );
}

export default Contacto;
