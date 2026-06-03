import ubicacionIcon from "../Icons/ubicaciontelefono.png";
import emailIcon from "../Icons/gmailcirculo.png";
import telefonoIcon from "../Icons/telefonocirculo.png";
import "../styles/pages/Contacto.css";

function Contacto() {
  return (
    <section className="contacto-page contacto-container">
      <h1 className="hero-title" style={{ textAlign: 'center' }}>Contáctanos</h1>

      <div className="contacto-grid">
        <div className="contacto-card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <img src={ubicacionIcon} alt="Ubicación" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
            <div>
              <h3>Ubicación</h3>
              <p>C.d Obregón, Sonora<br />Estado de Sonora, México</p>
            </div>
          </div>
        </div>

        <div className="contacto-card">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <img src={emailIcon} alt="Email" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
            <div>
              <h3>Email</h3>
              <p>
                <a href="https://mail.google.com/mail/?view=cm&fs=1&to=olavo.rojas@redescubramossonora.mx" target="_blank" rel="noopener noreferrer">olavo.rojas@redescubramossonora.mx</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="contacto-phone">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <img src={telefonoIcon} alt="Teléfono" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
          <div>
            <h3>Teléfono</h3>
            <p>
              <strong>+52 6441 35 24 29</strong><br />Disponible de lunes a viernes, 9:00 AM - 5:00 PM
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.75rem', padding: '1.5rem', background: 'linear-gradient(180deg, rgba(26,95,62,0.04), rgba(216,155,58,0.03))', borderRadius: '10px' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
          <strong style={{ color: 'var(--green-700)' }}>Aceptamos sugerencias:</strong> Si conoces un sitio cultural que debería estar en el mapa, o tienes información para mejorar algún registro, nos encantaría escucharte. Tu contribución ayuda a que Patrimonio Sonorense sea más completo y preciso.
        </p>
      </div>
    </section>
  );
}

export default Contacto;
