import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngExpression, LatLngTuple } from "leaflet";

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

const DEFAULT_POSITION: LatLngTuple = [30.2849, -97.7341]; // Austin, TX

const LocationMarker: React.FC<{
  value?: { lat: number; lng: number };
  onChange?: (coords: { lat: number; lng: number }) => void;
}> = ({ value, onChange }) => {
  useMapEvents({
    click(e) {
      onChange && onChange(e.latlng);
    },
  });
  return value ? <Marker position={[value.lat, value.lng] as LatLngTuple} /> : null;
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, height = "300px", width = "100%" }) => {
  const position: LatLngTuple = value ? [value.lat, value.lng] : DEFAULT_POSITION;
  
  return (
    <div style={{ height, width }} className="relative z-10">
      <MapContainer
        key={`${position[0]}-${position[1]}`}
        style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden" }}
        zoom={13}
        center={position}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
};

export default MapPicker; 