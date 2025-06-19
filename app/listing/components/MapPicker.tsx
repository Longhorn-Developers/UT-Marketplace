import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Default marker icon fix for leaflet in React
import "leaflet/dist/leaflet.css";
if (typeof window !== "undefined" && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });
}

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  width?: string;
}

const DEFAULT_POSITION = { lat: 30.2849, lng: -97.7341 }; // Austin, TX

const LocationMarker: React.FC<{
  value?: { lat: number; lng: number };
  onChange?: (coords: { lat: number; lng: number }) => void;
}> = ({ value, onChange }) => {
  useMapEvents({
    click(e) {
      onChange && onChange(e.latlng);
    },
  });
  return value ? <Marker position={value} /> : null;
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, height = "300px", width = "100%" }) => {
  return (
    <div style={{ height, width }}>
      <MapContainer
        center={value || DEFAULT_POSITION}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
};

export default MapPicker; 