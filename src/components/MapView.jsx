import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

  return (
    <MapContainer center={[29.0729, -110.9559]} zoom={7}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {patrimonios.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lng]}>
          <Popup>
            <strong>{item.nombre}</strong>
            <br />
            {item.descripcion}
            <br />
            <button className="popup-cta" onClick={() => navigate(`/patrimonio/${item.id}`)}>
              Ver detalles
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapView;