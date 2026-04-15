// ---------------------------------------------------------------------------
// Mapa tab — Mapbox map with K-shaped ATM pins, search bar, distance filters
// Web version (index.native.tsx handles iOS/Android)
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontSize,
  Radius,
  Spacing,
  atmMarkerColor,
} from '../../src/constants/theme';
import { getNearbyATMs } from '../../src/api/atm';
import { useLocation } from '../../src/hooks/useLocation';
import type { NearbyATMResult, NearbyResponse } from '../../src/types';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { StatusLight } from '../../src/components/StatusLight';

// Remove browser focus rings on search bar inputs
if (typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = 'input:focus{outline:none!important;box-shadow:none!important;}div:focus-within>*:focus{outline:none!important;}';
  document.head.appendChild(s);
}

mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

const DISTANCES = [
  { label: '500m', km: 0.5 },
  { label: '1km',  km: 1   },
  { label: '5km',  km: 5   },
  { label: '10km', km: 10  },
];

// K-shaped SVG pin for Mapbox markers
function createKPin(color: string, selected = false): HTMLElement {
  const scale = selected ? 1.25 : 1;
  const w = Math.round(32 * scale);
  const h = Math.round(42 * scale);
  const el = document.createElement('div');
  el.style.cssText = `width:${w}px;height:${h}px;cursor:pointer;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.35));transition:transform 0.15s ease;`;
  el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16C0 27 16 42 16 42C16 42 32 27 32 16C32 7.163 24.837 0 16 0Z" fill="${color}"/>
    <text x="16" y="18" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="13" font-weight="700" font-family="system-ui,-apple-system,sans-serif">K</text>
  </svg>`;
  return el;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ marker: mapboxgl.Marker; id: string }[]>([]);

  const [data, setData] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDistance, setActiveDistance] = useState(1);

  // ---------------------------------------------------------------------------
  // Init map
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [location.longitude, location.latitude],
      zoom: 13,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current.addControl(new mapboxgl.GeolocateControl({ trackUserLocation: false }), 'bottom-right');
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || location.loading) return;
    mapRef.current.flyTo({ center: [location.longitude, location.latitude], zoom: 13, duration: 800 });
    // Draw initial radius circle once map is ready
    const onLoad = () => drawRadiusCircle(location.longitude, location.latitude, DISTANCES[activeDistance].km);
    if (mapRef.current.isStyleLoaded()) {
      onLoad();
    } else {
      mapRef.current.once('load', onLoad);
    }
  }, [location.latitude, location.longitude, location.loading]);

  // ---------------------------------------------------------------------------
  // Fetch ATMs
  // ---------------------------------------------------------------------------
  const fetchNearby = useCallback(async () => {
    if (location.loading) return;
    setError(false);
    setLoading(true);
    try {
      const res = await getNearbyATMs(location.latitude, location.longitude, DISTANCES[activeDistance].km);
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.loading, activeDistance]);

  useEffect(() => { if (!location.loading) fetchNearby(); }, [fetchNearby, location.loading]);

  // ---------------------------------------------------------------------------
  // Markers
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapRef.current || !data) return;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];

    data.atms.forEach((atm) => {
      const color = atmMarkerColor(atm.status.operationalStatus, atm.status.hasCash);
      const el = createKPin(color, atm.id === selectedId);

      el.addEventListener('click', () => {
        router.push(`/atm/${atm.id}`);
      });

      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false })
        .setHTML(`<div style="font-family:system-ui;padding:2px 4px"><strong style="font-size:13px">${atm.bankName}</strong><br/><span style="font-size:11px;color:#666">${atm.name}</span><br/><span style="font-size:11px;color:${color};font-weight:600">${atm.status.hasCash ? 'Tem dinheiro' : 'Sem dinheiro'}</span></div>`);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([atm.location.longitude, atm.location.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push({ marker, id: atm.id });
    });
  }, [data, selectedId]);

  // Draw/update radius circle on map
  const drawRadiusCircle = useCallback((lng: number, lat: number, radiusKm: number) => {
    const map = mapRef.current;
    if (!map) return;
    // Generate circle polygon points
    const points = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = (radiusKm / 111.32) / Math.cos((lat * Math.PI) / 180) * Math.cos(angle);
      const dy = (radiusKm / 110.574) * Math.sin(angle);
      coords.push([lng + dx, lat + dy]);
    }
    const geojson = {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
        properties: {},
      }],
    };
    if (map.getSource('radius-circle')) {
      (map.getSource('radius-circle') as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('radius-circle', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: { 'fill-color': Colors.cashGreen, 'fill-opacity': 0.07 },
      });
      map.addLayer({
        id: 'radius-border',
        type: 'line',
        source: 'radius-circle',
        paint: { 'line-color': Colors.cashGreen, 'line-width': 1.5, 'line-opacity': 0.4 },
      });
    }
  }, []);

  const handleDistanceChange = (idx: number) => {
    setActiveDistance(idx);
    // Zoom map to fit the selected radius
    if (!location.loading && mapRef.current) {
      const km = DISTANCES[idx].km;
      drawRadiusCircle(location.longitude, location.latitude, km);
      const deg = km / 111.32;
      mapRef.current.fitBounds(
        [
          [location.longitude - deg * 1.5, location.latitude - deg * 1.5],
          [location.longitude + deg * 1.5, location.latitude + deg * 1.5],
        ],
        { padding: 40, duration: 600 },
      );
    }
  };

  const flyTo = (atm: NearbyATMResult) => {
    setSelectedId(atm.id);
    mapRef.current?.flyTo({ center: [atm.location.longitude, atm.location.latitude], zoom: 15, duration: 500 });
  };

  const filteredAtms = (data?.atms ?? []).filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.bankName?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q) || a.address?.street?.toLowerCase().includes(q);
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ------------------------------------------------------------------ */}
      {/* Overlay controls */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Search bar + dropdown */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchCard}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Procurar localização ou multicaixa"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {search.trim().length > 0 && filteredAtms.length > 0 && (
            <ScrollView style={styles.searchDropdown} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {filteredAtms.slice(0, 6).map((atm) => (
                <TouchableOpacity
                  key={atm.id}
                  style={styles.searchDropdownItem}
                  onPress={() => { setSearch(''); router.push(`/atm/${atm.id}`); }}
                >
                  <Ionicons name="location-outline" size={14} color={Colors.primary} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchDropdownBank} numberOfLines={1}>{atm.bankName}</Text>
                    <Text style={styles.searchDropdownAddr} numberOfLines={1}>{atm.address?.street || atm.name}</Text>
                  </View>
                  <Text style={styles.searchDropdownDist}>
                    {atm.distanceKm != null ? (atm.distanceKm < 1 ? `${Math.round(atm.distanceKm * 1000)}m` : `${atm.distanceKm.toFixed(1)}km`) : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {search.trim().length > 0 && filteredAtms.length === 0 && !loading && (
            <View style={styles.searchDropdown}>
              <Text style={styles.searchDropdownEmpty}>Nenhum resultado</Text>
            </View>
          )}
        </View>

        {/* Distance chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
        >
          {DISTANCES.map((d, i) => (
            <TouchableOpacity
              key={d.label}
              style={[styles.chip, i === activeDistance && styles.chipActive]}
              onPress={() => handleDistanceChange(i)}
            >
              <Text style={[styles.chipText, i === activeDistance && styles.chipTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Legend — top right */}
        <View style={styles.legend}>
          <LegendItem color={Colors.cashGreen} label="Tem dinheiro" />
          <LegendItem color={Colors.noCashGold} label="Sem dinheiro" />
          <LegendItem color={Colors.offlineGrey} label="Offline" />
        </View>

        {/* Right-side buttons */}
        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => {
              if (!location.loading) {
                mapRef.current?.flyTo({ center: [location.longitude, location.latitude], zoom: 14, duration: 600 });
              }
            }}
          >
            <Ionicons name="locate-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading / error */}
        {loading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Map */}
      {/* ------------------------------------------------------------------ */}
      {/* @ts-ignore */}
      <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <StatusLight color={color} size={8} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    pointerEvents: 'box-none' as any,
  },

  // Search wrapper (holds bar + dropdown)
  searchWrapper: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    zIndex: 100,
  },

  // Search
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 2,
    outlineWidth: 0,
  } as any,

  // Search dropdown
  searchDropdown: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginTop: 4,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  searchDropdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchDropdownBank: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  searchDropdownAddr: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  searchDropdownDist: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  searchDropdownEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: Spacing.lg,
  },

  // Distance chips
  chipsScroll: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: Colors.primaryDark,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Legend
  legend: {
    position: 'absolute',
    top: 130,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Right buttons
  rightButtons: {
    position: 'absolute',
    right: Spacing.lg,
    top: 240,
    gap: Spacing.sm,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // Loading
  loadingBadge: {
    position: 'absolute',
    top: 130,
    left: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
