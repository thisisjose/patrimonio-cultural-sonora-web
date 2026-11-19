import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../Hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/pages/Login.css'; 

const Login = () => {
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!siteKey) {
      setError('La verificación antispam no está configurada.');
      return undefined;
    }

    let cancelled = false;
    const script = document.querySelector('script[data-turnstile-script]') || document.createElement('script');
    const renderWidget = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile) {
        return;
      }

      try {
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => {
            setTurnstileToken(token);
            setError('');
          },
          'expired-callback': () => {
            setTurnstileToken('');
            setError('La verificación expiró. Complétala nuevamente.');
            if (turnstileWidgetIdRef.current && window.turnstile) {
              window.turnstile.reset(turnstileWidgetIdRef.current);
            }
          },
          'error-callback': () => {
            setTurnstileToken('');
            setError('No se pudo completar la verificación. Inténtalo nuevamente.');
          },
        });
      } catch {
        setError('No se pudo cargar la verificación antispam. Inténtalo nuevamente más tarde.');
      }
    };
    const handleScriptError = () => {
      if (!cancelled) {
        setError('No se pudo cargar la verificación antispam. Inténtalo nuevamente más tarde.');
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener('load', renderWidget);
      script.addEventListener('error', handleScriptError);

      if (!script.src) {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = 'true';
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      script.removeEventListener('load', renderWidget);
      script.removeEventListener('error', handleScriptError);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) {
      return;
    }

    if (!turnstileToken) {
      setError('Completa la verificación antispam antes de iniciar sesión.');
      return;
    }

    isSubmittingRef.current = true;
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password, turnstileToken);

      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Credenciales incorrectas');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
      setTurnstileToken('');
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Patrimonio Sonorense</h2>
          <p>Acceso al panel de administración</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="login-turnstile" ref={turnstileContainerRef} />

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/">← Volver al sitio público</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;