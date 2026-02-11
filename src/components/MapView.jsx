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

function MapView() {
  const navigate = useNavigate();

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
    <MapContainer
      center={[29.0729, -110.9559]}
      zoom={7}
      style={{ height: "100%", width: "100%", borderRadius: "8px" }}
    >
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
            <button
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#1a5f3e",
                color: "white",
                cursor: "pointer",
              }}
              onClick={() => navigate(`/patrimonio/${item.id}`)}
            >
              Ver detalles
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapView;
