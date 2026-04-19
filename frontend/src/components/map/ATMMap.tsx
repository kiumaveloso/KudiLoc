// ---------------------------------------------------------------------------
// Mapbox GL JS map component – renders ATM markers with status colors.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { NearbyATMResult } from '../../types';
import { getStatusColor, getStatusLabel } from '../../utils/format';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

interface Props {
  atms: NearbyATMResult[];
  userLat: number;
  userLng: number;
  selectedATMId?: string | null;
  onSelectATM: (id: string) => void;
}

export default function ATMMap({ atms, userLat, userLng, selectedATMId, onSelectATM }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLng, userLat],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'bottom-right',
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLng, userLat]);
    } else {
      const el = document.createElement('div');
      el.className = 'user-marker';
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLng, userLat])
        .addTo(map);
    }
  }, [userLat, userLng]);

  // Update ATM markers
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    atms.forEach((atm) => {
      const color = getStatusColor(
        atm.status.hasMoney,
        undefined,
        atm.status.operationalStatus,
      );
      const label = getStatusLabel(
        atm.status.hasMoney,
        undefined,
        atm.status.operationalStatus,
      );

      // Custom marker element
      const el = document.createElement('div');
      el.className = 'atm-marker';
      if (atm.id === selectedATMId) el.classList.add('atm-marker-selected');
      el.style.backgroundColor = color;
      el.title = `${atm.bankName} - ${label}`;

      // Inner dot for the bank initial
      const inner = document.createElement('span');
      inner.className = 'atm-marker-label';
      inner.textContent = atm.bankName[0];
      el.appendChild(inner);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectATM(atm.id);
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="map-popup">
            <strong>${atm.bankName}</strong>
            <p>${atm.name}</p>
            <span style="color:${color}">${label}</span>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([atm.location.longitude, atm.location.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [atms, selectedATMId, onSelectATM]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Fly to selected ATM
  useEffect(() => {
    if (!selectedATMId || !mapRef.current) return;
    const atm = atms.find((a) => a.id === selectedATMId);
    if (atm) {
      mapRef.current.flyTo({
        center: [atm.location.longitude, atm.location.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [selectedATMId, atms]);

  return <div ref={containerRef} className="map-container" />;
}
