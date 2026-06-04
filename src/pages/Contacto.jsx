import { useState } from "react";
import api from "../services/apiService";
import ubicacionIcon from "../Icons/ubicaciontelefono.png";
import emailIcon from "../Icons/gmailcirculo.png";
import telefonoIcon from "../Icons/telefonocirculo.png";
import "../styles/pages/Contacto.css";

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, success: "", error: "" });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.nombre.trim()) {
      validationErrors.nombre = "Por favor ingresa tu nombre completo.";
    }

    if (!formData.correo.trim()) {
      validationErrors.correo = "Por favor ingresa tu correo electrónico.";
    } else if (!validateEmail(formData.correo.trim())) {
      validationErrors.correo = "Ingresa un correo válido, por ejemplo usuario@mail.com.";
    }

    if (!formData.mensaje.trim()) {
      validationErrors.mensaje = "Por favor escribe tu comentario o sugerencia.";
    }

    return validationErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatus({ loading: false, success: "", error: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus({ loading: true, success: "", error: "" });

    try {
      await api.post("/contacto", {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        mensaje: formData.mensaje.trim(),
      });
      setStatus({ loading: false, success: "Mensaje enviado correctamente. Gracias por tu sugerencia.", error: "" });
      setFormData({ nombre: "", correo: "", telefono: "", mensaje: "" });
      setErrors({});
    } catch (error) {
      setStatus({ loading: false, success: "", error: "Ocurrió un problema al enviar el mensaje. Intenta nuevamente más tarde." });
    }
  };

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

      <form className="contacto-form" onSubmit={handleSubmit} noValidate>
        <h2>Envía tu sugerencia</h2>

        {status.error && <div className="contacto-form-feedback contacto-form-error" role="alert">{status.error}</div>}
        {status.success && <div className="contacto-form-feedback contacto-form-success" role="status">{status.success}</div>}

        <div className="contacto-form-row">
          <div className="contacto-form-group">
            <label htmlFor="nombre" className="contacto-form-label">Nombre completo *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              className="contacto-form-input"
              placeholder="Tu nombre completo"
              disabled={status.loading}
            />
            {errors.nombre && <span className="contacto-form-field-error">{errors.nombre}</span>}
          </div>

          <div className="contacto-form-group">
            <label htmlFor="correo" className="contacto-form-label">Correo electrónico *</label>
            <input
              id="correo"
              name="correo"
              type="email"
              value={formData.correo}
              onChange={handleChange}
              className="contacto-form-input"
              placeholder="correo@ejemplo.com"
              disabled={status.loading}
            />
            {errors.correo && <span className="contacto-form-field-error">{errors.correo}</span>}
          </div>
        </div>

        <div className="contacto-form-group">
          <label htmlFor="telefono" className="contacto-form-label">Teléfono (opcional)</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            className="contacto-form-input"
            placeholder="(Opcional)"
            disabled={status.loading}
          />
        </div>

        <div className="contacto-form-group">
          <label htmlFor="mensaje" className="contacto-form-label">Comentario o sugerencia *</label>
          <textarea
            id="mensaje"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            className="contacto-form-textarea"
            placeholder="Escribe tu comentario o sugerencia"
            disabled={status.loading}
          />
          {errors.mensaje && <span className="contacto-form-field-error">{errors.mensaje}</span>}
        </div>

        <div className="contacto-form-actions">
          <button type="submit" className="btn-primary" disabled={status.loading}>
            {status.loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Contacto;
