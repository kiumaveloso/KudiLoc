// ---------------------------------------------------------------------------
// Full-screen loading indicator
// ---------------------------------------------------------------------------

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { FontSize, Spacing } from '../constants/theme';
import pt from '../constants/strings';
import KudiLocLogo from './KudiLocLogo';
import { LOGO_GREEN } from './KudiLocLogo';

const BG = '#0D1B2A';

interface Props {
  message?: string;
}

export default function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.container}>
      <KudiLocLogo size="lg" color={LOGO_GREEN} />
      <ActivityIndicator size="large" color={LOGO_GREEN} style={styles.spinner} />
      <Text style={styles.text}>{message ?? pt.loading}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  spinner: {
    marginTop: Spacing.xl,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: 'rgba(61,190,122,0.6)',
  },
});
