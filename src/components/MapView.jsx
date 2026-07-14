import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { normalizeCategoryKey } from "../utils/categoryUtils";
import slugify from "../utils/slugify";
import DOMPurify from 'dompurify';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SONORA_BOUNDS = [
  [26.9, -113.8],
  [32.0, -109.3],
];

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

// ---------- ELIMINADA la función sanitizeHtml ----------

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
          const detailPath = getDetailPath(item);

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

          // ---------- USO DE DOMPurify CON CONFIGURACIÓN ----------
          desc.innerHTML = item.descripcion
            ? DOMPurify.sanitize(item.descripcion, {
                ADD_TAGS: ['blockquote', 'cite', 'font'],
                ADD_ATTR: ['style', 'class', 'color'],
                FORBID_TAGS: ['script', 'style', 'iframe'],
              })
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
    map.fitBounds(SONORA_BOUNDS, { padding: [40, 40], maxZoom: 8 });
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
        <span></span>
        <span>Centrar mapa</span>
      </button>
      <button
        className="location-button"
        onClick={handleLocationClick}
        title="Mostrar mi ubicación"
        type="button"
      >
        <span></span>
        <span>Mi ubicación</span>
      </button>
    </div>
  );
}

function MapView({ patrimonios, center = [29.0729, -110.9559], zoom = 7, interactive = true, municipios = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const getMunicipioNameForItem = (item) => {
    if (!item) return null;
    if (item.municipio && typeof item.municipio === "string") {
      const value = item.municipio.trim();
      return value || null;
    }
    if (item.municipio && typeof item.municipio === "object") {
      return item.municipio.nombre?.trim() || item.municipio.nombre_corto?.trim() || null;
    }
    if (item.municipioNombre) {
      const value = String(item.municipioNombre).trim();
      return value || null;
    }
    if (item.municipio_nombre) {
      const value = String(item.municipio_nombre).trim();
      return value || null;
    }
    if (item.municipioId && Array.isArray(municipios)) {
      const m = municipios.find((m) => String(m.id) === String(item.municipioId));
      if (m) return m.nombre?.trim() || null;
    }
    return null;
  };

  const getDetailPath = (item) => {
    const municipio = getMunicipioNameForItem(item);
    const patrimonioSlug = slugify(item.nombre);
    const municipioSlug = municipio ? `/${slugify(municipio)}` : "";
    const adminPrefix = isAdminRoute ? "/admin" : "";
    return `${adminPrefix}${municipioSlug}/${patrimonioSlug}`;
  };

  const truncateText = (text = "", max = 90) => {
    if (typeof text !== "string") return "";
    return text.length <= max ? text : text.slice(0, max).trimEnd() + "...";
  };

  const getCircleColor = (categoria) => {
    const normalized = normalizeCategoryKey(categoria);
    switch (normalized) {
      case "material":
        return "#e74c3c";
      case "inmaterial":
        return "#3498db";
      case "natural":
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