import MapView from "../components/MapView";

function Home() {

  // Datos simulados (luego vendrán de la API)
  const patrimonios = [
    {
      id: 1,
      nombre: "Catedral de Hermosillo",
      descripcion: "Uno de los principales monumentos históricos del estado.",
      lat: 29.0729,
      lng: -110.9559,
    },
    {
      id: 2,
      nombre: "Cerro de la Campana",
      descripcion: "Mirador emblemático de Hermosillo.",
      lat: 29.0817,
      lng: -110.9614,
    },
    {
      id: 3,
      nombre: "Fiestas del Pitic",
      descripcion: "Festival cultural anual en Hermosillo.",
      lat: 29.075,
      lng: -110.96,
    },
  ];

  return (
    <section>
      <h1
        style={{
          marginBottom: "1rem",
          textAlign: "center",
          fontSize: "3rem",
          fontWeight: "bold",
          color: "#1a5f3e",
        }}
      >
        Patrimonio cultural del estado de Sonora
      </h1>

      <p
        style={{
          maxWidth: "700px",
          margin: "0 auto 2rem auto",
          textAlign: "center",
          fontSize: "1.1rem",
          lineHeight: "1.6",
          color: "#333",
        }}
      >
        Descubre monumentos, festividades y elementos culturales del estado a
        través de un mapa interactivo que concentra información histórica y
        visual.
      </p>

     {/* CONTENEDOR DE ESTADÍSTICA */}
<div
  style={{
    maxWidth: "900px",
    margin: "0 auto 2.5rem auto",
    padding: "2.5rem 1.5rem",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #f8fbf9, #eef5f1)",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
    textAlign: "center",
  }}
>
  <div
    style={{
      fontSize: "3rem",
      fontWeight: "700",
      letterSpacing: "1px",
      color: "#0f3d29",
      marginBottom: "1rem",
      lineHeight: "1.2",
    }}
  >
    Sitios registrados en el mapa
  </div>

  <div
    style={{
      fontSize: "2.4rem",
      fontWeight: "600",
      color: "#1a5f3e",
    }}
  >
    {patrimonios.length}
  </div>
</div>

      {/* CONTENEDOR MAPA */}
      <div
        style={{
          maxWidth: "900px",
          height: "500px",
          margin: "0 auto",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        }}
      >
        <MapView patrimonios={patrimonios} />
      </div>
    </section>
  );
}

export default Home;