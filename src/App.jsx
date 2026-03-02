import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Acerca from "./pages/Acerca";
import Contacto from "./pages/Contacto";
import Detail from "./pages/Detail";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/Dashboard";
import PatrimonioAdmin from "./pages/admin/PatrimonioAdmin";
import Usuarios from "./pages/admin/Usuarios";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="acerca" element={<Acerca />} />
          <Route path="contacto" element={<Contacto />} />
          <Route path="admin/" element={<AdminDashboard />} />
          <Route path="admin/usuarios" element={<Usuarios />} />
          <Route path="patrimonio/:id" element={<Detail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
