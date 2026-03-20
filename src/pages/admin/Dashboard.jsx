import React, { useState } from "react";

export default function AdminDashboard() {
  const [patrimonios, setPatrimonios] = useState([
    {
      id: 1158,
      titulo: "Danza del Venado",
      ubicacion: "Hermosillo",
      categoria: "Inmaterial",
      estado: "Pendiente",
      fechaRegistro: "02-03-2025",
      fechaActualizacion: "04-01-2026",
      imagen: "https://www.inah.gob.mx/images/fotodeldia/20230316_fotodia_DanzaVenado.jpg",
      descripcion: "La Danza del Venado es una expresión artística y espiritual de los pueblos Yaqui y Mayo de Sonora, que representa la cacería del venado como símbolo sagrado de vida y naturaleza.",
    },
    {
      id: 1157,
      titulo: "Catedral de Hermosillo",
      ubicacion: "Hermosillo",
      categoria: "Material",
      estado: "Registrado",
      fechaRegistro: "23-11-2025",
      fechaActualizacion: "03-01-2026",
      imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG/1280px-Catedral_de_la_Asunci%C3%B3n_en_Hermosillo%2C_Sonora._M%C3%A9xico._02.JPG?_=20120911015059",
      descripcion: "La Catedral de la Asunción de Hermosillo es un templo católico construido en el siglo XIX, considerado uno de los íconos arquitectónicos más representativos del estado de Sonora.",
    },
    {
      id: 1156,
      titulo: "Zona Arqueológica Cerro de Trincheras",
      ubicacion: "Trincheras",
      categoria: "Material",
      estado: "Registrado",
      fechaRegistro: "20-12-2024",
      fechaActualizacion: "13-10-2026",
      imagen: "https://lugares.inah.gob.mx/sites/default/files/zonas/3_Cerro_de_Trincheras%2C_Sonora_S.jpg",
      descripcion: "Zona arqueológica prehispánica ubicada en el municipio de Trincheras, con evidencias de asentamientos de la cultura Trincheras que datan de entre el 800 y 1450 d.C.",
    },
    {
      id: 1155,
      titulo: "Fiestas del Pitic",
      ubicacion: "Hermosillo",
      categoria: "Inmaterial",
      estado: "Pendiente",
      fechaRegistro: "07-07-2025",
      fechaActualizacion: "28-12-2025",
      imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Fiestas_del_Pitic.jpg/640px-Fiestas_del_Pitic.jpg",
      descripcion: "Las Fiestas del Pitic son una celebración popular que conmemora la fundación de Hermosillo, con actividades culturales, artísticas y gastronómicas que reflejan la identidad sonorense.",
    },
    {
      id: 1154,
      titulo: "Museo de Sonora",
      ubicacion: "Hermosillo",
      categoria: "Material",
      estado: "Registrado",
      fechaRegistro: "17-05-2025",
      fechaActualizacion: "29-11-2026",
      imagen: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Antigua_Penitenciar%C3%ADa_del_Estado_de_Sonora%2C_Hermosillo_01.jpg",
      descripcion: "El Museo de Sonora ocupa el edificio de la antigua Penitenciaría del Estado, declarado monumento histórico. Alberga colecciones permanentes sobre la historia natural y cultural de Sonora.",
    },
  ]);

  const [filtro, setFiltro] = useState({ municipio: "Todos", categoria: "Todas", estado: "Todos" });
  const [modalVer, setModalVer] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({});

  const [modalNuevo, setModalNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState({
  titulo: "",
  ubicacion: "Hermosillo",
  categoria: "Material",
  estado: "Pendiente",
  imagen: "",
  descripcion: "",
  fechaRegistro: "",
  fechaActualizacion: "",
});

  const generarId = () => {
  let nuevoId;
  do {
    nuevoId = Math.floor(1000 + Math.random() * 9000);
  } while (patrimonios.some((p) => p.id === nuevoId));
  return nuevoId;
};

  const onDelete = (id) => setPatrimonios(patrimonios.filter((p) => p.id !== id));

  const abrirVer = (item) => setModalVer(item);
  const cerrarVer = () => setModalVer(null);

  const abrirEditar = (item) => {
    setFormEditar({ ...item });
    setModalEditar(item);
  };
  const cerrarEditar = () => { setModalEditar(null); setFormEditar({}); };

  const guardarEdicion = () => {
    setPatrimonios(patrimonios.map((p) => (p.id === formEditar.id ? { ...formEditar } : p)));
    cerrarEditar();
  };

  const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    setFormNuevo({
      ...formNuevo,
      imagen: reader.result,
    });
  };
  reader.readAsDataURL(file);
};

  const filtrados = patrimonios.filter(
    (p) =>
      (filtro.municipio === "Todos" || p.ubicacion === filtro.municipio) &&
      (filtro.categoria === "Todas" || p.categoria === filtro.categoria) &&
      (filtro.estado === "Todos" || p.estado === filtro.estado)
  );

  const pend = patrimonios.filter((p) => p.estado === "Pendiente").length;
  const reg = patrimonios.filter((p) => p.estado === "Registrado").length;

  const guardarNuevo = () => {
  const nuevo = {
    ...formNuevo,
    id: generarId(),
    fechaRegistro: new Date().toLocaleDateString(),
    fechaActualizacion: new Date().toLocaleDateString(),
  };

  setPatrimonios([nuevo, ...patrimonios]);
  setModalNuevo(false);

  // reset
  setFormNuevo({
    titulo: "",
    ubicacion: "Hermosillo",
    categoria: "Material",
    estado: "Pendiente",
    imagen: "",
    descripcion: "",
    fechaRegistro: "",
    fechaActualizacion: "",
  });
};

  return (
    <>
      <style>{STYLE}</style>

      {/* MODAL NUEVO */}
        {modalNuevo && (
          <div className="overlay" onClick={() => setModalNuevo(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Nuevo Patrimonio</div>
                </div>
                <button className="modal-close" onClick={() => setModalNuevo(false)}>✕</button>
              </div>

              <div className="modal-body">
                {formNuevo.imagen && (
                  <img src={formNuevo.imagen} alt="" className="modal-img" />
                )}

                <div className="form-group">
                  <label className="form-label">Título</label>
                  <input
                    className="form-input"
                    value={formNuevo.titulo}
                    onChange={(e) => setFormNuevo({ ...formNuevo, titulo: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Municipio</label>
                    <select
                      className="form-input"
                      value={formNuevo.ubicacion}
                      onChange={(e) => setFormNuevo({ ...formNuevo, ubicacion: e.target.value })}
                    >
                      <option>Hermosillo</option>
                      <option>Trincheras</option>
                      <option>Obregón</option>
                      <option>Guaymas</option>
                      <option>Nogales</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-input"
                      value={formNuevo.categoria}
                      onChange={(e) => setFormNuevo({ ...formNuevo, categoria: e.target.value })}
                    >
                      <option>Material</option>
                      <option>Inmaterial</option>
                      <option>Biocultural</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-input"
                    value={formNuevo.estado}
                    onChange={(e) => setFormNuevo({ ...formNuevo, estado: e.target.value })}
                  >
                    <option>Pendiente</option>
                    <option>Registrado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-input form-textarea"
                    value={formNuevo.descripcion}
                    onChange={(e) => setFormNuevo({ ...formNuevo, descripcion: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={guardarNuevo}>
                  Guardar
                </button>
                <button className="btn-secondary" onClick={() => setModalNuevo(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* MODAL VER */}
      {modalVer && (
        <div className="overlay" onClick={cerrarVer}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{modalVer.titulo}</div>
                <div className="modal-crumb">{modalVer.ubicacion}, Sonora · #{modalVer.id}</div>
              </div>
              <button className="modal-close" onClick={cerrarVer}>✕</button>
            </div>
            <div className="modal-body">
              <img src={modalVer.imagen} alt={modalVer.titulo} className="modal-img" />
              <div className="modal-badges">
                <span className={`bcat ${modalVer.categoria.toLowerCase()}`}>{modalVer.categoria}</span>
                <span className={`bst ${modalVer.estado.toLowerCase()}`}>
                  <span className={`dot ${modalVer.estado === "Registrado" ? "green" : "amber"}`} />
                  {modalVer.estado}
                </span>
              </div>
              {modalVer.descripcion && (
                <p className="modal-desc">{modalVer.descripcion}</p>
              )}
              <div className="modal-grid">
                <div className="modal-field">
                  <div className="mf-label">Municipio</div>
                  <div className="mf-value">{modalVer.ubicacion}</div>
                </div>
                <div className="modal-field">
                  <div className="mf-label">Categoría</div>
                  <div className="mf-value">{modalVer.categoria}</div>
                </div>
                <div className="modal-field">
                  <div className="mf-label">Fecha de Registro</div>
                  <div className="mf-value mono">{modalVer.fechaRegistro}</div>
                </div>
                <div className="modal-field">
                  <div className="mf-label">Última Actualización</div>
                  <div className="mf-value mono">{modalVer.fechaActualizacion}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="ab edit" onClick={() => { cerrarVer(); abrirEditar(modalVer); }}>Editar</button>
              <button className="btn-secondary" onClick={cerrarVer}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {modalEditar && (
        <div className="overlay" onClick={cerrarEditar}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Editar Patrimonio</div>
                <div className="modal-crumb">#{formEditar.id} · {formEditar.ubicacion}</div>
              </div>
              <button className="modal-close" onClick={cerrarEditar}>✕</button>
            </div>
            <div className="modal-body">
              <img src={formEditar.imagen} alt={formEditar.titulo} className="modal-img" />
              <div className="form-group">
                <label className="form-label">Título</label>
                <input
                  className="form-input"
                  value={formEditar.titulo}
                  onChange={(e) => setFormEditar({ ...formEditar, titulo: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Municipio</label>
                  <select
                    className="form-input"
                    value={formEditar.ubicacion}
                    onChange={(e) => setFormEditar({ ...formEditar, ubicacion: e.target.value })}
                  >
                    <option>Hermosillo</option>
                    <option>Trincheras</option>
                    <option>Obregón</option>
                    <option>Guaymas</option>
                    <option>Nogales</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-input"
                    value={formEditar.categoria}
                    onChange={(e) => setFormEditar({ ...formEditar, categoria: e.target.value })}
                  >
                    <option>Material</option>
                    <option>Inmaterial</option>
                    <option>Biocultural</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-input"
                    value={formEditar.estado}
                    onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}
                  >
                    <option>Pendiente</option>
                    <option>Registrado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Imagen</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => handleImageUpload(e)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-input form-textarea"
                  value={formEditar.descripcion || ""}
                  onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={guardarEdicion}>Guardar cambios</button>
              <button className="btn-secondary" onClick={cerrarEditar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    {/* CONTENIDO PRINCIPAL */}
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Patrimonios</div>
            <div className="page-crumb">Administración · Patrimonios Culturales</div>
          </div>
        </div>

        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Nuevo Patrimonio
        </button>

        <div className="metrics">
          <div className="m-card">
            <div>
              <div className="m-label">Pendientes</div>
              <div className="m-value">{pend}</div>
              <div className="m-sub">Requieren revisión</div>
            </div>
          </div>
          <div className="m-card">
            <div>
              <div className="m-label">Registrados</div>
              <div className="m-value">{reg}</div>
              <div className="m-sub">Catalogados y activos</div>
            </div>
          </div>
          <div className="m-card">
            <div>
              <div className="m-label">Total</div>
              <div className="m-value">{patrimonios.length}</div>
              <div className="m-sub">En el inventario</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ minWidth: 0 }}>
          <div className="tbar">
            <div className="fpill">
              &nbsp;
              <select className="fsel" onChange={(e) => setFiltro({ ...filtro, municipio: e.target.value })}>
                <option>Todos</option>
                <option>Hermosillo</option>
                <option>Trincheras</option>
              </select>
              <span className="farrow">▾</span>
            </div>
            <div className="fpill">
              &nbsp;
              <select className="fsel" onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}>
                <option>Todas</option>
                <option>Material</option>
                <option>Inmaterial</option>
                <option>Biocultural</option>
              </select>
              <span className="farrow">▾</span>
            </div>
            <div className="fpill">
              &nbsp;
              <select className="fsel" onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}>
                <option>Todos</option>
                <option>Pendiente</option>
                <option>Registrado</option>
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
                  <th>Imagen</th>
                  <th>Patrimonio</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Actualización</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty">
                        <div className="empty-icon">🔍</div>
                        Sin resultados para los filtros aplicados
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((item) => (
                    <tr key={item.id}>
                      <td><span className="tid">#{item.id}</span></td>
                      <td><img src={item.imagen} alt={item.titulo} className="thumb" /></td>
                      <td>
                        <div className="ttitle">{item.titulo}</div>
                        <div className="tloc">{item.ubicacion}, Sonora</div>
                      </td>
                      <td>
                        <span className={`bcat ${item.categoria.toLowerCase()}`}>{item.categoria}</span>
                      </td>
                      <td>
                        <span className={`bst ${item.estado.toLowerCase()}`}>
                          <span className={`dot ${item.estado === "Registrado" ? "green" : "amber"}`} />
                          {item.estado}
                        </span>
                      </td>
                      <td><span className="tdate">{item.fechaRegistro}</span></td>
                      <td><span className="tdate">{item.fechaActualizacion}</span></td>
                      <td>
                        <div>
                          <button className="ab view" onClick={() => abrirVer(item)}>Ver</button>
                          <button className="ab edit" onClick={() => abrirEditar(item)}>Editar</button>
                          <button className="ab delete" onClick={() => onDelete(item.id)}>Eliminar</button>
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
  table { width: 100%; border-collapse: collapse; min-width: 680px; }
  thead tr { background: var(--gray-50); }
  th { padding:11px 14px; font-size:10.5px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--gray-400); text-align:left; white-space:nowrap; }
  td { padding:12px 14px; border-top:1px solid var(--gray-100); font-size:13px; color:var(--gray-700); vertical-align:middle; }
  tr:hover td { background: var(--gray-50); }

  .tid    { font-family:'DM Mono',monospace; font-size:11.5px; color:var(--gray-400); }
  .thumb  { width:44px; height:44px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--gray-200); }
  .ttitle { font-weight:600; color:var(--gray-900); margin-bottom:2px; font-size:13.5px; }
  .tloc   { font-size:11.5px; color:var(--gray-400); }

  .bcat { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; background:var(--gray-100); color:var(--gray-600); white-space:nowrap; }
  .bcat.material    { background:#e0f2fe; color:#0369a1; }
  .bcat.inmaterial  { background:#f3e8ff; color:#7c3aed; }
  .bcat.biocultural { background:#fef9c3; color:#854d0e; }

  .bst { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600; white-space:nowrap; }
  .bst.pendiente  { background:var(--amber-100); color:#92400e; }
  .bst.registrado { background:var(--green-100); color:var(--green-800); }
  .dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }
  .dot.amber { background:var(--amber-500); }
  .dot.green { background:var(--green-500); }

  .tdate { font-size:12px; font-family:'DM Mono',monospace; color:var(--gray-400); white-space:nowrap; }

  .ab { padding:6px 12px; border-radius:var(--radius-sm); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all .18s ease; white-space:nowrap; display:inline-flex; align-items:center; gap:5px; width:70px; height:30px; border-radius:8px; justify-content:center; font-size:14px; margin:1px; }
  .ab:active { transform:scale(.95); }
  .ab.edit   { background:var(--gray-100); color:var(--gray-700); margin-right:5px; }
  .ab.edit:hover { background:var(--gray-200); color:var(--gray-900); }
  .ab.view   { background:#e0f2fe; color:#0369a1; margin-right:5px; }
  .ab.view:hover { background:#bae6fd; color:#075985; }
  .ab.delete { background:var(--red-100); color:var(--red-600); }
  .ab.delete:hover { background:#fecaca; color:#991b1b; }

  .empty { padding:50px 24px; text-align:center; color:var(--gray-400); font-size:13.5px; }
  .empty-icon { font-size:32px; margin-bottom:10px; }

  /* ── MODAL ── */
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .modal {
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: slideUp .2s ease;
    overflow: hidden;
  }
  @keyframes slideUp { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }

  .modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 22px 16px;
    border-bottom: 1px solid var(--gray-100);
    flex-shrink: 0;
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

  .modal-body {
    padding: 20px 22px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-img {
    width: 100%; height: 200px; object-fit: cover;
    border-radius: var(--radius-sm); border: 1px solid var(--gray-100);
  }

  .modal-badges { display: flex; gap: 8px; flex-wrap: wrap; }

  .modal-desc { font-size: 13.5px; color: var(--gray-600); line-height: 1.6; }

  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-field { background: var(--gray-50); border-radius: var(--radius-sm); padding: 12px 14px; border: 1px solid var(--gray-100); }
  .mf-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-400); margin-bottom: 4px; }
  .mf-value { font-size: 13.5px; font-weight: 600; color: var(--gray-900); }
  .mf-value.mono { font-family: 'DM Mono', monospace; font-weight: 400; font-size: 12.5px; }

  .modal-footer {
    padding: 14px 22px;
    border-top: 1px solid var(--gray-100);
    display: flex; gap: 8px; justify-content: flex-end;
    flex-shrink: 0;
  }

  .btn-primary {
    background: var(--green-700); color: white; border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s;
    margin: 10px;
  }
  .btn-primary:hover { background: var(--green-800); }

  .btn-secondary {
    background: var(--gray-100); color: var(--gray-700); border: none; cursor: pointer;
    padding: 8px 18px; border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    transition: background .15s;
  }
  .btn-secondary:hover { background: var(--gray-200); }

  /* FORM */
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--gray-400); }
  .form-input {
    background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: var(--radius-sm);
    padding: 8px 11px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--gray-900);
    outline: none; transition: border-color .15s; width: 100%;
  }
  .form-input:focus { border-color: var(--green-500); background: white; }
  .form-textarea { min-height: 80px; resize: vertical; }
`;