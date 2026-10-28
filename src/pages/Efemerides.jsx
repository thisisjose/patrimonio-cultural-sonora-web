import "../styles/pages/Efemerides.css";

function Efemerides() {
  return (
    <main className="efemerides-page">
      <header className="efemerides-header">
        <h1 className="efemerides-title">Efemérides de Sonora</h1>
      </header>

      <div className="efemerides-frame">
        <iframe
          src="https://efemerides.redescubramossonora.mx/views/Calendario.html"
          title="Calendario de efemérides de Sonora"
          loading="lazy"
        />
      </div>
    </main>
  );
}

export default Efemerides;
