import React, { useState } from "react";

function Usuarios() {

  const [users, setUsers] = useState([
  {
    id: 1,
    nombre: "Juan",
    apellidos: "Pérez López",
    correo: "juan@email.com",
    telefono: "6621234567",
    rol: "Administrador"
  },
  {
    id: 2,
    nombre: "María",
    apellidos: "García Torres",
    correo: "maria@email.com",
    telefono: "6629876543",
    rol: "Administrador"
  },
  {
    id: 3,
    nombre: "Carlos",
    apellidos: "Ramírez Soto",
    correo: "carlos@email.com",
    telefono: "6623456789",
    rol: "Usuario"
  },
  {
    id: 4,
    nombre: "Ana",
    apellidos: "Martínez Cruz",
    correo: "ana@email.com",
    telefono: "6624567890",
    rol: "Usuario"
  },
  {
    id: 5,
    nombre: "Luis",
    apellidos: "Hernández Ruiz",
    correo: "luis@email.com",
    telefono: "6625678901",
    rol: "Administrador"
  },
  {
    id: 6,
    nombre: "Fernanda",
    apellidos: "López Castillo",
    correo: "fernanda@email.com",
    telefono: "6626789012",
    rol: "Usuario"
  },
  {
    id: 7,
    nombre: "Diego",
    apellidos: "Morales Navarro",
    correo: "diego@email.com",
    telefono: "6627890123",
    rol: "Usuario"
  },
  {
    id: 8,
    nombre: "Valeria",
    apellidos: "Torres Sánchez",
    correo: "valeria@email.com",
    telefono: "6628901234",
    rol: "Administrador"
  },
  {
    id: 9,
    nombre: "Ricardo",
    apellidos: "Ortega Flores",
    correo: "ricardo@email.com",
    telefono: "6629012345",
    rol: "Usuario"
  },
  {
    id: 10,
    nombre: "Sofía",
    apellidos: "Vargas Mendoza",
    correo: "sofia@email.com",
    telefono: "6621122334",
    rol: "Usuario"
  }
]);

  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    apellidos: "",
    correo: "",
    telefono: "",
    rol: "Usuario"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.id) {
      setUsers(users.map(user =>
        user.id === formData.id ? formData : user
      ));
    } else {
      setUsers([
        ...users,
        { ...formData, id: Date.now() }
      ]);
    }

    setFormData({
      id: null,
      nombre: "",
      apellidos: "",
      correo: "",
      telefono: "",
      rol: "Usuario"
    });
  };

  const handleEdit = (user) => {
    setFormData(user);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <>
      <div className="dashboard">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              Gestión de Usuarios
            </h1>
            <p className="dashboard-subtitle">
              Administración de cuentas del sistema
            </p>
          </div>

          <button className="btn-primary">
            Nuevo Usuario
          </button>
        </header>

        {/* MÉTRICAS */}
        <section className="metrics">
          <MetricCard title="Total Usuarios" value={users.length} />
          <MetricCard
            title="Administradores"
            value={users.filter(u => u.rol === "Administrador").length}
          />
          <MetricCard
            title="Usuarios"
            value={users.filter(u => u.rol === "Usuario").length}
          />
        </section>

        {/* FORMULARIO */}
        <section className="form-container">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="apellidos"
              placeholder="Apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="correo"
              placeholder="Correo"
              value={formData.correo}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
              required
            />

            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
            >
              <option>Usuario</option>
              <option>Administrador</option>
            </select>

            <button type="submit" className="btn-success">
              {formData.id ? "Actualizar" : "Agregar"}
            </button>
          </form>
        </section>

        {/* TABLA */}
        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>
                    <div className="title">
                      {user.nombre} {user.apellidos}
                    </div>
                  </td>
                  <td>{user.correo}</td>
                  <td>{user.telefono}</td>
                  <td>
                    <span className={`badge ${user.rol === "Administrador" ? "admin" : ""}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-success small"
                      onClick={() => handleEdit(user)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger small"
                      onClick={() => handleDelete(user.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>

      {/* CSS */}
      <style>{`

        body {
          margin: 0;
          background-color: #e5e7eb;
        }

        .dashboard {
          min-height: 100vh;
          padding: 40px;
          font-family: 'Segoe UI', sans-serif;
          color: #1f2937;
          background-color: #e5e7eb;
        }

        /* HEADER */

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 35px;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 700;
          color: #1f5f3b;
          margin: 0;
        }

        .dashboard-subtitle {
          font-size: 15px;
          color: #4b5563;
          margin-top: 6px;
        }

        .btn-primary {
          background-color: #1f5f3b;
          color: white;
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-primary:hover {
          background-color: #174c2f;
        }

        /* MÉTRICAS */

        .metrics {
          display: flex;
          gap: 25px;
          margin-bottom: 35px;
        }

        .metric-card {
          flex: 1;
          background: white;
          border-left: 6px solid #1f5f3b;
          border-radius: 10px;
          padding: 25px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .metric-title {
          font-size: 14px;
          color: #6b7280;
        }

        .metric-value {
          font-size: 32px;
          font-weight: bold;
          margin-top: 10px;
          color: #1f5f3b;
        }

        /* FORM */

        .form-container {
          background: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .form-container form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        input, select {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
        }

        /* TABLA */

        .table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background-color: #f9fafb;
          font-size: 13px;
          color: #6b7280;
          padding: 14px;
          text-align: left;
          font-weight: 600;
        }

        td {
          padding: 14px;
          border-top: 1px solid #e5e7eb;
        }

        tr:hover {
          background-color: #f3f4f6;
        }

        .badge {
          background-color: #e5e7eb;
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 20px;
        }

        .badge.admin {
          background-color: #dcfce7;
          color: #166534;
        }

        .btn-success {
          background-color: #1f5f3b;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 5px;
        }

        .btn-danger {
          background-color: #b91c1c;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-success:hover {
          background-color: #174c2f;
        }

        .btn-danger:hover {
          background-color: #991b1b;
        }

        .small {
          padding: 6px 10px;
          font-size: 12px;
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

export default Usuarios;