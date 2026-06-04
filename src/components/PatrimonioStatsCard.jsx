import "../styles/components/PatrimonioStatsCard.css";

function PatrimonioStatsCard({ material = 0, inmaterial = 0, biocultural = 0 }) {
  return (
    <div className="patrimonio-stats-container">
      <div className="stats-badge">PATRIMONIO SONORENSE</div>
      <div className="stats-content">
        <div className="stat-column">
          <div className="stat-number material-color">{material}</div>
          <div className="stat-label">MATERIAL</div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-column">
          <div className="stat-number inmaterial-color">{inmaterial}</div>
          <div className="stat-label">INMATERIAL</div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-column">
          <div className="stat-number biocultural-color">{biocultural}</div>
          <div className="stat-label">NATURAL</div>
        </div>
      </div>
    </div>
  );
}

export default PatrimonioStatsCard;
