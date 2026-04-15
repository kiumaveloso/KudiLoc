// ---------------------------------------------------------------------------
// Coloured badge showing ATM operational status or cash availability
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import pt from '../constants/strings';

interface Props {
  operationalStatus?: string;
  hasCash?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  operationalStatus,
  hasCash,
  size = 'md',
}: Props) {
  let label: string;
  let bg: string;
  let fg: string;

  const status = operationalStatus?.toLowerCase();

  if (status === 'offline') {
    label = pt.statusOffline;
    bg = Colors.offlineGrey + '22';
    fg = Colors.offlineGrey;
  } else if (status === 'maintenance') {
    label = pt.statusMaintenance;
    bg = Colors.amberLight;
    fg = Colors.amber;
  } else if (hasCash === true) {
    label = pt.hasCash;
    bg = Colors.cashGreen + '20';
    fg = Colors.cashGreen;
  } else if (hasCash === false) {
    label = pt.noCash;
    bg = Colors.noCashGold + '22';
    fg = Colors.noCashGold;
  } else {
    label = pt.unknown;
    bg = Colors.borderLight;
    fg = Colors.textMuted;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text
        style={[
          styles.label,
          { color: fg },
          isSmall && styles.labelSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs + 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});
