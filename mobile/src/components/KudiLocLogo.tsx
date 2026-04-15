// ---------------------------------------------------------------------------
// KudiLoc brand components
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

// ---------------------------------------------------------------------------
// KudiPin — teardrop location-pin shape with "K" inside
// ---------------------------------------------------------------------------

interface PinProps {
  color?: string;
  size?: number;
}

export function KudiPin({ color = Colors.primary, size = 48 }: PinProps) {
  const circle = size * 0.72;
  const point = size * 0.35;
  const letterSize = Math.round(circle * 0.46);

  return (
    <View style={{ width: circle, height: size, alignItems: 'center' }}>
      {/* Circle */}
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Text
          style={{
            color: Colors.white,
            fontWeight: '700',
            fontSize: letterSize,
            includeFontPadding: false,
          }}
        >
          K
        </Text>
      </View>
      {/* Triangle point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: circle * 0.22,
          borderRightWidth: circle * 0.22,
          borderTopWidth: point,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// KudiLocLogo — inline pin icon + "KudiLoc" text for headers / login
// ---------------------------------------------------------------------------

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function KudiLocLogo({ size = 'md', color = Colors.white }: LogoProps) {
  const pinSize = size === 'sm' ? 22 : size === 'lg' ? 48 : 32;
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;

  return (
    <View style={styles.row}>
      <KudiPin color={color === Colors.white ? 'rgba(255,255,255,0.9)' : color} size={pinSize} />
      <Text style={[styles.text, { fontSize, color }]}>KudiLoc</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// KudiMark — standalone ₭ for inline text use
// ---------------------------------------------------------------------------

export function KudiMark({ size = 28, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '800', color, lineHeight: size * 1.2 }}>
      ₭
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
