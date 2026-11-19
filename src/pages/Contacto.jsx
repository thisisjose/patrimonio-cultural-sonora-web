import { useEffect, useRef, useState } from "react";
import api from "../services/apiService";
import ubicacionIcon from "../Icons/ubicaciontelefono.png";
import emailIcon from "../Icons/gmailcirculo.png";
import "../styles/pages/Contacto.css";

function Contacto() {
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    tipoMensaje: "comentario",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, success: "", error: "" });
  
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      setTurnstileError("La verificación antispam no está configurada.");
      return undefined;
    }

    let cancelled = false;
    const script = document.querySelector('script[data-turnstile-script]') || document.createElement("script");
    const renderWidget = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile) {
        return;
      }

      try {
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          callback: (token) => {
            setTurnstileToken(token);
            setTurnstileError("");
          },
          "expired-callback": () => {
            setTurnstileToken("");
            setTurnstileError("La verificación expiró. Complétala nuevamente.");
            if (turnstileWidgetIdRef.current && window.turnstile) {
              window.turnstile.reset(turnstileWidgetIdRef.current);
            }
          },
          "error-callback": () => {
            setTurnstileToken("");
            setTurnstileError("No se pudo completar la verificación. Inténtalo nuevamente.");
          },
        });
      } catch {
        setTurnstileError("No se pudo cargar la verificación antispam. Inténtalo nuevamente más tarde.");
      }
    };
    const handleScriptError = () => {
      if (!cancelled) {
        setTurnstileError("No se pudo cargar la verificación antispam. Inténtalo nuevamente más tarde.");
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", handleScriptError);

      if (!script.src) {
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      script.removeEventListener("load", renderWidget);
      script.removeEventListener("error", handleScriptError);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.nombre.trim()) {
      validationErrors.nombre = "Por favor ingresa tu nombre completo.";
    } else if (formData.nombre.trim().length > 100) {
      validationErrors.nombre = "El nombre no puede exceder 100 caracteres.";
    }

    if (!formData.correo.trim()) {
      validationErrors.correo = "Por favor ingresa tu correo electrónico.";
    } else if (!validateEmail(formData.correo.trim())) {
      validationErrors.correo = "Ingresa un correo válido, por ejemplo usuario@mail.com.";
    } else if (formData.correo.trim().length > 254) {
      validationErrors.correo = "El correo no puede exceder 254 caracteres.";
    }

    if (formData.telefono.trim() && formData.telefono.trim().length > 20) {
      validationErrors.telefono = "El teléfono no puede exceder 20 caracteres.";
    }

    if (!["comentario", "sugerencia"].includes(formData.tipoMensaje)) {
      validationErrors.tipoMensaje = "Selecciona un tipo de mensaje válido.";
    }

    if (!formData.mensaje.trim()) {
      validationErrors.mensaje = "Por favor escribe tu mensaje.";
    } else if (formData.mensaje.trim().length > 5000) {
      validationErrors.mensaje = "El mensaje no puede exceder 5000 caracteres.";
    }

    return validationErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "telefono") {
      const soloNumeros = value.replace(/[^0-9]/g, ""); 
      
      setFormData((prev) => ({ ...prev, [name]: soloNumeros }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      setStatus({ loading: false, success: "", error: "" });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setStatus({ loading: false, success: "", error: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingRef.current) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!turnstileToken) {
      setStatus({ loading: false, success: "", error: "Completa la verificación antispam antes de enviar el mensaje." });
      setShowFeedback(true);
      return;
    }

    isSubmittingRef.current = true;
    setStatus({ loading: true, success: "", error: "" });
    setShowFeedback(false); 

    try {
      await api.post("/contacto", {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        telefono: formData.telefono.trim(),
        tipoMensaje: formData.tipoMensaje,
        mensaje: formData.mensaje.trim(),
        turnstileToken,
      });

      setStatus({ loading: false, success: "Mensaje enviado correctamente. Gracias por contactarnos.", error: "" });
      setFormData({
        nombre: "",
        correo: "",
        telefono: "",
        tipoMensaje: "comentario",
        mensaje: "",
      });
      setErrors({});

      setTimeout(() => setShowFeedback(true), 50);

      setTimeout(() => {
        setShowFeedback(false); 
        
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, success: "" }));
        }, 450);
      }, 3500);

    } catch (error) {
      const serverMsg = error.response?.data?.msg || "Ocurrió un problema al enviar el mensaje. Intenta nuevamente más tarde.";
      
      setStatus({ loading: false, success: "", error: serverMsg });
      
      setTimeout(() => setShowFeedback(true), 50);

      setTimeout(() => {
        setShowFeedback(false);
        setTimeout(() => {
          setStatus((prev) => ({ ...prev, error: "" }));
        }, 450);
      }, 3500);
    } finally {
      isSubmittingRef.current = false;
      setTurnstileToken("");
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
    }
  };

