import { Outlet, Link } from "react-router-dom";

function MainLayout() {
  return (
    <div className="app-container">
      <header style={{
        backgroundColor: "#1a5f3e",
        padding: "1.5rem 2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <h2 style={{
          color: "#fff",
          margin: "0 0 1rem 0",
          fontSize: "2rem",
          fontWeight: "bold"
        }}>
          Redescubramos Sonora
        </h2>
        <nav style={{
          display: "flex",
          gap: "2.5rem",
          alignItems: "center"
        }}>
          <Link to="/" style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "1.05rem",
            fontWeight: "600",
            padding: "0.5rem 0",
            borderBottom: "3px solid transparent",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderBottomColor = "#ffd700";
            e.target.style.color = "#ffd700";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderBottomColor = "transparent";
            e.target.style.color = "#fff";
          }}
          >
            Mapa
          </Link>
          <Link to="/acerca" style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "1.05rem",
            fontWeight: "600",
            padding: "0.5rem 0",
            borderBottom: "3px solid transparent",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderBottomColor = "#ffd700";
            e.target.style.color = "#ffd700";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderBottomColor = "transparent";
            e.target.style.color = "#fff";
          }}
          >
            Acerca del proyecto
          </Link>
          <Link to="/contacto" style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "1.05rem",
            fontWeight: "600",
            padding: "0.5rem 0",
            borderBottom: "3px solid transparent",
            transition: "all 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderBottomColor = "#ffd700";
            e.target.style.color = "#ffd700";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderBottomColor = "transparent";
            e.target.style.color = "#fff";
          }}
          >
            Contáctanos
          </Link>
        </nav>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer>
        <small>
          Diseño y desarrollo de un sitio web de patrimonio cultural de Sonora
        </small>
      </footer>
    </div>
  );
}

export default MainLayout;
