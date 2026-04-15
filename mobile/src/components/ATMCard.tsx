// ---------------------------------------------------------------------------
// Card showing an ATM in a list (nearby list / search results)
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import pt from '../constants/strings';
import StatusBadge from './StatusBadge';
import type { NearbyATMResult } from '../types';

interface Props {
  atm: NearbyATMResult;
  onPress: () => void;
}

export default function ATMCard({ atm, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.bankRow}>
          <Ionicons
            name="business-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.bankName} numberOfLines={1}>
            {atm.bankName}
          </Text>
        </View>
        <StatusBadge
          operationalStatus={atm.status.operationalStatus}
          hasCash={atm.status.hasCash}
          size="sm"
        />
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {atm.name}
      </Text>

      {atm.address.street ? (
        <Text style={styles.address} numberOfLines={1}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />{' '}
          {atm.address.street}
          {atm.address.neighborhood ? `, ${atm.address.neighborhood}` : ''}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.metric}>
          <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
          <Text style={styles.metricText}>
            {atm.distanceKm != null ? atm.distanceKm.toFixed(1) : '—'} {pt.kmAway}
          </Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="walk-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metricText}>
            {atm.estimatedWalkingTime != null ? `~${atm.estimatedWalkingTime}` : '—'} {pt.minWalk}
          </Text>
        </View>
        {atm.status.totalReports > 0 && (
          <View style={styles.metric}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color={Colors.textMuted}
            />
            <Text style={styles.metricText}>
              {atm.status.totalReports} {pt.reports}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  bankName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  address: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
