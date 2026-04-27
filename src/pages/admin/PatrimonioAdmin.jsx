import React, { useState } from "react";

function PatrimonioAdmin() {

  const [patrimonios, setPatrimonios] = useState([
    {
      id: 1,
      nombre: "Catedral de Hermosillo",
      tipo: "Material",
      municipio: "Hermosillo",
      descripcion: "Construcción histórica del siglo XIX."
    },
    {
      id: 2,
      nombre: "Danza del Venado",
      tipo: "Inmaterial",
      municipio: "Etchojoa",
      descripcion: "Expresión cultural tradicional del pueblo Yaqui."
    }
  ]);

  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    tipo: "Material",
    municipio: "",
    descripcion: ""
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
      setPatrimonios(
        patrimonios.map(p =>
          p.id === formData.id ? formData : p
        )
      );
    } else {
      setPatrimonios([
        ...patrimonios,
        { ...formData, id: Date.now() }
      ]);
    }

    setFormData({
      id: null,
      nombre: "",
      tipo: "Material",
      municipio: "",
      descripcion: ""
    });
  };

  const handleEdit = (patrimonio) => {
    setFormData(patrimonio);
  };

  const handleDelete = (id) => {
    setPatrimonios(
      patrimonios.filter(p => p.id !== id)
    );
  };

  return (
    <>
      <div className="patrimonio-container">

        <h1>Gestión de Patrimonios</h1>

        {/* FORMULARIO */}
        <form className="patrimonio-form" onSubmit={handleSubmit}>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre del patrimonio"
            value={formData.nombre}
            onChange={handleChange}
            required
          />

          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
          >
            <option>Material</option>
            <option>Inmaterial</option>
          </select>

          <input
            type="text"
            name="municipio"
            placeholder="Municipio"
            value={formData.municipio}
            onChange={handleChange}
            required
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
          />

          <button type="submit" className="btn-primary">
            {formData.id ? "Actualizar" : "Agregar"}
          </button>

        </form>

        {/* TABLA */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Municipio</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patrimonios.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>
                    <span className={`badge ${p.tipo === "Material" ? "material" : "inmaterial"}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td>{p.municipio}</td>
                  <td>{p.descripcion}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(p)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(p.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* CSS */}
      <style>{`

        .patrimonio-container {
          min-height: 100vh;
          background: #f1f5f9;
          padding: 30px;
          font-family: Arial, sans-serif;
        }

        h1 {
          margin-bottom: 20px;
        }

        .patrimonio-form {
          background: white;
          padding: 20px;
          border-radius: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
          border: 1px solid #e2e8f0;
        }

        .patrimonio-form input,
        .patrimonio-form select,
        .patrimonio-form textarea {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
        }

        .patrimonio-form textarea {
          resize: none;
          height: 80px;
          grid-column: span 2;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .table-wrapper {
          background: white;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8fafc;
          padding: 12px;
          text-align: left;
          font-size: 14px;
          color: #64748b;
        }

        td {
          padding: 12px;
          border-top: 1px solid #e2e8f0;
        }

        tr:hover {
          background: #f1f5f9;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .material {
          background: #dcfce7;
          color: #166534;
        }

        .inmaterial {
          background: #ede9fe;
          color: #5b21b6;
        }

        .btn-edit {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 5px;
          margin-right: 5px;
          cursor: pointer;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 5px;
          cursor: pointer;
        }

        .btn-edit:hover {
          background: #d97706;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

      `}</style>
    </>
  );
}

export default PatrimonioAdmin;