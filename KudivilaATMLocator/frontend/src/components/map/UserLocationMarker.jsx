import React, { useEffect, useState } from "react";
import { Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";

const userIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;
    background:#3B82F6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(59,130,246,0.25);
  "></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function UserLocationMarker({ onLocation }) {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        setPosition(latlng);
        setAccuracy(pos.coords.accuracy);
        if (onLocation) onLocation(latlng);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Center once on first fix
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15);
      },
      () => {}
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!position) return null;

  return (
    <>
      <Circle
        center={position}
        radius={accuracy}
        pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.08, weight: 1 }}
      />
      <Marker position={position} icon={userIcon} zIndexOffset={1000} />
    </>
  );
}