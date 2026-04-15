// ---------------------------------------------------------------------------
// Tab navigator: Mapa | Lista | Ranking | Perfil
// ---------------------------------------------------------------------------

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          title: 'Lista',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
