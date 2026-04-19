// ---------------------------------------------------------------------------
// Login — green background, 3-step: phone → name → OTP (6 boxes)
// ---------------------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../src/constants/theme';
import { requestOtp, verifyOtp } from '../src/api/auth';
import { useAuth } from '../src/context/AuthContext';
import KudiLocLogo from '../src/components/KudiLocLogo';

type Step = 'phone' | 'name' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onLoginSuccess, loginAsDemo } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const fullPhone = `+244${phone.replace(/\s/g, '').replace(/^0+/, '')}`;
  const cleanPhone = phone.replace(/\s/g, '').replace(/^0+/, '');
  const isValidPhone = /^[9]\d{8}$/.test(cleanPhone);
  const otpCode = otp.join('');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePhoneContinue = () => {
    if (!isValidPhone) { setError('Número de telefone inválido.'); return; }
    setError('');
    setStep('name');
  };

  const handleNameContinue = async () => {
    if (!agreed) { setError('Tens de aceitar os termos para continuar.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await requestOtp(fullPhone);
      setCountdown(res.expiresInSeconds ?? 300);
    } catch {
      // API unavailable — still show OTP screen so the demo code 123456 works
      setCountdown(300);
    } finally {
      setLoading(false);
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (next.every(Boolean)) {
      // auto-submit
      submitOtp(next.join(''));
    }
  };

  const handleOtpKeyPress = (e: { nativeEvent: { key: string } }, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const submitOtp = async (code: string) => {
    // Demo shortcut — any phone + 123456 logs in as demo
    if (code === '123456') {
      loginAsDemo(name);
      router.replace('/(tabs)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const auth = await verifyOtp(fullPhone, code, name || undefined);
      onLoginSuccess(auth);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Código inválido ou expirado.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setOtp(['', '', '', '', '', '']);
    try {
      const res = await requestOtp(fullPhone);
      setCountdown(res.expiresInSeconds ?? 300);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'otp') { setStep('name'); setOtp(['', '', '', '', '', '']); }
    else if (step === 'name') setStep('phone');
    else router.back();
    setError('');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Back button */}
        {step !== 'phone' && (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <KudiLocLogo size="sm" color={Colors.white} />
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Step: phone */}
          {/* ---------------------------------------------------------------- */}
          {step === 'phone' && (
            <>
              <Text style={styles.title}>Bem-vindo à KudiLoc</Text>
              <Text style={styles.subtitle}>Introduz o teu número para continuar.</Text>

              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+244</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9XX XXX XXX"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={12}
                  autoFocus
                  selectionColor={Colors.white}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (!isValidPhone || loading) && styles.btnDisabled]}
                onPress={handlePhoneContinue}
                disabled={!isValidPhone || loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.primaryMedium} />
                  : <Text style={styles.btnText}>Continuar</Text>}
              </TouchableOpacity>

              <Text style={styles.hint}>Vamos enviar um código de verificação por SMS</Text>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Step: name */}
          {/* ---------------------------------------------------------------- */}
          {step === 'name' && (
            <>
              <Text style={styles.title}>Como te chamas?</Text>
              <Text style={styles.subtitle}>O teu nome aparece no teu perfil e ranking.</Text>

              <TextInput
                style={styles.textInput}
                placeholder="Nome completo"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                selectionColor={Colors.white}
              />

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                </View>
                <Text style={styles.checkLabel}>
                  Li e concordo com os{' '}
                  <Text style={styles.checkLink}>Termos de Serviço</Text>
                  {' '}e a{' '}
                  <Text style={styles.checkLink}>Política de Privacidade</Text>
                </Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (!agreed || loading) && styles.btnDisabled]}
                onPress={handleNameContinue}
                disabled={!agreed || loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.primaryMedium} />
                  : <Text style={styles.btnText}>Continuar</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Step: otp */}
          {/* ---------------------------------------------------------------- */}
          {step === 'otp' && (
            <>
              <Text style={styles.title}>Introduz o código.</Text>
              <Text style={styles.subtitle}>
                Enviámos um código de 6 dígitos para {fullPhone}.
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { otpRefs.current[i] = r; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, i)}
                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectionColor={Colors.primaryMedium}
                  />
                ))}
              </View>

              {countdown > 0 ? (
                <Text style={styles.countdown}>Reenviar código em {mm}:{ss}</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>Reenviar código</Text>
                </TouchableOpacity>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Colors.white} />
                  <Text style={styles.loadingText}>A verificar...</Text>
                </View>
              )}

            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.primaryMedium,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  scroll: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },

  // Typography
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: FontSize.md * 1.5,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  prefixBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  prefixText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.lg,
    color: Colors.white,
  },

  // Generic text input
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },

  // Terms checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: Colors.white,
  },
  checkLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: FontSize.sm * 1.5,
  },
  checkLink: {
    color: Colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 46,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: Radius.md,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countdown: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resendText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: Spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.md,
  },
  // Primary button
  btn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: Colors.primaryMedium,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Error
  errorText: {
    color: '#FFD0C8',
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

});
