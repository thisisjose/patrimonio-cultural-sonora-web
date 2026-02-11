import MapView from "../components/MapView";

function Home() {
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

      {/* CONTENEDOR DEL MAPA */}
      <div
        style={{
          height: "500px",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <MapView />
      </div>
    </section>
  );
}

export default Home;
