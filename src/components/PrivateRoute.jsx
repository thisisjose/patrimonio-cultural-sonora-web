import { Navigate } from 'react-router-dom';
import { useAuth } from '../Hooks/useAuth';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    let hasAccess = false;
    if (requiredRole === 'admin' && user.rol === 'admin_supremo') {
      hasAccess = true;
    } else if (user.rol === requiredRole) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return <Navigate to="/admin" replace state={{ error: "No tienes permisos para acceder a esta sección" }} />;
    }
  }

  return children;
};

export default PrivateRoute;