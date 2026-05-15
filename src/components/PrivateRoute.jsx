// src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Hooks/useAuth';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Si se requiere un rol específico
  if (requiredRole) {
    let hasAccess = false;
    if (requiredRole === 'admin' && user.rol === 'admin_supremo') {
      hasAccess = true; // supremo puede acceder a rutas de admin
    } else if (user.rol === requiredRole) {
      hasAccess = true;
    }

    if (!hasAccess) {
      // Redirigir al dashboard del admin (o a una página de "no autorizado")
      // Pasamos un mensaje opcional en el state
      return <Navigate to="/admin" replace state={{ error: "No tienes permisos para acceder a esta sección" }} />;
    }
  }

  return children;
};

export default PrivateRoute;