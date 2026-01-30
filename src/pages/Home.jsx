function Home() {
  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>
        Patrimonio cultural del estado de Sonora
      </h1>

      <p style={{ maxWidth: "700px", marginBottom: "2rem" }}>
        Descubre monumentos, festividades y elementos culturales del estado a
        través de un mapa interactivo que concentra información histórica y
        visual.
      </p>

      <div
        style={{
          height: "450px",
          backgroundColor: "#e0e0e0",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
        }}
      >
        Mapa interactivo aquí
      </div>
    </section>
  );
}

export default Home;
