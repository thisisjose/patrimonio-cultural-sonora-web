import {
  getCategoryClass,
  getCategoryLabel,
} from "../utils/categoryUtils";

const getLocationValue = (value) => {
  const location = typeof value === "string" ? value.trim() : "";
  return location && !["null", "undefined"].includes(location.toLowerCase())
    ? location
    : "";
};

export default function PopularCard({ item, municipio, onSelect }) {
  const municipioNombre = getLocationValue(municipio);
  const localidad = getLocationValue(item.localidad);
  const tieneMunicipio = Boolean(municipioNombre);
  const tieneLocalidad = Boolean(localidad);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(item.id);
    }
  };

  return (
    <article
      className="popular-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="popular-thumb">
        <img
          src={item.imagen || "https://placehold.co/600x400?text=Sin+imagen"}
          alt={item.nombre}
          onError={(event) => {
            event.target.src = "https://placehold.co/600x400?text=Sin+imagen";
          }}
        />
        <span className={`popular-badge ${getCategoryClass(item.categoria)}`}>
          {getCategoryLabel(item.categoria)}
        </span>
      </div>
      <div className="popular-content">
        <h3 className="popular-name">{item.nombre}</h3>
        {(tieneMunicipio || tieneLocalidad) && (
          <div
            className={`popular-location-container ${tieneMunicipio && tieneLocalidad ? "has-both-locations" : ""}`}
          >
            {tieneMunicipio && (
              <span className="popular-location-value">{municipioNombre}</span>
            )}
            {tieneMunicipio && tieneLocalidad && (
              <span
                className="popular-location-separator"
                aria-hidden="true"
              >
                ·
              </span>
            )}
            {tieneLocalidad && (
              <span className="popular-location-value">{localidad}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
