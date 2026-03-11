import React from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import moment from "moment";

const statusColors = {
  has_money: "#22C55E",
  no_money: "#EF4444",
  uncertain: "#F59E0B",
};

const connectDot = {
  online: "#22C55E",
  offline: "#6B7280",
  maintenance: "#F59E0B",
};

function createIcon(status, isOnline) {
  const color = statusColors[status] || statusColors.uncertain;
  const dot = connectDot[isOnline] || connectDot.online;
  const svg = `
    <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.35"/>
      </filter>
      <path d="M20 0C9.0 0 0 9.0 0 20c0 14 20 30 20 30s20-16 20-30C40 9.0 31 0 20 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="20" cy="20" r="9" fill="white" fill-opacity="0.96"/>
      <text x="20" y="25" text-anchor="middle" fill="${color}" font-size="13" font-weight="900" font-family="system-ui, sans-serif">₭</text>
      <circle cx="32" cy="8" r="5" fill="${dot}" stroke="white" stroke-width="1.5"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "custom-atm-marker",
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
}

export default function ATMMarker({ atm, onSelect }) {
  const icon = createIcon(atm.status, atm.is_online);

  return (
    <Marker
      position={[atm.latitude, atm.longitude]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(atm) }}
    />
  );
}