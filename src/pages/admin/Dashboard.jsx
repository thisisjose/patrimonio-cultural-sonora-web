import React, { useState } from "react";

function AdminDashboard() {

  const [patrimonios, setPatrimonios] = useState([
    {
      id: 1158,
      titulo: "Danza del Venado",
      ubicacion: "Hermosillo",
      categoria: "Inmaterial",
      estado: "Pendiente",
      autor: "Anónimo",
      fecha: "04-01-2026",
      imagen: "https://via.placeholder.com/80"
    },
    {
      id: 1157,
      titulo: "Catedral de Hermosillo",
      ubicacion: "Hermosillo",
      categoria: "Material",
      estado: "Registrado",
      autor: "Anónimo",
      fecha: "03-01-2026",
      imagen: "https://via.placeholder.com/80"
    },
    {
      id: 1156,
      titulo: "Zona Arqueológica Cerro de Trincheras",
      ubicacion: "Trincheras",
      categoria: "Material",
      estado: "Registrado",
      autor: "Admin",
      fecha: "02-01-2026",
      imagen: "https://via.placeholder.com/80"
    },
    {
      id: 1155,
      titulo: "Fiestas del Pitic",
      ubicacion: "Hermosillo",
      categoria: "Inmaterial",
      estado: "Pendiente",
      autor: "Admin",
      fecha: "01-01-2026",
      imagen: "https://via.placeholder.com/80"
    },
    {
      id: 1154,
      titulo: "Museo de Sonora",
      ubicacion: "Hermosillo",
      categoria: "Material",
      estado: "Registrado",
      autor: "Admin",
      fecha: "28-12-2025",
      imagen: "https://via.placeholder.com/80"
    }
  ]);

  const [filtro, setFiltro] = useState({
    municipio: "Todos",
    categoria: "Todas",
    estado: "Todos"
  });

  const [formData, setFormData] = useState({
    id: null,
    titulo: "",
    ubicacion: "",
    categoria: "Material",
    estado: "Pendiente",
    imagen: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.id) {
      setPatrimonios(
        patrimonios.map(p =>
          p.id === formData.id
            ? { ...formData, autor: "Admin", fecha: "05-01-2026" }
            : p
        )
      );
    } else {
      setPatrimonios([
        ...patrimonios,
        {
          ...formData,
          id: Date.now(),
          autor: "Admin",
          fecha: "05-01-2026"
        }
      ]);
    }

    setFormData({
      id: null,
      titulo: "",
      ubicacion: "",
      categoria: "Material",
      estado: "Pendiente",
      imagen: ""
    });
  };

  const handleEdit = (item) => {
    setFormData(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setPatrimonios(patrimonios.filter(p => p.id !== id));
  };

  const filtrados = patrimonios.filter(p =>
    (filtro.municipio === "Todos" || p.ubicacion === filtro.municipio) &&
    (filtro.categoria === "Todas" || p.categoria === filtro.categoria) &&
    (filtro.estado === "Todos" || p.estado === filtro.estado)
  );

  return (
    <>
      <div className="dashboard">

        <header>
          <h1 className="dashboard-title">Panel de Control</h1>
          <p className="dashboard-subtitle">
            Administración de patrimonios culturales
          </p>
        </header>

        <section className="filters">
          <select onChange={e => setFiltro({...filtro, municipio: e.target.value})}>
            <option>Todos</option>
            <option>Hermosillo</option>
            <option>Trincheras</option>
          </select>

          <select onChange={e => setFiltro({...filtro, categoria: e.target.value})}>
            <option>Todas</option>
            <option>Material</option>
            <option>Inmaterial</option>
          </select>

          <select onChange={e => setFiltro({...filtro, estado: e.target.value})}>
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Registrado</option>
          </select>
        </section>

        <section className="metrics">
          <MetricCard title="Pendientes" value={patrimonios.filter(p=>p.estado==="Pendiente").length} />
          <MetricCard title="Registrados" value={patrimonios.filter(p=>p.estado==="Registrado").length} />
          <MetricCard title="Total" value={patrimonios.length} />
        </section>

        <section className="form-container">
          <form onSubmit={handleSubmit}>
            <input type="text" name="titulo" placeholder="Título" value={formData.titulo} onChange={handleChange} required />
            <input type="text" name="ubicacion" placeholder="Municipio" value={formData.ubicacion} onChange={handleChange} required />
            <input type="text" name="imagen" placeholder="URL de Imagen" value={formData.imagen} onChange={handleChange} required />
            <select name="categoria" value={formData.categoria} onChange={handleChange}>
              <option>Material</option>
              <option>Inmaterial</option>
            </select>
            <select name="estado" value={formData.estado} onChange={handleChange}>
              <option>Pendiente</option>
              <option>Registrado</option>
            </select>
            <button className="btn-success">
              {formData.id ? "Actualizar" : "Agregar"}
            </button>
          </form>
        </section>

        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Título / Ubicación</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Autor</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(item => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    <img src={item.imagen} alt={item.titulo} className="thumb" />
                  </td>
                  <td>
                    <div className="title">{item.titulo}</div>
                    <div className="location">{item.ubicacion}, Sonora</div>
                  </td>
                  <td><span className="badge">{item.categoria}</span></td>
                  <td>
                    <span className={`status ${item.estado==="Registrado"?"active":""}`}>
                      {item.estado}
                    </span>
                  </td>
                  <td>{item.autor}</td>
                  <td>{item.fecha}</td>
                  <td>
                    <button className="btn-success small" onClick={()=>handleEdit(item)}>Editar</button>
                    <button className="btn-danger small" onClick={()=>handleDelete(item.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>

      <style>{`
        body { margin:0; background:#e5e7eb; }
        .dashboard { padding:40px; font-family:'Segoe UI'; }
        .dashboard-title { font-size:32px; color:#1f5f3b; margin:0; }
        .dashboard-subtitle { color:#4b5563; }

        .filters, .metrics { display:flex; gap:20px; margin:30px 0; }

        select, input {
          padding:10px;
          border-radius:8px;
          border:1px solid #d1d5db;
        }

        .metric-card {
          flex:1;
          background:white;
          padding:20px;
          border-left:6px solid #1f5f3b;
          border-radius:10px;
        }

        .metric-title { font-size:14px; color:#6b7280; }
        .metric-value { font-size:28px; color:#1f5f3b; font-weight:bold; }

        .form-container {
          background:white;
          padding:20px;
          border-radius:12px;
          margin-bottom:30px;
        }

        .form-container form {
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:15px;
        }

        .table-container {
          background:white;
          border-radius:12px;
          overflow:hidden;
        }

        table { width:100%; border-collapse:collapse; }

        th {
          background:#f9fafb;
          padding:14px;
          text-align:left;
          font-size:13px;
        }

        td {
          padding:14px;
          border-top:1px solid #e5e7eb;
        }

        tr:hover { background:#f3f4f6; }

        .thumb {
          width:60px;
          height:60px;
          object-fit:cover;
          border-radius:8px;
        }

        .badge {
          background:#e5e7eb;
          padding:4px 10px;
          border-radius:20px;
          font-size:12px;
        }

        .status {
          padding:4px 10px;
          border-radius:20px;
          font-size:12px;
          background:#fee2e2;
          color:#991b1b;
        }

        .status.active {
          background:#dcfce7;
          color:#166534;
        }

        .btn-success {
          background:#1f5f3b;
          color:white;
          border:none;
          padding:6px 12px;
          border-radius:6px;
          cursor:pointer;
          margin-right:5px;
        }

        .btn-danger {
          background:#b91c1c;
          color:white;
          border:none;
          padding:6px 12px;
          border-radius:6px;
          cursor:pointer;
        }
      `}</style>
    </>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

export default AdminDashboard;