// ---------------------------------------------------------------------------
// Lista tab — "Multicaixas Próximos" list with filter chips
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing, atmMarkerColor } from '../../src/constants/theme';
import { getNearbyATMs } from '../../src/api/atm';
import { getLocalAtms, removeLocalAtm } from '../../src/store/localAtms';
import { useLocation } from '../../src/hooks/useLocation';
import { KudiPin } from '../../src/components/KudiLocLogo';
import { StatusLight } from '../../src/components/StatusLight';
import { useFavourites } from '../../src/hooks/useFavourites';
import { useAuth } from '../../src/context/AuthContext';
import type { NearbyATMResult } from '../../src/types';

type FilterKey = 'todos' | 'disponivel' | '500m' | 'favoritos';

const FILTERS: { key: FilterKey; label: string; icon?: string }[] = [
  { key: 'todos',      label: 'Todos'      },
  { key: 'disponivel', label: 'Disponíveis' },
  { key: '500m',       label: '< 500m'     },
  { key: 'favoritos',  label: 'Favoritos', icon: 'star' },
];

export default function ListaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [atms, setAtms] = useState<NearbyATMResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('todos');
  const { isFav } = useFavourites();

  const fetchNearby = useCallback(async () => {
    if (location.loading) return;
    setError(false);
    try {
      const res = await getNearbyATMs(location.latitude, location.longitude, 10);
      // Merge real ATMs with any locally-added demo ATMs (dedup by id)
      const local = getLocalAtms();
      const realIds = new Set(res.atms.map((a) => a.id));
      const extras = local.filter((a) => !realIds.has(a.id));
      setAtms([...extras, ...res.atms]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location.latitude, location.longitude, location.loading]);

  useEffect(() => { if (!location.loading) fetchNearby(); }, [fetchNearby, location.loading]);

  // Refresh list when returning from add-atm or ATM detail (after delete)
  useFocusEffect(useCallback(() => {
    fetchNearby();
  }, [fetchNearby]));

  const filtered = atms.filter((a) => {
    if (filter === 'disponivel') return a.status.hasCash && a.status.operationalStatus?.toLowerCase() !== 'offline';
    if (filter === '500m') return (a.distanceKm ?? 99) <= 0.5;
    if (filter === 'favoritos') return isFav(a.id);
    return true;
  });

  const renderItem = ({ item }: { item: NearbyATMResult }) => {
    const color = atmMarkerColor(item.status.operationalStatus, item.status.hasCash);
    const hasCash = item.status.hasCash;
    const isOffline = item.status.operationalStatus?.toLowerCase() === 'offline';
    const distText = item.distanceKm != null
      ? item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)}m` : `${item.distanceKm.toFixed(1)}km`
      : '—';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/atm/${item.id}`)}
        activeOpacity={0.75}
      >
        {/* Pin icon */}
        <View style={styles.cardPin}>
          <KudiPin color={color} size={44} />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardBank} numberOfLines={1}>{item.bankName}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>
            {item.address?.street || item.name}
          </Text>
          <View style={styles.cardBadgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: isOffline ? Colors.offlineGrey + '22' : hasCash ? Colors.cashGreen + '20' : Colors.noCashGold + '22' }]}>
              <StatusLight color={color} size={7} />
              <Text style={[styles.statusText, { color }]}>
                {isOffline ? 'Fora de serviço' : hasCash ? 'Disponível' : 'Sem dinheiro'}
              </Text>
            </View>
            {item.status.reliabilityScore > 0 && (
              <View style={styles.reliabilityRow}>
                <Ionicons name="trending-up-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.reliabilityText}>{item.status.reliabilityScore}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Distance + chevron */}
        <View style={styles.cardRight}>
          <Text style={styles.distance}>{distText}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Multicaixas Próximos</Text>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => router.push('/(tabs)')}
        >
          <Ionicons name="map-outline" size={13} color={Colors.white} />
          <Text style={styles.mapBtnText}>Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            {f.icon && (
              <Ionicons
                name={f.icon as any}
                size={11}
                color={filter === f.key ? Colors.white : Colors.noCashGold}
              />
            )}
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      {!loading && (
        <Text style={styles.countText}>
          {filtered.length} {filtered.length === 1 ? 'multicaixa encontrado' : 'multicaixas encontrados'}
        </Text>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Erro ao carregar ATMs</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNearby}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhum ATM encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNearby(); }}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* Admin FAB — Add ATM */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 100 }]}
          onPress={() => router.push('/admin/add-atm')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Admin FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
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
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  mapBtnText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '600',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterText: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Count
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },

  // List
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPin: {
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardBank: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  cardAddress: {
    fontSize: FontSize.xs + 1,
    color: Colors.textMuted,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  reliabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reliabilityText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  cardRight: {
    alignItems: 'center',
    gap: 4,
    marginLeft: Spacing.sm,
  },
  distance: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  starBtn: {
    padding: 2,
  },

  // Empty / error
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xxxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
