// ---------------------------------------------------------------------------
// ATM Detail screen — matches video design exactly
// Mini map, 2×2 info cards, IR ATÉ LÁ button, report bottom sheet, comunidade
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Animated,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../../src/constants/theme';
import { StatusLight } from '../../../src/components/StatusLight';
import { KudiPin } from '../../../src/components/KudiLocLogo';
import {
  getATMById,
  getATMComments,
  addComment,
  submitStatusReport,
  deleteATM,
} from '../../../src/api/atm';
import { removeLocalAtm, getLocalAtms, updateLocalAtmStatus } from '../../../src/store/localAtms';
import { useAuth } from '../../../src/context/AuthContext';
import { useFavourites } from '../../../src/context/FavouritesContext';
import LoadingScreen from '../../../src/components/LoadingScreen';
import type { ATMDto, CommentDto, CreateStatusReport } from '../../../src/types';

const IS_DEMO = (userId?: string) => userId === 'demo-user-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}

function reliabilityColor(score: number): string {
  if (score >= 80) return Colors.cashGreen;
  if (score >= 50) return Colors.noCashGold;
  return Colors.red;
}

function pinColor(atm: ATMDto): string {
  const s = atm.status.operationalStatus?.toLowerCase();
  if (s === 'offline') return Colors.offlineGrey;
  if (s === 'maintenance') return Colors.noCashGold;
  if (atm.status.hasCash === false) return '#D73A3A';
  return Colors.cashGreen;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ATMDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isFav, toggle: toggleFav } = useFavourites();

  const [atm, setAtm] = useState<ATMDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Report modal state
  const [reportVisible, setReportVisible] = useState(false);
  const [reportCash, setReportCash] = useState<'has' | 'no' | 'offline' | null>(null);
  const [reportPaper, setReportPaper] = useState<boolean | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!id) return;
    try {
      const [atmData, commentsData] = await Promise.all([
        getATMById(id),
        getATMComments(id).catch(() => []),
      ]);
      setAtm(atmData);
      setComments(commentsData);
    } catch {
      // For locally-added demo ATMs, fall back to the local store
      const local = getLocalAtms().find((a) => a.id === id);
      if (local) {
        setAtm({
          id: local.id,
          name: local.name,
          bankName: local.bankName,
          location: local.location,
          coordinates: [local.location.longitude, local.location.latitude],
          hasMoney: local.status.hasCash,
          hasPaper: local.status.hasPaper,
          status: local.status,
          address: local.address,
          supportedServices: [],
          photoUrls: [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !id) return;
    const authorId = user?.id ?? 'anon';
    const authorName = user?.name ?? 'Anónimo';
    setSubmitting(true);
    // Demo users — add comment locally without hitting the API
    if (!user || IS_DEMO(user.id)) {
      const mock: CommentDto = {
        id: `local-${Date.now()}`,
        atmId: id,
        userId: authorId,
        userName: authorName,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
        helpfulCount: 0,
      };
      setComments((prev) => [mock, ...prev]);
      setCommentText('');
      setSubmitting(false);
      return;
    }
    try {
      const c = await addComment(id, authorId, authorName, commentText.trim());
      setComments((prev) => [c, ...prev]);
      setCommentText('');
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setReportCash(null);
    setReportPaper(null);
    setReportSuccess(false);
    setReportVisible(true);
  };

  const applyReportToLocalState = (cash: 'has' | 'no' | 'offline') => {
    setAtm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: {
          ...prev.status,
          hasCash: cash === 'has',
          hasMoney: cash === 'has',
          operationalStatus: cash === 'offline' ? 'Offline' : 'Operational',
          lastVerified: new Date().toISOString(),
        },
      };
    });
  };

  const handleSubmitReport = async (cashOverride?: 'has' | 'no' | 'offline') => {
    const cash = cashOverride ?? reportCash;
    if (!cash || !id) return;
    setReportSubmitting(true);
    try {
      if (!user || IS_DEMO(user.id)) {
        // Demo mode — update local state and the store (so map/list also reflect it)
        applyReportToLocalState(cash);
        if (id) updateLocalAtmStatus(id, cash);
        setReportSuccess(true);
        setTimeout(() => { setReportVisible(false); }, 2000);
        return;
      }
      const report: CreateStatusReport = {
        atmId: id,
        userId: user?.id,
        hasCash: cash === 'has',
        hasPaper: reportPaper ?? undefined,
        operationalStatus: cash === 'offline' ? 'Offline' : 'Operational',
      };
      await submitStatusReport(report);
      // Apply optimistic update immediately, then confirm from server
      applyReportToLocalState(cash);
      setReportSuccess(true);
      setTimeout(() => { setReportVisible(false); fetchAll(); }, 2000);
    } catch { /* silent */ } finally {
      setReportSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'Admin';

  const handleDelete = () => {
    Alert.alert(
      'Eliminar ATM',
      `Tens a certeza que queres eliminar "${atm?.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              if (IS_DEMO(user?.id)) {
                removeLocalAtm(id);
                router.back();
                return;
              }
              await deleteATM(id);
              router.back();
            } catch (e: any) {
              Alert.alert('Erro', e?.message ?? 'Não foi possível eliminar o ATM.');
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!atm) return;
    try {
      await Share.share({ message: `${atm.bankName} — ${atm.address.street || atm.name}` });
    } catch { /* silent */ }
  };

  const handleNavigate = () => {
    if (!atm) return;
    const [lng, lat] = atm.coordinates;
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  if (loading) return <LoadingScreen />;
  if (!atm) return (
    <View style={styles.centered}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.errorText}>ATM não encontrado</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );

  const color = pinColor(atm);
  const isOffline = atm.status.operationalStatus?.toLowerCase() === 'offline';
  const hasCash = atm.status.hasCash;
  const statusLabel = isOffline ? 'Fora de serviço' : hasCash ? 'Disponível' : 'Sem dinheiro';
  const statusColor = isOffline ? Colors.offlineGrey : hasCash ? Colors.cashGreen : '#D73A3A';
  const rel = atm.status.reliabilityScore;
  const lastUpdate = atm.status.lastVerified ? timeAgo(atm.status.lastVerified) : '—';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ---------------------------------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Multicaixa</Text>
          {isAdmin ? (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.red} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* ---------------------------------------------------------------- */}
          {/* Mini map placeholder */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.miniMap}>
            <KudiPin color={color} size={52} />
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* ATM identity */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              <Text style={styles.bankName}>{atm.bankName}</Text>
              {atm.status.operationalStatus?.toLowerCase() !== 'offline' && (
                <View style={styles.hoursBadge}>
                  <Text style={styles.hoursText}>24h</Text>
                </View>
              )}
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.addressText} numberOfLines={1}>
                {atm.address.street || atm.name}
                {atm.address.neighborhood ? `, ${atm.address.neighborhood}` : ''}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
                <StatusLight color={statusColor} size={7} />
                <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              <Text style={styles.distanceText}>
                {/* distance shown if available from list nav, not on detail */}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* 2×2 info cards */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.infoGrid}>
            {/* DINHEIRO */}
            <View style={[styles.infoCard, { backgroundColor: hasCash ? '#F0FDF4' : isOffline ? Colors.borderLight : '#FFF5F5' }]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="cash-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.infoCardLabel}>DINHEIRO</Text>
              </View>
              <Text style={[styles.infoCardValue, { color: hasCash ? Colors.cashGreen : isOffline ? Colors.textMuted : '#D73A3A' }]}>
                {isOffline ? 'Indisponível' : hasCash ? 'Tem dinheiro' : 'Sem dinheiro'}
              </Text>
            </View>

            {/* PAPEL */}
            <View style={[styles.infoCard, { backgroundColor: atm.status.hasPaper ? '#F0FDF4' : Colors.borderLight }]}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="receipt-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.infoCardLabel}>PAPEL</Text>
              </View>
              <Text style={[styles.infoCardValue, { color: atm.status.hasPaper ? Colors.cashGreen : Colors.textMuted }]}>
                {atm.status.hasPaper ? 'Tem papel' : 'Sem papel'}
              </Text>
            </View>

            {/* ÚLTIMA ATUALIZAÇÃO */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.infoCardLabel}>ÚLTIMA ATUALIZAÇÃO</Text>
              </View>
              <Text style={[styles.infoCardValue, { color: Colors.text }]}>{lastUpdate}</Text>
            </View>

            {/* CONFIANÇA */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="trending-up-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.infoCardLabel}>CONFIANÇA</Text>
              </View>
              <Text style={[styles.infoCardValue, { color: reliabilityColor(rel) }]}>{rel}%</Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* IR ATÉ LÁ button */}
          {/* ---------------------------------------------------------------- */}
          <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate} activeOpacity={0.85}>
            <Ionicons name="navigate" size={18} color={Colors.white} />
            <Text style={styles.navigateBtnText}>IR ATÉ LÁ</Text>
          </TouchableOpacity>

          {/* ---------------------------------------------------------------- */}
          {/* Action row: Reportar | Guardar | Partilhar */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleOpenReport}>
              <Ionicons name="flag-outline" size={18} color={Colors.text} />
              <Text style={styles.actionBtnText}>Reportar</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => id && toggleFav(id)}>
              <Ionicons name={id && isFav(id) ? 'star' : 'star-outline'} size={18} color={id && isFav(id) ? Colors.favourite : Colors.text} />
              <Text style={[styles.actionBtnText, id && isFav(id) && { color: Colors.favourite }]}>Favorito</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.text} />
              <Text style={styles.actionBtnText}>Partilhar</Text>
            </TouchableOpacity>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Sobre estes dados */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Sobre estes dados</Text>
            <Text style={styles.aboutBody}>
              A disponibilidade do dinheiro em tempo real é reportada pelos utilizadores e verificada pela nossa rede. O nível de confiança indica a fiabilidade da informação com base no número e recência dos reports.
            </Text>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* COMUNIDADE */}
          {/* ---------------------------------------------------------------- */}
          <View style={styles.communitySection}>
            <Text style={styles.communitySectionTitle}>COMUNIDADE</Text>

            {comments.length === 0 ? (
              <Text style={styles.noComments}>Sem comentários ainda.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentCard}>
                  <View style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{(c.userName || 'U').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.commentMeta}>
                      <Text style={styles.commentUser}>{c.userName}</Text>
                      <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.commentBody}>{c.text}</Text>
                </View>
              ))
            )}

            {/* Add comment */}
            <View style={styles.addCommentRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Adicionar comentário..."
                placeholderTextColor={Colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
              >
                <Ionicons name="send" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Report bottom sheet modal */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        visible={reportVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReportVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            {reportSuccess ? (
              /* Success state */
              <View style={styles.successState}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={32} color={Colors.cashGreen} />
                </View>
                <Text style={styles.successTitle}>Obrigado pela atualização!</Text>
                <Text style={styles.successSub}>A tua contribuição ajuda outros utilizadores.</Text>
                <Text style={styles.successPoints}>+10 pontos</Text>
              </View>
            ) : (
              <>
                {/* Sheet header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Como estava este ATM?</Text>
                  <TouchableOpacity onPress={() => setReportVisible(false)} style={styles.sheetClose}>
                    <Ionicons name="close" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>

                {/* DINHEIRO */}
                <Text style={styles.sheetSectionLabel}>DINHEIRO</Text>
                <View style={styles.sheetToggleRow}>
                  <TouchableOpacity
                    style={[styles.sheetToggle, reportCash === 'has' && styles.sheetToggleActiveGreen]}
                    onPress={() => setReportCash('has')}
                  >
                    <Ionicons name="checkmark" size={16} color={reportCash === 'has' ? Colors.cashGreen : Colors.textMuted} />
                    <Text style={[styles.sheetToggleText, reportCash === 'has' && { color: Colors.cashGreen }]}>Tem dinheiro</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetToggle, reportCash === 'no' && styles.sheetToggleActiveRed]}
                    onPress={() => setReportCash('no')}
                  >
                    <Ionicons name="ban-outline" size={16} color={reportCash === 'no' ? '#D73A3A' : Colors.textMuted} />
                    <Text style={[styles.sheetToggleText, reportCash === 'no' && { color: '#D73A3A' }]}>Sem dinheiro</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.sheetToggleFull, reportCash === 'offline' && styles.sheetToggleActiveAmber]}
                  onPress={() => { setReportCash('offline'); handleSubmitReport('offline'); }}
                >
                  <Ionicons name="warning-outline" size={16} color={reportCash === 'offline' ? Colors.noCashGold : Colors.textMuted} />
                  <Text style={[styles.sheetToggleText, reportCash === 'offline' && { color: Colors.noCashGold }]}>Fora de serviço</Text>
                </TouchableOpacity>

                {/* PAPEL */}
                <Text style={[styles.sheetSectionLabel, { marginTop: Spacing.lg }]}>PAPEL</Text>
                <View style={styles.sheetToggleRow}>
                  <TouchableOpacity
                    style={[styles.sheetToggle, reportPaper === true && styles.sheetToggleActiveGreen]}
                    onPress={() => setReportPaper(true)}
                  >
                    <Ionicons name="receipt-outline" size={16} color={reportPaper === true ? Colors.cashGreen : Colors.textMuted} />
                    <Text style={[styles.sheetToggleText, reportPaper === true && { color: Colors.cashGreen }]}>Tem papel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetToggle, reportPaper === false && styles.sheetToggleActiveRed]}
                    onPress={() => setReportPaper(false)}
                  >
                    <Ionicons name="receipt-outline" size={16} color={reportPaper === false ? '#D73A3A' : Colors.textMuted} />
                    <Text style={[styles.sheetToggleText, reportPaper === false && { color: '#D73A3A' }]}>Sem papel</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit / Ignorar */}
                {reportCash && (
                  <TouchableOpacity
                    style={[styles.sheetSubmitBtn, reportSubmitting && { opacity: 0.6 }]}
                    onPress={handleSubmitReport}
                    disabled={reportSubmitting}
                  >
                    <Text style={styles.sheetSubmitText}>Enviar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setReportVisible(false)} style={styles.ignoreBtn}>
                  <Text style={styles.ignoreText}>Ignorar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  errorText: { fontSize: FontSize.md, color: Colors.textMuted },
  backLink: { marginTop: Spacing.sm },
  backLinkText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },

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
  deleteBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },

  scroll: { paddingBottom: 40 },

  // Mini map
  miniMap: {
    height: 160,
    backgroundColor: '#E8EEE8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ATM identity
  identity: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: 6,
  },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  hoursBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  hoursText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: FontSize.xs + 1, fontWeight: '600' },
  distanceText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },

  // 2×2 info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  infoCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  infoCardValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // IR ATÉ LÁ
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.text,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  navigateBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md + 2,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  actionDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },

  // About card
  aboutCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  aboutTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  aboutBody: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.8,
  },

  // Community
  communitySection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  communitySectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  noComments: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing.md,
  },
  commentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  commentMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentUser: { fontSize: FontSize.xs + 1, fontWeight: '600', color: Colors.text },
  commentTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  commentBody: { fontSize: FontSize.sm, color: Colors.text, paddingLeft: 28 + Spacing.sm },

  // Add comment
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },

  // Modal backdrop + sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  sheetToggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sheetToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sheetToggleFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sheetToggleActiveGreen: {
    borderColor: Colors.cashGreen,
    backgroundColor: '#F0FDF4',
  },
  sheetToggleActiveRed: {
    borderColor: '#D73A3A',
    backgroundColor: '#FFF5F5',
  },
  sheetToggleActiveAmber: {
    borderColor: Colors.noCashGold,
    backgroundColor: '#FFFBEB',
  },
  sheetToggleText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sheetSubmitBtn: {
    backgroundColor: Colors.text,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sheetSubmitText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  ignoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  ignoreText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Success state
  successState: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  successSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successPoints: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.cashGreen,
  },
});
