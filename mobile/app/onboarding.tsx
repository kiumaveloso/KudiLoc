// ---------------------------------------------------------------------------
// Onboarding — 3 animated screens shown only on first launch
// ---------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, FontSize, Radius } from '../src/constants/theme';
import { KudiPin } from '../src/components/KudiLocLogo';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'kudiloc_onboarding_done';

export async function markOnboardingDone(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } else {
      await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    }
  } catch { /* ignore */ }
}

export async function isOnboardingDone(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ONBOARDING_KEY) === '1';
    }
    return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === '1';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Screen data
// ---------------------------------------------------------------------------

const SCREENS = [
  {
    key: 'problem',
    pinColor: Colors.noCashGold,
    lines: [
      { text: 'Fila no ATM.', color: Colors.white },
      { text: 'Chegaste.', color: Colors.white },
      { text: 'Sem dinheiro.', color: Colors.noCashGold },
    ],
    description: 'Em Luanda, 1 em cada 4 ATMs está sem dinheiro neste momento.',
    buttonLabel: 'Continuar',
  },
  {
    key: 'solution',
    pinColor: 'rgba(255,255,255,0.85)',
    lines: [
      { text: 'A primeira rede de', color: Colors.white },
      { text: 'Informação de ATMs', color: Colors.white },
      { text: 'em Angola.', color: Colors.white },
    ],
    description:
      'Dados reais, gerados pela comunidade e verificados no terreno. Antes de saires de casa, já sabes.',
    buttonLabel: 'Continuar',
  },
  {
    key: 'cta',
    pinColor: null, // three pins — rendered separately
    lines: [
      { text: 'O teu bairro.', color: Colors.white },
      { text: 'Os teus ATMs.', color: Colors.white },
      { text: 'A tua comunidade.', color: Colors.white },
    ],
    description:
      'Cada reporte que fazes ajuda quem está perto de ti — e dá-te pontos para ganhar cashback.',
    buttonLabel: 'Ver ATMs Perto de Mim',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Pin animation
  const pinY = useRef(new Animated.Value(-30)).current;
  const pinOpacity = useRef(new Animated.Value(0)).current;

  // Text line animations (up to 3 lines)
  const lineAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Description + button
  const descAnim = useRef(new Animated.Value(0)).current;

  const runAnimations = () => {
    // Reset
    pinY.setValue(-30);
    pinOpacity.setValue(0);
    lineAnims.forEach((a) => a.setValue(0));
    descAnim.setValue(0);

    Animated.sequence([
      // Pin drops in
      Animated.parallel([
        Animated.spring(pinY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(pinOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Lines appear one by one
      Animated.stagger(200, lineAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 350, useNativeDriver: true })
      )),
      Animated.delay(150),
      // Description fades in
      Animated.timing(descAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    runAnimations();
  }, [step]);

  const handleNext = async () => {
    if (step < SCREENS.length - 1) {
      setStep(step + 1);
    } else {
      await markOnboardingDone();
      router.replace('/login');
    }
  };

  const handleSkip = async () => {
    await markOnboardingDone();
    router.replace('/login');
  };

  const screen = SCREENS[step];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Decorative dots pattern */}
      <View style={styles.dotsPattern} pointerEvents="none" />

      {/* Top bar */}
      <View style={styles.topBar}>
        {/* Progress dots */}
        <View style={styles.progressDots}>
          {SCREENS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>
        {step < SCREENS.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pin area */}
      <View style={styles.pinArea}>
        <Animated.View
          style={{
            opacity: pinOpacity,
            transform: [{ translateY: pinY }],
            alignItems: 'center',
          }}
        >
          {screen.key === 'cta' ? (
            <View style={styles.threePins}>
              <KudiPin color={Colors.offlineGrey} size={44} />
              <KudiPin color={Colors.noCashGold} size={56} />
              <KudiPin color="rgba(255,255,255,0.8)" size={44} />
            </View>
          ) : (
            <KudiPin color={screen.pinColor!} size={72} />
          )}
        </Animated.View>
      </View>

      {/* Text */}
      <View style={styles.textArea}>
        {screen.lines.map((line, i) => (
          <Animated.Text
            key={`${step}-${i}`}
            style={[styles.headline, { color: line.color, opacity: lineAnims[i] }]}
          >
            {line.text}
          </Animated.Text>
        ))}
        <Animated.Text style={[styles.description, { opacity: descAnim }]}>
          {screen.description}
        </Animated.Text>
      </View>

      {/* Button */}
      <Animated.View style={[styles.buttonWrap, { opacity: descAnim }]}>
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{screen.buttonLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryMedium,
    paddingHorizontal: Spacing.xxl,
  },
  dotsPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  progressDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 20,
    borderRadius: 4,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
    fontWeight: '500',
  },

  // Pin
  pinArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 180,
    marginTop: Spacing.xxl,
  },
  threePins: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.lg,
  },

  // Text
  textArea: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Spacing.xxl,
  },
  headline: {
    fontSize: FontSize.xxl + 2,
    fontWeight: '700',
    lineHeight: (FontSize.xxl + 2) * 1.2,
    marginBottom: 2,
  },
  description: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    marginTop: Spacing.lg,
    lineHeight: FontSize.md * 1.55,
  },

  // Button
  buttonWrap: {
    paddingBottom: Spacing.xxxl,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

