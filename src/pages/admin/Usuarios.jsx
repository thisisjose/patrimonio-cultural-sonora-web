import React, { useState } from "react";

function Usuarios() {
  const [users, setUsers] = useState([
    { id: 1, nombre: "Juan", apellidos: "Pérez López", correo: "juan@email.com", telefono: "6621234567", rol: "Administrador" },
    { id: 2, nombre: "María", apellidos: "García Torres", correo: "maria@email.com", telefono: "6629876543", rol: "Administrador" },
    { id: 3, nombre: "Carlos", apellidos: "Ramírez Soto", correo: "carlos@email.com", telefono: "6623456789", rol: "Usuario" },
    { id: 4, nombre: "Ana", apellidos: "Martínez Cruz", correo: "ana@email.com", telefono: "6624567890", rol: "Usuario" },
    { id: 5, nombre: "Luis", apellidos: "Hernández Ruiz", correo: "luis@email.com", telefono: "6625678901", rol: "Administrador" },
    { id: 6, nombre: "Fernanda", apellidos: "López Castillo", correo: "fernanda@email.com", telefono: "6626789012", rol: "Usuario" },
    { id: 7, nombre: "Diego", apellidos: "Morales Navarro", correo: "diego@email.com", telefono: "6627890123", rol: "Usuario" },
    { id: 8, nombre: "Valeria", apellidos: "Torres Sánchez", correo: "valeria@email.com", telefono: "6628901234", rol: "Administrador" },
    { id: 9, nombre: "Ricardo", apellidos: "Ortega Flores", correo: "ricardo@email.com", telefono: "6629012345", rol: "Usuario" },
    { id: 10, nombre: "Sofía", apellidos: "Vargas Mendoza", correo: "sofia@email.com", telefono: "6621122334", rol: "Usuario" },
  ]);

  const [filtroRol, setFiltroRol] = useState("Todos");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({});
  const [formNuevo, setFormNuevo] = useState({ nombre: "", apellidos: "", correo: "", telefono: "", rol: "Usuario" });

  const admins = users.filter(u => u.rol === "Administrador").length;
  const regular = users.filter(u => u.rol === "Usuario").length;
  const filtrados = users.filter(u => filtroRol === "Todos" || u.rol === filtroRol);

  const handleDelete = (id) => setUsers(users.filter(u => u.id !== id));

  const abrirEditar = (user) => { setFormEditar({ ...user }); setModalEditar(user); };
  const cerrarEditar = () => { setModalEditar(null); setFormEditar({}); };
  const guardarEdicion = () => {
    setUsers(users.map(u => u.id === formEditar.id ? { ...formEditar } : u));
    cerrarEditar();
  };

  const guardarNuevo = () => {
    setUsers([{ ...formNuevo, id: Date.now() }, ...users]);
    setModalNuevo(false);
    setFormNuevo({ nombre: "", apellidos: "", correo: "", telefono: "", rol: "Usuario" });
  };

  return (
    <>
      <style>{STYLE}</style>

      {/* MODAL NUEVO */}
      {modalNuevo && (
        <div className="overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nuevo Usuario</div>
                <div className="modal-crumb">Crear cuenta en el sistema</div>
              </div>
              <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={formNuevo.nombre}
                    onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input className="form-input" value={formNuevo.apellidos}
                    onChange={e => setFormNuevo({ ...formNuevo, apellidos: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input className="form-input" type="email" value={formNuevo.correo}
                  onChange={e => setFormNuevo({ ...formNuevo, correo: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={formNuevo.telefono}
                    onChange={e => setFormNuevo({ ...formNuevo, telefono: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-input" value={formNuevo.rol}
                    onChange={e => setFormNuevo({ ...formNuevo, rol: e.target.value })}>
                    <option>Usuario</option>
                    <option>Administrador</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarNuevo}>Guardar</button>
              <button className="btn-secondary" onClick={() => setModalNuevo(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Editar Usuario</div>
                <div className="modal-crumb">#{formEditar.id} · {formEditar.nombre} {formEditar.apellidos}</div>
              </div>
              <button className="modal-close" onClick={cerrarEditar}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={formEditar.nombre}
                    onChange={e => setFormEditar({ ...formEditar, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos</label>
                  <input className="form-input" value={formEditar.apellidos}
                    onChange={e => setFormEditar({ ...formEditar, apellidos: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input className="form-input" type="email" value={formEditar.correo}
                  onChange={e => setFormEditar({ ...formEditar, correo: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={formEditar.telefono}
                    onChange={e => setFormEditar({ ...formEditar, telefono: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-input" value={formEditar.rol}
                    onChange={e => setFormEditar({ ...formEditar, rol: e.target.value })}>
                    <option>Usuario</option>
                    <option>Administrador</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
              <button className="btn-secondary" onClick={cerrarEditar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* PÁGINA PRINCIPAL */}
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Usuarios</div>
            <div className="page-crumb">Administración · Cuentas del Sistema</div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Nuevo Usuario
        </button>

        <div className="metrics">
          <div className="m-card">
            <div>
              <div className="m-label">Administradores</div>
              <div className="m-value">{admins}</div>
              <div className="m-sub">Con acceso total</div>
            </div>
          </div>
          <div className="m-card">
            <div>
              <div className="m-label">Usuarios</div>
              <div className="m-value">{regular}</div>
              <div className="m-sub">Acceso estándar</div>
            </div>
          </div>
          <div className="m-card">
            <div>
              <div className="m-label">Total</div>
              <div className="m-value">{users.length}</div>
              <div className="m-sub">En el sistema</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ minWidth: 0 }}>
          <div className="tbar">
            <div className="fpill">
              &nbsp;
              <select className="fsel" onChange={e => setFiltroRol(e.target.value)}>
                <option>Todos</option>
                <option>Administrador</option>
                <option>Usuario</option>
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
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty">
                        <div className="empty-icon">🔍</div>
                        Sin resultados para los filtros aplicados
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map(user => (
                    <tr key={user.id}>
                      <td><span className="tid">#{user.id}</span></td>
                      <td><div className="ttitle">{user.nombre} {user.apellidos}</div></td>
                      <td><span className="tdate">{user.correo}</span></td>
                      <td><span className="tdate">{user.telefono}</span></td>
                      <td>
                        <span className={`brol ${user.rol === "Administrador" ? "admin" : "usuario"}`}>
                          <span className={`dot ${user.rol === "Administrador" ? "green" : "gray"}`} />
                          {user.rol}
                        </span>
                      </td>
                      <td>
                        <div>
                          <button className="ab edit" onClick={() => abrirEditar(user)}>Editar</button>
                          <button className="ab delete" onClick={() => handleDelete(user.id)}>Eliminar</button>
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

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-900: #0d3320;
    --green-800: #134d30;
    --green-700: #1a6640;
    --green-600: #1f7a4c;
    --green-500: #27a060;
    --green-100: #dcf5e8;
    --gray-900: #111714;
    --gray-700: #2a332e;
    --gray-600: #3d4d45;
    --gray-400: #6b7d73;
    --gray-200: #cdd8d2;
    --gray-100: #e8efeb;
    --gray-50:  #f4f7f5;
    --amber-500: #f59e0b;
    --amber-100: #fef3c7;
    --red-600:   #dc2626;
    --red-100:   #fee2e2;
    --radius-sm: 6px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
    --shadow-md: 0 4px 12px rgba(0,0,0,.10), 0 2px 4px rgba(0,0,0,.06);
    --shadow-xl: 0 20px 60px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.10);
  }

  body { margin: 0; background: var(--gray-50); font-family: 'DM Sans', sans-serif; color: var(--gray-900); }

  .page { padding: 28px 24px; width: 100%; }
  .page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
  .page-title  { font-size: 21px; font-weight: 700; color: var(--gray-900); }
  .page-crumb  { font-size: 12px; color: var(--gray-400); margin-top: 3px; }

  .metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 26px; }
  .m-card {
    background: white; border-radius: var(--radius-lg); padding: 18px 22px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100);
    display: flex; align-items: center; gap: 16px;
    transition: box-shadow .2s, transform .2s;
  }
  .m-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .m-label { font-size: 11px; font-weight: 700; color: var(--gray-400); text-transform: uppercase; letter-spacing: .05em; }
  .m-value { font-size: 30px; font-weight: 700; color: var(--gray-900); line-height: 1.1; font-family: 'DM Mono', monospace; }
  .m-sub   { font-size: 11.5px; color: var(--gray-400); }

  .card { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100); overflow: hidden; }

  .tbar { padding: 13px 18px; border-bottom: 1px solid var(--gray-100); display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
  .fpill { display: flex; align-items: center; gap: 5px; background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 20px; padding: 5px 10px; font-size: 12px; font-weight: 500; color: var(--gray-700); }
  .fsel  { background: transparent; border: none; outline: none; font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 500; color: var(--gray-700); cursor: pointer; appearance: none; padding-right: 8px; }
  .farrow { font-size: 9px; color: var(--gray-400); margin-left: -5px; }
  .spacer { flex: 1; }
  .cnt { background: var(--green-100); color: var(--green-800); font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }

  .table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  table { width: 100%; border-collapse: collapse; min-width: 600px; }
  thead tr { background: var(--gray-50); }
  th { padding:11px 14px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--gray-400); text-align:left; white-space:nowrap; }
  td { padding:12px 14px; border-top:1px solid var(--gray-100); font-size:13px; color:var(--gray-700); vertical-align:middle; }
  tr:hover td { background: var(--gray-50); }

  .tid    { font-family:'DM Mono',monospace; font-size:11.5px; color:var(--gray-400); }
  .ttitle { font-weight:600; color:var(--gray-900); font-size:13.5px; }
  .tdate  { font-size:12px; font-family:'DM Mono',monospace; color:var(--gray-600); white-space:nowrap; }

  .brol { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; }
  .brol.admin   { background:var(--green-100); color:var(--green-800); }
  .brol.usuario { background:var(--gray-100); color:var(--gray-600); }
  .dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .dot.green { background:var(--green-500); }
  .dot.gray  { background:var(--gray-400); }

  .ab { padding:6px 12px; border-radius:var(--radius-sm); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all .18s ease; white-space:nowrap; display:inline-flex; align-items:center; gap:5px; width:70px; height:30px; border-radius:8px; justify-content:center; font-size:14px; margin:1px; }
  .ab:active { transform:scale(.95); }
  .ab.edit   { background:var(--gray-100); color:var(--gray-700); margin-right:5px; }
  .ab.edit:hover { background:var(--gray-200); color:var(--gray-900); }
  .ab.delete { background:var(--red-100); color:var(--red-600); }
  .ab.delete:hover { background:#fecaca; color:#991b1b; }

  .empty { padding:50px 24px; text-align:center; color:var(--gray-400); font-size:13.5px; }
  .empty-icon { font-size:32px; margin-bottom:10px; }

  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px; animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .modal {
    background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);
    width: 100%; max-width: 520px; max-height: 90vh;
    display: flex; flex-direction: column;
    animation: slideUp .2s ease; overflow: hidden;
  }
  @keyframes slideUp { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }

  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 22px 16px; border-bottom: 1px solid var(--gray-100); flex-shrink: 0;
  }
  .modal-title { font-size: 17px; font-weight: 700; color: var(--gray-900); }
  .modal-crumb { font-size: 12px; color: var(--gray-400); margin-top: 3px; font-family: 'DM Mono', monospace; }
  .modal-close {
    background: var(--gray-100); border: none; cursor: pointer;
    width: 30px; height: 30px; border-radius: 50%;
    font-size: 13px; color: var(--gray-600);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .15s;
  }
  .modal-close:hover { background: var(--gray-200); }

  .modal-body { padding: 20px 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }
  .modal-footer { padding: 14px 22px; border-top: 1px solid var(--gray-100); display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; }

  .btn-primary {
    background: var(--green-700); color: white; border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s; margin: 10px;
  }
  .btn-primary:hover { background: var(--green-800); }

  .btn-secondary {
    background: var(--gray-100); color: var(--gray-700); border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s;
  }
  .btn-secondary:hover { background: var(--gray-200); }

  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-400); }
  .form-input {
    background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);
    padding: 8px 11px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--gray-900);
    outline: none; transition: border-color .15s; width: 100%;
  }
  .form-input:focus { border-color: var(--green-500); background: white; }
`;

export default Usuarios;