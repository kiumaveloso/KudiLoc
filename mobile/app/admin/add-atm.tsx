// ---------------------------------------------------------------------------
// Add ATM — Admin only screen
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../src/constants/theme';
import { createATM } from '../../src/api/atm';
import { addLocalAtm } from '../../src/store/localAtms';
import { useLocation } from '../../src/hooks/useLocation';
import { useAuth } from '../../src/context/AuthContext';

const BANKS = [
  'BAI',
  'BFA',
  'BIC',
  'BPC',
  'Banco Millennium Atlântico',
  'Banco Económico',
  'BNI',
  'Banco de Comércio e Indústria',
  'BCA',
  'Banco SOL',
  'Standard Bank Angola',
  'Standard Chartered Angola',
  'Banco Keve',
  'Banco Valor',
  'Banco de Desenvolvimento de Angola (BDA)',
  'Banco de Investimento Rural (BIR)',
  'Banco Comercial do Huambo',
  'Banco Yetu',
  'Banco de Crédito do Sul (BCS)',
  'Novo Banco Angola',
  'Banco Prestígio',
];

export default function AddATMScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const location = useLocation();
  const { user } = useAuth();

  // Guard — should never render for non-admins, but just in case
  if (user?.role !== 'Admin') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.forbidden}>Acesso restrito a administradores.</Text>
      </View>
    );
  }

  const [name, setName]             = useState('');
  const [bankName, setBankName]     = useState('');
  const [showBanks, setShowBanks]   = useState(false);
  const [lat, setLat]               = useState('');
  const [lng, setLng]               = useState('');
  const [province, setProvince]     = useState('Luanda');
  const [municipality, setMunicipality] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet]         = useState('');
  const [landmark, setLandmark]     = useState('');
  const [loading, setLoading]       = useState(false);

  const useCurrentLocation = () => {
    if (!location.loading) {
      setLat(String(location.latitude));
      setLng(String(location.longitude));
    }
  };

  const isValid =
    name.trim().length > 0 &&
    bankName.trim().length > 0 &&
    lat.trim().length > 0 &&
    lng.trim().length > 0 &&
    !isNaN(Number(lat)) &&
    !isNaN(Number(lng));

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const created = await createATM({
        name: name.trim(),
        bankName: bankName.trim(),
        latitude: Number(lat),
        longitude: Number(lng),
        province: province.trim() || undefined,
        municipality: municipality.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        street: street.trim() || undefined,
        landmark: landmark.trim() || undefined,
      });

      // Add to local store for immediate visibility on map/list before next fetch
      addLocalAtm({
        id: created.id,
        name: created.name,
        bankName: created.bankName,
        location: {
          latitude: Number(lat),
          longitude: Number(lng),
          province: province.trim() || 'Luanda',
          municipality: municipality.trim() || '',
        },
        status: {
          hasCash: created.status?.hasCash ?? false,
          hasMoney: created.status?.hasCash ?? false,
          hasPaper: true,
          operationalStatus: created.status?.operationalStatus ?? 'Operational',
          reliabilityScore: created.status?.reliabilityScore ?? 0,
          lastVerified: created.status?.lastVerified ?? new Date().toISOString(),
          statusDescription: 'Recém adicionado',
          totalReports: 0,
        },
        address: {
          street: street.trim() || '',
          neighborhood: neighborhood.trim() || '',
          landmark: landmark.trim() || undefined,
        },
        distanceKm: 0,
        estimatedWalkingTime: 0,
      });

      Alert.alert('ATM adicionado', `"${name.trim()}" foi adicionado e guardado com sucesso.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.message ?? 'Não foi possível adicionar o ATM.';
      Alert.alert('Erro ao adicionar ATM', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar ATM</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.white} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Identificação */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionLabel}>IDENTIFICAÇÃO</Text>
        <View style={styles.card}>
          <Field label="Nome do ATM *" value={name} onChangeText={setName}
            placeholder="Ex: Multicaixa Aeroporto" />

          {/* Bank picker */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Banco *</Text>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowBanks(!showBanks)}
            >
              <Text style={[styles.pickerText, !bankName && { color: Colors.textMuted }]}>
                {bankName || 'Selecionar banco...'}
              </Text>
              <Ionicons
                name={showBanks ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            {showBanks && (
              <View style={styles.bankList}>
                {BANKS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.bankItem, b === bankName && styles.bankItemActive]}
                    onPress={() => { setBankName(b); setShowBanks(false); }}
                  >
                    <Text style={[styles.bankItemText, b === bankName && styles.bankItemTextActive]}>
                      {b}
                    </Text>
                    {b === bankName && (
                      <Ionicons name="checkmark" size={14} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Localização */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionLabel}>LOCALIZAÇÃO</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.locationBtn} onPress={useCurrentLocation}>
            <Ionicons name="navigate" size={16} color={Colors.primary} />
            <Text style={styles.locationBtnText}>Usar localização atual</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude *" value={lat} onChangeText={setLat}
                placeholder="-8.8368" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude *" value={lng} onChangeText={setLng}
                placeholder="13.2343" keyboardType="decimal-pad" />
            </View>
          </View>

          <Field label="Província" value={province} onChangeText={setProvince}
            placeholder="Luanda" />
          <Field label="Município" value={municipality} onChangeText={setMunicipality}
            placeholder="Luanda" />
          <Field label="Bairro / Zona" value={neighborhood} onChangeText={setNeighborhood}
            placeholder="Maianga" />
          <Field label="Rua / Avenida" value={street} onChangeText={setStreet}
            placeholder="Av. 4 de Fevereiro" />
          <Field label="Ponto de referência" value={landmark} onChangeText={setLandmark}
            placeholder="Em frente ao TAAG" last />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Submeter */}
        {/* ---------------------------------------------------------------- */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : (
              <>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.submitBtnText}>Adicionar ATM</Text>
              </>
            )}
        </TouchableOpacity>

        <Text style={styles.note}>
          * campos obrigatórios. O ATM ficará visível imediatamente após ser adicionado.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Field helper component
// ---------------------------------------------------------------------------

function Field({
  label, value, onChangeText, placeholder, keyboardType, last,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  last?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, last && { marginBottom: 0 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="words"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xxxl },
  forbidden: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.md, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },

  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginLeft: Spacing.xs,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: Spacing.md,
  },

  row: { flexDirection: 'row', gap: Spacing.sm },

  // Field
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  fieldInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.text,
  },

  // Bank picker
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  pickerText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  bankList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: -Spacing.xs,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  bankItemActive: { backgroundColor: Colors.primaryLight },
  bankItemText: { fontSize: FontSize.md, color: Colors.text },
  bankItemTextActive: { color: Colors.primary, fontWeight: '600' },

  // Location button
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  locationBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },

  note: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.xs * 1.6,
  },
});
