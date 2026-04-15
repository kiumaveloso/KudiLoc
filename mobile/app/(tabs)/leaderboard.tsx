// ---------------------------------------------------------------------------
// Leaderboard tab -- top contributors ranked by reputation
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../src/constants/theme';
import pt from '../../src/constants/strings';
import { getLeaderboard } from '../../src/api/user';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';
import type { LeaderboardEntry } from '../../src/types';

// Medal icons for top 3
const MEDALS: Record<number, { icon: string; color: string }> = {
  0: { icon: 'medal', color: '#FFD700' },
  1: { icon: 'medal', color: '#C0C0C0' },
  2: { icon: 'medal', color: '#CD7F32' },
};

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const data = await getLeaderboard(50);
      setEntries(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const renderItem = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => {
      const medal = MEDALS[index];
      return (
        <View style={styles.row}>
          <View style={styles.rank}>
            {medal ? (
              <Ionicons
                name={medal.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={medal.color}
              />
            ) : (
              <Text style={styles.rankText}>{index + 1}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name ?? (item.userId ? `Utilizador ${item.userId.slice(-4)}` : 'Utilizador')}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>
                <Ionicons
                  name="document-text-outline"
                  size={12}
                  color={Colors.textMuted}
                />{' '}
                {item.totalReports} {pt.reports}
              </Text>
              <Text style={styles.stat}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color={Colors.green}
                />{' '}
                {item.accurateReports}
              </Text>
            </View>
            {item.badges.length > 0 && (
              <View style={styles.badgeRow}>
                {item.badges.slice(0, 3).map((b) => (
                  <View key={b.id} style={styles.badge}>
                    <Text style={styles.badgeText}>{b.badgeType}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={styles.scoreCol}>
            <Text style={styles.scoreValue}>{item.reputationScore}</Text>
            <Text style={styles.scoreLabel}>pts</Text>
          </View>
        </View>
      );
    },
    [],
  );

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title={pt.error}
        actionLabel={pt.retry}
        onAction={fetchData}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{pt.leaderboardTitle}</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="Ainda sem contribuidores."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  rank: {
    width: 36,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.primaryLight + '33',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  scoreCol: {
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
