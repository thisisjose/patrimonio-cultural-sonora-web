import React, { useState, useEffect } from "react";
import {
  listarAdmins,
  crearAdmin,
  editarAdmin,
  eliminarAdmin,
} from "../../services/adminManagementService";
import "../../styles/pages/admin/Usuarios.css";

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [filtroRol, setFiltroRol] = useState("Todos");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [formNuevo, setFormNuevo] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",       
    telefono: "",
    password: "",
  });

  const cargarAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listarAdmins();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de administradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAdmins();
  }, []);

  const adminsCount = users.length;

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este administrador?")) return;
    try {
      setSaving(true);
      await eliminarAdmin(id);
      await cargarAdmins();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el administrador.");
    } finally {
      setSaving(false);
    }
  };

  const abrirEditar = (user) => {
    setFormEditar({
      id: user.id,
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno || "",
      apellido_materno: user.apellido_materno || "",
      email: user.email,    
      telefono: user.telefono || "",
    });
    setModalEditar(user);
  };

  const cerrarEditar = () => {
    setModalEditar(null);
    setFormEditar({});
  };

  const guardarEdicion = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = {
        nombre: formEditar.nombre,
        apellido_paterno: formEditar.apellido_paterno,
        apellido_materno: formEditar.apellido_materno,
        telefono: formEditar.telefono,
      };
      await editarAdmin(formEditar.id, payload);
      await cargarAdmins();
      cerrarEditar();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el administrador.");
    } finally {
      setSaving(false);
    }
  };

  const guardarNuevo = async () => {
    if (!formNuevo.password) {
      setError("La contraseña es obligatoria.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const payload = {
        nombre: formNuevo.nombre,
        apellido_paterno: formNuevo.apellido_paterno,
        apellido_materno: formNuevo.apellido_materno,
        email: formNuevo.email,    
        telefono: formNuevo.telefono,
        password: formNuevo.password,
      };
      await crearAdmin(payload);
      setModalNuevo(false);
      setFormNuevo({
        nombre: "",
        apellido_paterno: "",
        apellido_materno: "",
        email: "",
        telefono: "",
        password: "",
      });
      await cargarAdmins();
    } catch (err) {
      console.error(err);
      setError("Error al crear el administrador.");
    } finally {
      setSaving(false);
    }
  };

  const filtrados = users.filter((u) =>
    filtroRol === "Todos" ? true : u.rol === filtroRol
  );

  const getNombreCompleto = (user) => {
    const paterno = user.apellido_paterno || "";
    const materno = user.apellido_materno || "";
    return `${user.nombre} ${paterno} ${materno}`.trim();
  };

  return (
    <>
      {/* Modal Nuevo */}
      {modalNuevo && (
        <div className="overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nuevo Administrador</div>
                <div className="modal-crumb">Crear cuenta en el sistema</div>
              </div>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    value={formNuevo.nombre}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, nombre: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido Paterno</label>
                  <input
                    className="form-input"
                    value={formNuevo.apellido_paterno}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, apellido_paterno: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Apellido Materno</label>
                  <input
                    className="form-input"
                    value={formNuevo.apellido_materno}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, apellido_materno: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-input"
                    value={formNuevo.telefono}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, telefono: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  className="form-input"
                  type="email"
                  value={formNuevo.email}
                  onChange={(e) =>
                    setFormNuevo({ ...formNuevo, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  value={formNuevo.password}
                  onChange={(e) =>
                    setFormNuevo({ ...formNuevo, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarNuevo} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Editar Administrador</div>
                <div className="modal-crumb">
                  #{formEditar.id} · {formEditar.nombre} {formEditar.apellido_paterno} {formEditar.apellido_materno}
                </div>
              </div>
              <button className="modal-close" onClick={cerrarEditar}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    value={formEditar.nombre || ""}
                    onChange={(e) =>
                      setFormEditar({ ...formEditar, nombre: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellido Paterno</label>
                  <input
                    className="form-input"
                    value={formEditar.apellido_paterno || ""}
                    onChange={(e) =>
                      setFormEditar({ ...formEditar, apellido_paterno: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Apellido Materno</label>
                  <input
                    className="form-input"
                    value={formEditar.apellido_materno || ""}
                    onChange={(e) =>
                      setFormEditar({ ...formEditar, apellido_materno: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    className="form-input"
                    value={formEditar.telefono || ""}
                    onChange={(e) =>
                      setFormEditar({ ...formEditar, telefono: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  className="form-input"
                  type="email"
                  value={formEditar.email || ""}
                  disabled
                  title="No se puede modificar el correo"
                />
                <small style={{ color: "var(--gray-400)" }}>
                  El correo no se puede modificar
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarEdicion} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button className="btn-secondary" onClick={cerrarEditar}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Página principal */}
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Administradores</div>
            <div className="page-crumb">Administración · Cuentas de administración</div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Nuevo Administrador
        </button>

        {error && <div className="error-banner">{error}</div>}

        <div className="metrics">
          <div className="m-card">
            <div>
              <div className="m-label">Total</div>
              <div className="m-value">{adminsCount}</div>
              <div className="m-sub">Administradores registrados</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="tbar">
            <div className="fpill">
              <select
                className="fsel"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option>Todos</option>
                <option>Administrador</option>
              </select>
              <span className="farrow">▾</span>
            </div>
            <div className="spacer" />
            <span className="cnt">{filtrados.length} registros</span>
          </div>

          <div className="table-scroll">
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
                {loading ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty">Cargando administradores...</div>
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty">
                        <div className="empty-icon">👥</div>
                        No hay administradores registrados
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="tid">#{user.id}</span>
                      </td>
                      <td>
                        <div className="ttitle">{getNombreCompleto(user)}</div>
                      </td>
                      <td>
                        <span className="tdate">{user.email}</span>  
                      </td>
                      <td>
                        <span className="tdate">{user.telefono || "—"}</span>
                      </td>
                      <td>
                        <span className="brol">
                          <span className="dot" />
                          Administrador
                        </span>
                      </td>
                      <td>
                        <div>
                          <button
                            className="ab edit"
                            onClick={() => abrirEditar(user)}
                          >
                            Editar
                          </button>
                          <button
                            className="ab delete"
                            onClick={() => handleDelete(user.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}