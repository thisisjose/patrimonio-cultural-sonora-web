function Acerca() {
  return (
    <section style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{
        textAlign: "center",
        fontSize: "2.8rem",
        fontWeight: "bold",
        color: "#1a5f3e",
        marginBottom: "2rem"
      }}>
        Acerca del proyecto
      </h1>

      <div style={{
        backgroundColor: "#f5f5f5",
        padding: "2rem",
        borderRadius: "8px",
        borderLeft: "5px solid #1a5f3e",
        marginBottom: "2rem"
      }}>
        <p style={{
          fontSize: "1.1rem",
          lineHeight: "1.8",
          color: "#333",
          margin: "0"
        }}>
          <strong>Redescubramos Sonora</strong> es una plataforma digital dedicada a la difusión, preservación y localización del patrimonio cultural material del estado de Sonora. Nuestro objetivo es poner al alcance del público una herramienta sencilla, intuitiva y accesible que permita explorar, conocer y valorar la riqueza histórica y cultural de nuestra región.
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{
          fontSize: "1.5rem",
          color: "#1a5f3e",
          marginBottom: "1rem"
        }}>
          Nuestros objetivos
        </h3>
        <ul style={{
          fontSize: "1.05rem",
          lineHeight: "1.8",
          color: "#333",
          paddingLeft: "2rem"
        }}>
          <li style={{ marginBottom: "0.8rem" }}>Documentar y registrar los elementos del patrimonio cultural de Sonora</li>
          <li style={{ marginBottom: "0.8rem" }}>Facilitar el acceso a información histórica y visual de sitios culturales</li>
          <li style={{ marginBottom: "0.8rem" }}>Promover el conocimiento y apreciación de nuestra identidad cultural</li>
          <li style={{ marginBottom: "0.8rem" }}>Contribuir a la preservación de la memoria colectiva del estado</li>
        </ul>
      </div>

      <p style={{
        marginTop: "2rem",
        fontSize: "0.95rem",
        color: "#666",
        fontStyle: "italic",
        textAlign: "center"
      }}>
        Explora nuestro mapa interactivo y descubre los tesoros culturales del estado de Sonora
      </p>
    </section>
  );
}

export default Acerca;
    