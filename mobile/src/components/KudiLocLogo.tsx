// ---------------------------------------------------------------------------
// KudiLoc brand components — logo matches app icon (green pin + ₭ symbol)
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

// Brand green that matches the logo exactly
export const LOGO_GREEN = '#3DBE7A';

// ---------------------------------------------------------------------------
// LogoK — the stylised "₭" mark used inside every pin / logo
// ---------------------------------------------------------------------------

function LogoK({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  // The logo K has a horizontal crossbar — ₭ (Lao Kip U+20AD) is the closest
  // Unicode match: a K with two strokes, which reads as the Kwanza variant here.
  return (
    <Text
      style={{
        color,
        fontWeight: '800',
        fontSize: size,
        includeFontPadding: false,
        lineHeight: size * 1.1,
        letterSpacing: -0.5,
      }}
    >
      ₭
    </Text>
  );
}

// ---------------------------------------------------------------------------
// KudiPin — teardrop location-pin for lists / cards
// ---------------------------------------------------------------------------

interface PinProps {
  color?: string;
  size?: number;
}

export function KudiPin({ color = LOGO_GREEN, size = 48 }: PinProps) {
  const circle = size * 0.72;
  const point  = size * 0.35;

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
          shadowOpacity: 0.22,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <LogoK size={Math.round(circle * 0.48)} />
      </View>
      {/* Triangle point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth:  circle * 0.22,
          borderRightWidth: circle * 0.22,
          borderTopWidth:   point,
          borderLeftColor:  'transparent',
          borderRightColor: 'transparent',
          borderTopColor:   color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ATMMapPin — optimised for Mapbox MarkerView
// Explicit fixed dimensions + white border + shadow for map contrast
// Color changes: green (cash) · red (no cash) · grey (offline)
// ---------------------------------------------------------------------------

const PIN_CIRCLE = 38;
const PIN_POINT_H = 13;
const PIN_W = PIN_CIRCLE;
const PIN_H = PIN_CIRCLE + PIN_POINT_H;

export function ATMMapPin({ color = LOGO_GREEN }: { color?: string }) {
  return (
    <View
      style={{
        width:  PIN_W,
        height: PIN_H,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
      }}
    >
      {/* Circle head */}
      <View
        style={{
          width:  PIN_CIRCLE,
          height: PIN_CIRCLE,
          borderRadius: PIN_CIRCLE / 2,
          backgroundColor: color,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2.5,
          borderColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.28,
          shadowRadius: 5,
          elevation: 7,
        }}
      >
        <LogoK size={17} />
      </View>
      {/* Triangle point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth:  8,
          borderRightWidth: 8,
          borderTopWidth:   PIN_POINT_H,
          borderLeftColor:  'transparent',
          borderRightColor: 'transparent',
          borderTopColor:   color,
          marginTop: -1,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// KudiLocLogo — pin + "KudiLoc" text for headers / loading screen
// ---------------------------------------------------------------------------

interface LogoProps {
  size?:  'sm' | 'md' | 'lg';
  color?: string;
}

export default function KudiLocLogo({ size = 'md', color = Colors.white }: LogoProps) {
  const pinSize  = size === 'sm' ? 22 : size === 'lg' ? 52 : 34;
  const fontSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;
  const pinColor = color === Colors.white ? 'rgba(255,255,255,0.9)' : color;

  return (
    <View style={styles.row}>
      <KudiPin color={pinColor} size={pinSize} />
      <Text style={[styles.text, { fontSize, color }]}>KudiLoc</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// KudiMark — standalone ₭ for inline text use
// ---------------------------------------------------------------------------

export function KudiMark({ size = 28, color = LOGO_GREEN }: { size?: number; color?: string }) {
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