return (
    <section className="contacto-page contacto-container">
      <h1 className="hero-title" style={{ textAlign: 'center' }}>Contáctanos</h1>

      <div className="contacto-grid">
        <div className="contacto-card contacto-location-card">
          <div className="contacto-card-content">
            <img src={ubicacionIcon} alt="Ubicación" />
            <h3>Ubicación</h3>
            <p>C.d Obregón, Sonora<br />Estado de Sonora, México</p>
          </div>
        </div>

        <div className="contacto-card contacto-email-card">
          <div className="contacto-card-content">
            <img src={emailIcon} alt="Email" />
            <h3>Email</h3>
            <p>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=patrimonio.sonorense@redescubramossonora.mx" target="_blank" rel="noopener noreferrer">patrimonio.sonorense@redescubramossonora.mx</a>
            </p>
          </div>
        </div>
      </div>

      <form className="contacto-form" onSubmit={handleSubmit} noValidate>
        <h2>Envía tus comentarios, sugerencias o propuestas</h2>
        {status.error && (
          <div className={`contacto-form-feedback-wrapper ${showFeedback ? 'show' : ''}`}>
            <div className="contacto-form-feedback contacto-form-error" role="alert">
              {status.error}
            </div>
          </div>
        )}
        
        {status.success && (
          <div className={`contacto-form-feedback-wrapper ${showFeedback ? 'show' : ''}`}>
            <div className="contacto-form-feedback contacto-form-success" role="status">
              {status.success}
            </div>
          </div>
        )}

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
              maxLength={100}
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
              maxLength={254}
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
          {errors.telefono && <span className="contacto-form-field-error">{errors.telefono}</span>}
        </div>

        <div className="contacto-form-group">
          <label htmlFor="tipoMensaje" className="contacto-form-label">Tipo de mensaje *</label>
          <select
            id="tipoMensaje"
            name="tipoMensaje"
            value={formData.tipoMensaje}
            onChange={handleChange}
            className="contacto-form-input"
            disabled={status.loading}
          >
            <option value="comentario">Comentario</option>
            <option value="sugerencia">Sugerencia</option>
          </select>
          {errors.tipoMensaje && <span className="contacto-form-field-error">{errors.tipoMensaje}</span>}
        </div>

        <div className="contacto-form-group">
          <label htmlFor="mensaje" className="contacto-form-label">Mensaje *</label>
          <textarea
            id="mensaje"
            name="mensaje"
            value={formData.mensaje}
            onChange={handleChange}
            className="contacto-form-textarea"
            placeholder="Escribe tu mensaje"
            maxLength={5000}
            disabled={status.loading}
          />
          {errors.mensaje && <span className="contacto-form-field-error">{errors.mensaje}</span>}
        </div>

        <div className="contacto-form-group contacto-turnstile">
          <span className="contacto-form-label">Verificación antispam *</span>
          <div ref={turnstileContainerRef} />
          {turnstileError && <span className="contacto-form-field-error" role="alert">{turnstileError}</span>}
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
