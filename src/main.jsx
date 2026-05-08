import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/base/reset.css";
import "./styles/base/variables.css";
import "./styles/base/global.css";
import "./styles/layouts/MainLayout.css";
import "./styles/components/MapView.css";
import "leaflet/dist/leaflet.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
