// ---------------------------------------------------------------------------
// Empty state placeholder with icon, title, and optional action button
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'alert-circle-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={Colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
