import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

// Fix iconos default de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapView({ patrimonios }) {
  const navigate = useNavigate();

  const truncateText = (text = "", max = 90) => {
    if (typeof text !== "string") return "";
    return text.length <= max ? text : text.slice(0, max).trimEnd() + "...";
  };

  const getCircleColor = (categoria) => {
    switch (categoria) {
      case "material":
        return "#e74c3c";
      case "inmaterial":
        return "#3498db";
      case "biocultural":
        return "#27ae60";
      default:
        return "#8e44ad";
    }
  };

  return (
    <MapContainer center={[29.0729, -110.9559]} zoom={7}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors, &copy; Carto'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      />

      {patrimonios.map((item) => (
        <CircleMarker
          key={item.id}
          center={[item.lat, item.lng]}
          radius={7}
          className={`patrimonio-dot ${item.categoria}`}
          pathOptions={{
            color: "#ffffff",
            fillColor: getCircleColor(item.categoria),
            fillOpacity: 0.95,
            weight: 2,
          }}
        >
          <Popup className="patrimonio-popup">
            {item.imagen && (
              <img
                src={item.imagen}
                alt={item.nombre}
                className="popup-thumb"
                loading="lazy"
              />
            )}
            <strong>{item.nombre}</strong>
            <p className="popup-desc">{truncateText(item.descripcion)}</p>
            <button className="popup-cta" onClick={() => navigate(`/patrimonio/${item.id}`)}>
              Ver detalles
            </button>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export default MapView;