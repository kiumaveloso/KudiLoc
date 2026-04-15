// ---------------------------------------------------------------------------
// Map tab — Mapbox map with ATM markers, distance chips, slide-up panel
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing, atmMarkerColor } from '../../src/constants/theme';
import { getNearbyATMs, searchATMs } from '../../src/api/atm';
import { useLocation } from '../../src/hooks/useLocation';
import ATMCard from '../../src/components/ATMCard';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';
import { StatusLight } from '../../src/components/StatusLight';
import type { ATMDto, NearbyATMResult, NearbyResponse } from '../../src/types';

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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_COLLAPSED = SCREEN_HEIGHT * 0.35;
const PANEL_EXPANDED  = SCREEN_HEIGHT * 0.70;

const DISTANCES = [
  { label: '500m', km: 0.5 },
  { label: '1km',  km: 1   },
  { label: '5km',  km: 5   },
  { label: '10km', km: 10  },
];

function adaptATMDto(a: ATMDto): NearbyATMResult {
  return {
    id: a.id,
    name: a.name,
    bankName: a.bankName,
    location: a.location,
    status: a.status,
    address: a.address,
    distanceKm: 0,
    estimatedWalkingTime: 0,
  };
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();

  const [data, setData] = useState<NearbyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDistance, setActiveDistance] = useState(1); // default 1km

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NearbyATMResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Panel height animation
  const panelHeight = useRef(new Animated.Value(PANEL_COLLAPSED)).current;
  const panelHeightValue = useRef(PANEL_COLLAPSED);
  panelHeight.addListener(({ value }) => { panelHeightValue.current = value; });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const newH = Math.max(180, Math.min(PANEL_EXPANDED, panelHeightValue.current - g.dy));
        panelHeight.setValue(newH);
      },
      onPanResponderRelease: (_, g) => {
        const target = g.dy < -30 ? PANEL_EXPANDED : PANEL_COLLAPSED;
        Animated.spring(panelHeight, { toValue: target, useNativeDriver: false, bounciness: 4 }).start();
      },
    }),
  ).current;

  const fetchNearby = useCallback(async () => {
    if (location.loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getNearbyATMs(location.latitude, location.longitude, DISTANCES[activeDistance].km);
      setData(res);
    } catch {
      setError('Erro ao carregar ATMs. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.loading, activeDistance]);

  useEffect(() => { fetchNearby(); }, [fetchNearby]);

  const handleDistanceChange = (idx: number) => {
    setActiveDistance(idx);
  };

  // Search with debounce
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchATMs(query.trim(), 1, 20);
        setSearchResults(res.items.map(adaptATMDto));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearching(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
  };

  const atms = data?.atms ?? [];
  const displayAtms: NearbyATMResult[] = searchResults ?? atms;
  const isSearchMode = searchQuery.trim().length > 0;

  const renderATMItem = useCallback(
    ({ item }: { item: NearbyATMResult }) => (
      <ATMCard atm={item} onPress={() => router.push(`/atm/${item.id}`)} />
    ),
    [router],
  );

  if (location.loading) return <LoadingScreen message="A obter localização..." />;

  return (
    <View style={styles.container}>
      {/* Map */}
      {MapboxGL ? (
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapboxGL.Camera
            zoomLevel={13}
            centerCoordinate={[location.longitude, location.latitude]}
            animationMode="flyTo"
            animationDuration={1000}
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
                <View style={[styles.marker, { backgroundColor: color }]}>
                  <Text style={styles.markerText}>K</Text>
                </View>
                <MapboxGL.Callout title={`${atm.bankName} — ${atm.name}`} />
              </MapboxGL.PointAnnotation>
            );
          })}
        </MapboxGL.MapView>
      ) : (
        <View style={[styles.mapFallback, { paddingTop: insets.top }]}>
          <Ionicons name="map-outline" size={64} color={Colors.primaryLight} />
          <Text style={styles.mapFallbackText}>Mapa indisponível neste ambiente.</Text>
        </View>
      )}

      {/* Overlay controls */}
      <View style={[styles.overlay, { top: insets.top + Spacing.md }]} pointerEvents="box-none">
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar ATMs, bancos..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {isSearchMode ? (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={fetchNearby} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="refresh" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Distance chips */}
        {!isSearchMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
            pointerEvents="box-none"
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
        )}

        {/* Legend */}
        {!isSearchMode && (
          <View style={styles.legend} pointerEvents="none">
            <LegendItem color={Colors.cashGreen}   label="Tem dinheiro" />
            <LegendItem color={Colors.noCashGold}  label="Sem dinheiro" />
            <LegendItem color={Colors.offlineGrey} label="Offline" />
          </View>
        )}
      </View>

      {/* Right-side buttons */}
      <View style={[styles.rightButtons, { top: insets.top + 140 }]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Slide-up panel */}
      <Animated.View style={[styles.panel, { height: panelHeight, paddingBottom: insets.bottom }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handle} />
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              {isSearchMode ? `"${searchQuery}"` : `ATMs — ${DISTANCES[activeDistance].label}`}
            </Text>
            {!isSearchMode && data && (
              <Text style={styles.panelCount}>{data.totalAtMsFound} encontrados</Text>
            )}
          </View>
        </View>

        {(loading && !isSearchMode) || searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
            {!isSearchMode && (
              <Text style={styles.loadingHint}>A carregar...{'\n'}(pode demorar ~30s na 1ª vez)</Text>
            )}
          </View>
        ) : error && !isSearchMode ? (
          <EmptyState icon="alert-circle-outline" title={error} actionLabel="Tentar novamente" onAction={fetchNearby} />
        ) : displayAtms.length === 0 ? (
          <EmptyState
            icon={isSearchMode ? 'search-outline' : 'location-outline'}
            title={isSearchMode ? 'Nenhum resultado' : 'Nenhum ATM encontrado'}
            actionLabel={isSearchMode ? undefined : 'Tentar novamente'}
            onAction={isSearchMode ? undefined : fetchNearby}
          />
        ) : (
          <FlatList
            data={displayAtms}
            keyExtractor={(item) => item.id}
            renderItem={renderATMItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
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
  map: { flex: 1 },
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

  // Overlay
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
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
    fontWeight: '700',
  },

  // Legend
  legend: {
    alignSelf: 'flex-end',
    marginRight: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Right-side floating buttons
  rightButtons: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
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

  // ATM marker
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Slide-up panel
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  dragArea: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  panelTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  panelCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
});
