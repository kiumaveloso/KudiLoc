// ---------------------------------------------------------------------------
// Full-screen loading indicator
// ---------------------------------------------------------------------------

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/theme';
import pt from '../constants/strings';
import KudiLocLogo from './KudiLocLogo';

interface Props {
  message?: string;
}

export default function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.container}>
      <KudiLocLogo size="lg" color={Colors.white} />
      <ActivityIndicator size="large" color={Colors.white} style={styles.spinner} />
      <Text style={styles.text}>{message ?? pt.loading}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryMedium,
  },
  spinner: {
    marginTop: Spacing.xl,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
});
