import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";

import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  value?: { lat: number; lng: number };
  onChange?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  width?: string;
}

const DEFAULT_POSITION: LatLngTuple = [30.2849, -97.7341]; // Austin, TX
const PIN_ICON = L.divIcon({
  className: "ut-map-pin",
  html: "<div class='ut-map-pin__dot'></div>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LocationMarker: React.FC<{
  value?: { lat: number; lng: number };
  onChange?: (coords: { lat: number; lng: number }) => void;
}> = ({ value, onChange }) => {
  useMapEvents({
    click(e) {
      onChange && onChange(e.latlng);
    },
  });
  return value ? (
    <Marker position={[value.lat, value.lng] as LatLngTuple} icon={PIN_ICON} interactive={false} />
  ) : null;
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, height = "300px", width = "100%" }) => {
  const position: LatLngTuple = value ? [value.lat, value.lng] : DEFAULT_POSITION;
  const isEditable = Boolean(onChange);
  const zoom = value ? 14 : 13;
  
  return (
    <div style={{ height, width }} className="relative z-10">
      <MapContainer
        key={`${position[0]}-${position[1]}`}
        className="ut-map"
        style={{ height: "100%", width: "100%", background: "#f8fafc" }}
        zoom={zoom}
        center={position}
        zoomControl={isEditable}
        scrollWheelZoom={isEditable}
        dragging
        doubleClickZoom
        keyboard={isEditable}
        minZoom={11}
        maxZoom={18}
        preferCanvas
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <LocationMarker value={value} onChange={onChange} />
      </MapContainer>
    </div>
  );
};

export default MapPicker; 
