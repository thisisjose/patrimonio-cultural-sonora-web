import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

//PAGINAS PUBLICAS
import Home from './pages/Home';
import Acerca from './pages/Acerca';
import Contacto from './pages/Contacto';
import Detail from './pages/Detail';
import Explore from './pages/Explore';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

//PAGINAS ADMIN
import AdminDashboard from './pages/admin/Dashboard';
import Usuarios from './pages/admin/Usuarios';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas (MainLayout) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="acerca" element={<Acerca />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path=":municipio/:slug/patrimonio" element={<Detail />} />
            <Route path="patrimonio/:id" element={<Detail />} />
            <Route path="explorar/:mode/:value" element={<Explore />} />
            <Route path="catalogo" element={<Catalogo />} />
          </Route>

          <Route path="/admin" element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route index element={<Home />} />
            <Route path="acerca" element={<Acerca />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path=":municipio/:slug/patrimonio" element={<Detail />} />
            <Route path="patrimonio/:id" element={<Detail />} />
            <Route path="explorar/:mode/:value" element={<Explore />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="usuarios" element={
              <PrivateRoute requiredRole="admin_supremo">
                <Usuarios />
              </PrivateRoute>
            } />
          </Route>

          {/* Login público */}
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
