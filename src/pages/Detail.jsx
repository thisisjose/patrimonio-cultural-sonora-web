import { useParams, Link } from "react-router-dom";

function Detail() {
  const { id } = useParams();

  // Datos simulados (luego vendrán desde la API)
  const patrimonios = [
    {
      id: "1",
      nombre: "Catedral de Hermosillo",
      descripcion:
        "La Catedral Metropolitana de Hermosillo es uno de los principales monumentos históricos y religiosos del estado de Sonora.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/6/6c/Catedral_de_Hermosillo.jpg",
    },
    {
      id: "2",
      nombre: "Cerro de la Campana",
      descripcion:
        "El Cerro de la Campana es un mirador natural que ofrece una vista panorámica de la ciudad de Hermosillo.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/e/e7/Cerro_de_la_Campana.jpg",
    },
    {
      id: "3",
      nombre: "Fiestas del Pitic",
      descripcion:
        "Festival cultural anual que celebra la fundación de Hermosillo con eventos artísticos y culturales.",
      imagen:
        "https://upload.wikimedia.org/wikipedia/commons/0/0c/Fiestas_del_Pitic.jpg",
    },
  ];

  const patrimonio = patrimonios.find((p) => p.id === id);

  if (!patrimonio) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  return (
    <div className="page-inner">
      <h2 className="heading-2">{patrimonio.nombre}</h2>

      <img src={patrimonio.imagen} alt={patrimonio.nombre} className="image-card" />

      <p className="lead">{patrimonio.descripcion}</p>

      <Link to="/" className="muted" style={{ display: "inline-block", marginTop: "1.25rem", fontWeight: 600 }}>
        ← Volver al mapa
      </Link>
    </div>
  );
}

export default Detail;