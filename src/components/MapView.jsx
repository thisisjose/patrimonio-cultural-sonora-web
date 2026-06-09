import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const parseUbicaciones = (ubicaciones) => {
  if (!ubicaciones) return [];
  if (typeof ubicaciones === "string") {
    try {
      const parsed = JSON.parse(ubicaciones);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(ubicaciones) ? ubicaciones : [];
};

const getItemLocations = (item) => {
  const raw = parseUbicaciones(item.ubicaciones);

  if (Array.isArray(raw) && raw.length > 0) {
    const principal = raw.find((ubi) =>
      ubi?.es_principal === true ||
      ubi?.es_principal === "true" ||
      ubi?.es_principal === 1 ||
      ubi?.es_principal === "1"
    );
    const chosen = principal || raw[0];

    const lat = chosen.latitud ?? chosen.lat ?? null;
    const lng = chosen.longitud ?? chosen.lng ?? null;
    const label = chosen.nombre_punto || chosen.nombre || chosen.label || "";

    if (lat != null && lng != null) {
      return [{ lat, lng, label, data: chosen }];
    }
  }

  const lat = item.latitud ?? item.lat ?? null;
  const lng = item.longitud ?? item.lng ?? null;
  return lat != null && lng != null ? [{ lat, lng, label: "", data: item }] : [];
};

function MarkerCluster({ patrimonios, navigate, getCircleColor, truncateText, interactive, getDetailPath }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: interactive,
      spiderfyOnMaxZoom: interactive,
      disableClusteringAtZoom: 13,
      maxClusterRadius: 45,
      spiderLegPolylineOptions: { opacity: 0, weight: 0 },
    });

    patrimonios.forEach((item) => {
      const locations = getItemLocations(item);
      locations.forEach((location) => {
        const circle = L.circleMarker([location.lat, location.lng], {
          radius: 9,
          color: "#fff",
          fillColor: getCircleColor(item.categoria),
          fillOpacity: 0.95,
          weight: 2,
          interactive,
        });

        if (interactive) {
          const markerTitle = item.nombre;
          const detailPath = getDetailPath(item.id);

          const popupContent = document.createElement("div");
          popupContent.className = "patrimonio-popup";

          if (item.imagen) {
            const img = document.createElement("img");
            img.src = item.imagen;
            img.alt = item.nombre;
            img.className = "popup-thumb";
            img.onerror = () => {
              img.style.display = "none";
            };
            popupContent.appendChild(img);
          }

          const title = document.createElement("strong");
          title.textContent = markerTitle;
          popupContent.appendChild(title);

          const desc = document.createElement("p");
          desc.className = "popup-desc";
          desc.textContent = item.descripcion
            ? truncateText(item.descripcion, 70)
            : "Sin descripción disponible.";
          popupContent.appendChild(desc);

          const button = document.createElement("button");
          button.className = "popup-cta";
          button.textContent = "Ver detalles";
          button.onclick = () => navigate(detailPath);
          popupContent.appendChild(button);

          circle.bindPopup(popupContent);
        }

        clusterGroup.addLayer(circle);
      });
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, patrimonios, navigate, getCircleColor, truncateText, interactive, getDetailPath]);

  return null;
}

function MapControls({ center, zoom }) {
  const map = useMap();
  const [locationMarker, setLocationMarker] = useState(null);

  const handleCenterClick = () => {
    map.setView(center, zoom);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por este navegador.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLatLng = [latitude, longitude];

        map.setView(userLatLng, 16);

        if (locationMarker) {
          map.removeLayer(locationMarker);
        }

        const userCircle = L.circle(userLatLng, {
          color: '#007bff',
          fillColor: '#007bff',
          fillOpacity: 0.3,
          radius: 150,
          weight: 2
        }).addTo(map);

        userCircle.bindPopup("Tu ubicación actual").openPopup();

        setLocationMarker(userCircle);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        alert("No se pudo obtener tu ubicación actual.");
      },
      options
    );
  };

  useEffect(() => {
    return () => {
      if (locationMarker) {
        map.removeLayer(locationMarker);
      }
    };
  }, [locationMarker, map]);

  return (
    <div className="location-button-container">
      <button
        className="location-button"
        onClick={handleCenterClick}
        title="Centrar mapa"
        type="button"
      >
        <span>🎯</span>
        <span>Centrar mapa</span>
      </button>
      <button
        className="location-button"
        onClick={handleLocationClick}
        title="Mostrar mi ubicación"
        type="button"
      >
        <span>📍</span>
        <span>Mi ubicación</span>
      </button>
    </div>
  );
}

function MapView({ patrimonios, center = [29.0729, -110.9559], zoom = 7, interactive = true }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const isAdminRoute = location.pathname.startsWith("/admin");

  const getDetailPath = (id) => {
    return isAdminRoute ? `/admin/patrimonio/${id}` : `/patrimonio/${id}`;
  };

  const truncateText = (text = "", max = 90) => {
    if (typeof text !== "string") return "";
    return text.length <= max ? text : text.slice(0, max).trimEnd() + "...";
  };

  const getCircleColor = (categoria) => {
    switch (categoria?.toLowerCase()) {
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
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors, &copy; Carto'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      />
      <MarkerCluster
        patrimonios={patrimonios}
        navigate={navigate}
        getCircleColor={getCircleColor}
        truncateText={truncateText}
        interactive={interactive}
        getDetailPath={getDetailPath} 
      />
      {interactive && <MapControls center={center} zoom={zoom} />}
    </MapContainer>
  );
}

export default MapView;