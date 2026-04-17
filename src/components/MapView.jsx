import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import L from "leaflet";
import { useEffect, useState } from "react";
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

function MarkerCluster({ patrimonios, navigate, getCircleColor, truncateText, interactive }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: interactive,
      spiderfyOnMaxZoom: interactive,
      disableClusteringAtZoom: 13,
      maxClusterRadius: 45,
    });

    patrimonios.forEach((item) => {
      const circle = L.circleMarker([item.lat, item.lng], {
        radius: 9,
        color: "#fff",
        fillColor: getCircleColor(item.categoria),
        fillOpacity: 0.95,
        weight: 2,
        interactive,
      });

      if (interactive) {
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
        title.textContent = item.nombre;
        popupContent.appendChild(title);
        
        const desc = document.createElement("p");
        desc.className = "popup-desc";
        desc.textContent = truncateText(item.descripcion);
        popupContent.appendChild(desc);

        const button = document.createElement("button");
        button.className = "popup-cta";
        button.textContent = "Ver detalles";
        button.onclick = () => navigate(`/patrimonio/${item.id}`);
        popupContent.appendChild(button);

        circle.bindPopup(popupContent);
      }

      clusterGroup.addLayer(circle);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, patrimonios, navigate, getCircleColor, truncateText, interactive]);

  return null;
}

function LocationButton() {
  const map = useMap();
  const [userLocation, setUserLocation] = useState(null);
  const [locationMarker, setLocationMarker] = useState(null);

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está soportada por este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLatLng = [latitude, longitude];

        // Centrar el mapa en la ubicación del usuario
        map.setView(userLatLng, 15);

        // Remover marcador anterior si existe
        if (locationMarker) {
          map.removeLayer(locationMarker);
        }

        // Crear nuevo marcador/círculo azul para la ubicación del usuario
        const userCircle = L.circle(userLatLng, {
          color: '#007bff',
          fillColor: '#007bff',
          fillOpacity: 0.3,
          radius: 50, // Radio de 50 metros
          weight: 3
        }).addTo(map);

        // Agregar popup al círculo
        userCircle.bindPopup("Tu ubicación actual").openPopup();

        setLocationMarker(userCircle);
        setUserLocation(userLatLng);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        let errorMessage = "No se pudo obtener tu ubicación.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor, permite el acceso a tu ubicación.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado para obtener la ubicación.";
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  };

  // Limpiar marcador al desmontar
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
        onClick={handleLocationClick}
        title="Mostrar mi ubicación"
        type="button"
      >
        📍
      </button>
    </div>
  );
}

function MapView({ patrimonios, center = [29.0729, -110.9559], zoom = 7, interactive = true }) {
  const navigate = useNavigate();

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
      />
      {interactive && <LocationButton />}
    </MapContainer>
  );
}

export default MapView;