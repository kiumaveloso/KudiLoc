// ---------------------------------------------------------------------------
// Root layout — providers + onboarding gate
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { Colors } from '../src/constants/theme';
import { isOnboardingDone } from './onboarding';

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const done = await isOnboardingDone();
      const inOnboarding = segments[0] === 'onboarding';
      if (!done && !inOnboarding) {
        router.replace('/onboarding');
      }
      setChecked(true);
    })();
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <OnboardingGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            />
          </OnboardingGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
