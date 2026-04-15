// ---------------------------------------------------------------------------
// Profile & Definições — dark green card, gamification levels
// ---------------------------------------------------------------------------

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  FontSize,
  Radius,
  Spacing,
  getLevelInfo,
  LEVELS,
} from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import LoadingScreen from '../../src/components/LoadingScreen';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loading, user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') { logout(); return; }
    Alert.alert('Terminar Sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.notAuthContainer}>
          <Ionicons name="person-circle-outline" size={72} color={Colors.textMuted} />
          <Text style={styles.notAuthTitle}>Sem sessão iniciada</Text>
          <Text style={styles.notAuthSub}>Inicia sessão para ver o teu perfil e contribuir.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>Iniciar Sessão</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const points = user.reputationScore;
  const level = getLevelInfo(points);
  const nextLevel = LEVELS.find((l) => l.minPoints > points);
  const progress = nextLevel
    ? (points - level.minPoints) / (nextLevel.minPoints - level.minPoints)
    : 1;
  const pointsToNext = nextLevel ? nextLevel.minPoints - points : 0;

  const initial = (user.name ?? 'U').charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ---------------------------------------------------------------- */}
        {/* Dark green card */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.userName}>{user.name ?? `Utilizador ${user.id.slice(-4)}`}</Text>
              {/* Level badge */}
              <View style={[styles.levelBadge, { borderColor: level.color + '80' }]}>
                <Ionicons name={level.icon as any} size={12} color={level.color} />
                <Text style={[styles.levelText, { color: level.color }]}>{level.name}</Text>
              </View>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatItem label="PONTOS" value={String(points)} />
            <View style={styles.statDivider} />
            <StatItem label="CONTRIBUIÇÕES" value={String(user.totalReports)} />
            <View style={styles.statDivider} />
            <StatItem label="RANKING" value={`#${user.accurateReports > 0 ? Math.ceil(1000 / (user.accurateReports + 1)) : '—'}`} />
          </View>

          {/* Progress bar */}
          {nextLevel && (
            <View style={styles.progressWrap}>
              <Text style={styles.progressLabel}>Próximo nível</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
              </View>
              <Text style={styles.progressCaption}>
                {points}/{nextLevel.minPoints}
              </Text>
            </View>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* This week + achievements */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.twoCol}>
          <View style={[styles.smallCard, { flex: 1 }]}>
            <Text style={styles.smallCardLabel}>ESTA SEMANA</Text>
            <Text style={styles.smallCardValue}>{user.totalReports}</Text>
            <Text style={styles.smallCardSub}>contribuições</Text>
          </View>
          <View style={[styles.smallCard, { flex: 1 }]}>
            <Text style={styles.smallCardLabel}>CONQUISTAS</Text>
            <Text style={styles.smallCardValue}>
              {user.accurateReports}/{Math.max(user.totalReports, 10)}
            </Text>
            <Text style={styles.smallCardSub}>distinções ganhas</Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Next level card */}
        {/* ---------------------------------------------------------------- */}
        {nextLevel && (
          <View style={styles.nextLevelCard}>
            <View style={styles.nextLevelLeft}>
              <Ionicons name={nextLevel.icon as any} size={24} color={nextLevel.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLevelLabel}>Próximo nível</Text>
              <Text style={styles.nextLevelText}>
                Faltam{' '}
                <Text style={styles.nextLevelHighlight}>{pointsToNext} pontos</Text>
                {' '}para te tornares{' '}
                <Text style={styles.nextLevelHighlight}>{nextLevel.name}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* INFORMAÇÃO */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionLabel}>INFORMAÇÃO</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="help-circle-outline" label="Ajuda e Suporte" />
          <View style={styles.infoSep} />
          <InfoRow icon="document-text-outline" label="Política de Privacidade" />
          <View style={styles.infoSep} />
          <InfoRow icon="document-outline" label="Termos de Serviço" />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.poweredBy}>Powered by Kudivila</Text>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },

  scroll: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },

  // Profile card (dark green)
  profileCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.noCashGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  nameCol: { flex: 1, gap: 6 },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  levelText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: Spacing.lg,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Progress
  progressWrap: { gap: 6 },
  progressLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.cashGreen,
    borderRadius: 3,
  },
  progressCaption: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.4)',
    alignSelf: 'flex-end',
  },

  // Two column cards
  twoCol: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  smallCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  smallCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  smallCardValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  smallCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Next level card
  nextLevelCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  nextLevelLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextLevelLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  nextLevelText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: FontSize.sm * 1.5,
  },
  nextLevelHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Info section
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  infoLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  infoSep: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg + 18 + Spacing.md,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.redLight,
    marginTop: Spacing.sm,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.red,
  },

  // Footer
  poweredBy: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Not authenticated
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  notAuthTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  notAuthSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
