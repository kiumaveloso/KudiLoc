// ---------------------------------------------------------------------------
// Map tab — full-screen Mapbox map with ATM pins, unified search
// Search combines: Mapbox Geocoding (zones/addresses) + ATM API (specific ATMs)
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing, atmMarkerColor } from '../../src/constants/theme';
import { getNearbyATMs, searchATMs } from '../../src/api/atm';
import { useLocation } from '../../src/hooks/useLocation';
import { StatusLight } from '../../src/components/StatusLight';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/context/AuthContext';
import type { ATMDto, NearbyATMResult } from '../../src/types';

// ---------------------------------------------------------------------------
// Mapbox — conditionally loaded
// ---------------------------------------------------------------------------

let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  MapboxGL!.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');
} catch {
  // Not available in Expo Go
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

const DISTANCES = [
  { label: '500m', km: 0.5, zoom: 15 },
  { label: '1km',  km: 1,   zoom: 13 },
  { label: '5km',  km: 5,   zoom: 11 },
  { label: '10km', km: 10,  zoom: 10 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaceResult {
  type: 'place';
  id: string;
  name: string;
  subtitle: string;
  longitude: number;
  latitude: number;
  zoom: number;
}

interface ATMResult {
  type: 'atm';
  atm: ATMDto;
}

type SearchResult = PlaceResult | ATMResult;

// ---------------------------------------------------------------------------
// Geocoding helper
// ---------------------------------------------------------------------------

async function geocodeQuery(
  query: string,
  lng: number,
  lat: number,
): Promise<PlaceResult[]> {
  if (!MAPBOX_TOKEN) return [];
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?country=AO&proximity=${lng},${lat}` +
    `&types=place,locality,neighborhood,district,address,poi` +
    `&language=pt&limit=5` +
    `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.features ?? []).map((f: any) => {
    // Determine zoom based on place type
    const placeType: string = f.place_type?.[0] ?? 'place';
    const zoom =
      placeType === 'address' || placeType === 'poi' ? 16 :
      placeType === 'neighborhood' ? 14 :
      placeType === 'locality' ? 13 :
      placeType === 'district' ? 12 : 12;

    // Build subtitle from context (city, region, country)
    const ctx: string[] = (f.context ?? [])
      .map((c: any) => c.text)
      .filter(Boolean)
      .slice(0, 2);

    return {
      type: 'place' as const,
      id: f.id,
      name: f.text ?? f.place_name,
      subtitle: ctx.join(', ') || f.place_name,
      longitude: f.center[0],
      latitude: f.center[1],
      zoom,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const cameraRef = useRef<any>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [atms, setAtms] = useState<NearbyATMResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeDistance, setActiveDistance] = useState(1);

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBarHeight, setSearchBarHeight] = useState(44);

  const showDropdown = searchText.trim().length > 0;

  // ---------------------------------------------------------------------------
  // Fetch nearby ATMs
  // ---------------------------------------------------------------------------
  const fetchNearby = useCallback(async () => {
    if (location.loading) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getNearbyATMs(
        location.latitude,
        location.longitude,
        DISTANCES[activeDistance].km,
      );
      setAtms(res.atms ?? []);
    } catch (err: any) {
      setFetchError(err?.message ?? 'Erro ao carregar ATMs');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.loading, activeDistance]);

  useEffect(() => { fetchNearby(); }, [fetchNearby]);

  // ---------------------------------------------------------------------------
  // Unified search: geocoding + ATM API in parallel, debounced 400ms
  // ---------------------------------------------------------------------------
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [places, atmPage] = await Promise.allSettled([
          geocodeQuery(text.trim(), location.longitude, location.latitude),
          searchATMs(text.trim()),
        ]);

        const placeItems: SearchResult[] =
          places.status === 'fulfilled' ? places.value : [];

        const atmItems: SearchResult[] =
          atmPage.status === 'fulfilled'
            ? (atmPage.value.items ?? []).map((a: ATMDto) => ({ type: 'atm' as const, atm: a }))
            : [];

        setResults([...placeItems, ...atmItems]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setResults([]);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    Keyboard.dismiss();
    setSearchText('');
    setResults([]);
    cameraRef.current?.setCamera({
      centerCoordinate: [place.longitude, place.latitude],
      zoomLevel: place.zoom,
      animationMode: 'flyTo',
      animationDuration: 700,
    });
  };

  const handleSelectATM = (atm: ATMDto) => {
    Keyboard.dismiss();
    setSearchText('');
    setResults([]);
    cameraRef.current?.setCamera({
      centerCoordinate: [atm.location.longitude, atm.location.latitude],
      zoomLevel: 16,
      animationMode: 'flyTo',
      animationDuration: 700,
    });
  };

  const handleViewATMDetail = (atm: ATMDto) => {
    Keyboard.dismiss();
    setSearchText('');
    setResults([]);
    router.push(`/atm/${atm.id}`);
  };

  // ---------------------------------------------------------------------------
  // Distance chips
  // ---------------------------------------------------------------------------
  const handleDistanceChange = useCallback((index: number) => {
    setActiveDistance(index);
    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: DISTANCES[index].zoom,
      animationMode: 'flyTo',
      animationDuration: 600,
    });
  }, [location.latitude, location.longitude]);

  if (location.loading) return <LoadingScreen message="A obter localização..." />;

  const dropdownTop = insets.top + Spacing.md + searchBarHeight + Spacing.xs;
  const chipsTop    = insets.top + Spacing.md + searchBarHeight + Spacing.sm;

  const hasPlaces = results.some((r) => r.type === 'place');
  const hasAtms   = results.some((r) => r.type === 'atm');

  return (
    <View style={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* Full-screen Map */}
      {/* ------------------------------------------------------------------ */}
      {MapboxGL ? (
        <MapboxGL.MapView
          style={StyleSheet.absoluteFillObject}
          styleURL={MapboxGL.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
          onPress={() => { if (showDropdown) handleClearSearch(); }}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={DISTANCES[activeDistance].zoom}
            centerCoordinate={[location.longitude, location.latitude]}
            animationMode="flyTo"
            animationDuration={800}
          />
          <MapboxGL.UserLocation visible animated />

          {atms.map((atm) => {
            const color = atmMarkerColor(atm.status.operationalStatus, atm.status.hasCash);
            return (
              <MapboxGL.PointAnnotation
                key={atm.id}
                id={atm.id}
                coordinate={[atm.location.longitude, atm.location.latitude]}
                onSelected={() => router.push(`/atm/${atm.id}`)}
              >
                <View style={[styles.pin, { backgroundColor: color }]}>
                  <Text style={styles.pinText}>K</Text>
                </View>
                <MapboxGL.Callout title={`${atm.bankName} — ${atm.name}`} />
              </MapboxGL.PointAnnotation>
            );
          })}
        </MapboxGL.MapView>
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons name="map-outline" size={64} color={Colors.primaryLight} />
          <Text style={styles.mapFallbackText}>Mapa indisponível neste ambiente.</Text>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Search bar */}
      {/* ------------------------------------------------------------------ */}
      <View
        style={[styles.searchRow, {
          position: 'absolute',
          top: insets.top + Spacing.md,
          left: 0,
          right: 0,
          zIndex: 20,
        }]}
        onLayout={(e) => setSearchBarHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.searchBar}>
          {searchLoading
            ? <ActivityIndicator size="small" color={Colors.textMuted} />
            : <Ionicons name="search" size={16} color={Colors.textMuted} />}
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar zonas, endereços, bancos..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.circleBtn} onPress={fetchNearby}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Ionicons name="refresh" size={18} color={Colors.primary} />}
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Search results dropdown */}
      {/* ------------------------------------------------------------------ */}
      {showDropdown && (
        <View style={[styles.dropdown, { top: dropdownTop, zIndex: 19 }]}>
          {results.length === 0 && !searchLoading ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                Sem resultados para "{searchText}"
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
            >
              {/* ---- Zonas / Endereços ---- */}
              {hasPlaces && (
                <Text style={styles.dropdownSection}>ZONAS E ENDEREÇOS</Text>
              )}
              {results
                .filter((r): r is PlaceResult => r.type === 'place')
                .map((place, idx, arr) => (
                  <TouchableOpacity
                    key={place.id}
                    style={[
                      styles.dropdownItem,
                      (idx < arr.length - 1 || hasAtms) && styles.dropdownSep,
                    ]}
                    onPress={() => handleSelectPlace(place)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconWrap}>
                      <Ionicons name="location-outline" size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      {place.subtitle !== place.name && (
                        <Text style={styles.dropdownAddress} numberOfLines={1}>
                          {place.subtitle}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}

              {/* ---- ATMs ---- */}
              {hasAtms && (
                <Text style={styles.dropdownSection}>ATMs</Text>
              )}
              {results
                .filter((r): r is ATMResult => r.type === 'atm')
                .map(({ atm }, idx, arr) => (
                  <TouchableOpacity
                    key={atm.id}
                    style={[
                      styles.dropdownItem,
                      idx < arr.length - 1 && styles.dropdownSep,
                    ]}
                    onPress={() => handleSelectATM(atm)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownIconWrap}>
                      <View style={[
                        styles.dropdownDot,
                        { backgroundColor: atmMarkerColor(atm.status?.operationalStatus, atm.status?.hasCash) },
                      ]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownBank}>{atm.bankName}</Text>
                      <Text style={styles.dropdownName} numberOfLines={1}>{atm.name}</Text>
                      {(atm.address?.neighborhood || atm.address?.street) && (
                        <Text style={styles.dropdownAddress} numberOfLines={1}>
                          {[atm.address.neighborhood, atm.address.street].filter(Boolean).join(', ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleViewATMDetail(atm)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ paddingLeft: Spacing.sm }}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Distance chips — hidden while dropdown is open */}
      {/* ------------------------------------------------------------------ */}
      {!showDropdown && (
        <View
          style={[styles.chipsRow, {
            position: 'absolute',
            top: chipsTop,
            left: 0,
            right: 0,
            zIndex: 10,
          }]}
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
        </View>
      )}

      {/* Error banner */}
      {fetchError && !showDropdown && (
        <View style={[styles.errorBanner, {
          position: 'absolute',
          top: chipsTop + 36 + Spacing.sm,
          left: Spacing.lg,
          right: Spacing.lg,
          zIndex: 10,
        }]} pointerEvents="none">
          <Ionicons name="alert-circle-outline" size={14} color={Colors.white} />
          <Text style={styles.errorBannerText}>{fetchError}</Text>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Admin FAB — Add ATM */}
      {/* ------------------------------------------------------------------ */}
      {isAdmin && !showDropdown && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 100 }]}
          onPress={() => router.push('/admin/add-atm')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Legend */}
      {/* ------------------------------------------------------------------ */}
      <View style={[styles.legend, { bottom: insets.bottom + 100 }]} pointerEvents="none">
        <LegendItem color={Colors.cashGreen}   label="Tem dinheiro" />
        <LegendItem color={Colors.noCashGold}  label="Sem dinheiro" />
        <LegendItem color={Colors.offlineGrey} label="Offline" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <StatusLight color={color} size={7} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '22',
    padding: Spacing.xxxl,
  },
  mapFallbackText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: 0,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg + 42 + Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownEmpty: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
  },
  dropdownEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  dropdownSection: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  dropdownSep: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownBank: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dropdownName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 1,
  },
  dropdownAddress: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D32F2F',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  errorBannerText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '500',
    flex: 1,
  },

  // Distance chips
  chipsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
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
  chipActive: { backgroundColor: Colors.primaryDark },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // ATM pin
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  pinText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 15,
  },

  // Admin FAB
  fab: {
    position: 'absolute',
    left: Spacing.lg,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },

  // Legend
  legend: {
    position: 'absolute',
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 5,
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
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
