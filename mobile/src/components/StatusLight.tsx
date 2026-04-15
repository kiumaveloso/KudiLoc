import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

interface Props {
  color: string;
  size?: number;
}

/**
 * Glowing status indicator — looks like a small LED light.
 * Pulses softly on web/native using an opacity animation on the outer glow ring.
 */
export function StatusLight({ color, size = 10 }: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4,  duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const glowSize = size * 2.2;

  return (
    <View style={{ width: glowSize, height: glowSize, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow ring */}
      <Animated.View
        style={{
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: color,
          opacity: pulse,
          ...(Platform.OS === 'web'
            ? { filter: `blur(${size * 0.9}px)` } as any
            : { shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: size }),
        }}
      />
      {/* Core dot */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          ...(Platform.OS !== 'web' && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: size * 0.6,
            elevation: 4,
          }),
        }}
      />
    </View>
  );
}
