import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '../../src/constants/theme';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Como faço um report de um ATM?',
    a: 'Abre o mapa ou a lista de ATMs, seleciona o ATM que pretendes reportar e carrega no botão "Reportar". Indica se o ATM tem dinheiro disponível ou não e confirma o envio.',
  },
  {
    q: 'A informação dos ATMs é fiável?',
    a: 'A informação é colaborativa — gerada por outros utilizadores. Pode existir um desfasamento entre o report e o momento em que chegares ao ATM. Quanto mais reports recentes, mais fiável é a informação.',
  },
  {
    q: 'Posso usar a aplicação sem criar conta?',
    a: 'Podes consultar ATMs próximos sem conta, mas para submeter reports e aceder a funcionalidades como favoritos e histórico precisas de criar uma conta.',
  },
  {
    q: 'Como adiciono um ATM aos favoritos?',
    a: 'Abre o detalhe de qualquer ATM e carrega na estrela no canto superior direito. O ATM ficará guardado e aparecerá no filtro "Favoritos" da lista.',
  },
  {
    q: 'Os meus dados estão seguros?',
    a: 'Sim. A KudiLoc não armazena dados bancários nem informação financeira. Utilizamos encriptação nas comunicações e os dados pessoais são tratados em conformidade com a Lei n.º 22/11 de Angola.',
  },
  {
    q: 'Como elimino a minha conta?',
    a: 'Envia um email para admin@kudiloc.com com o assunto "Eliminar conta". A conta e todos os dados associados serão removidos no prazo de 7 dias úteis.',
  },
  {
    q: 'A aplicação está disponível fora de Luanda?',
    a: 'A KudiLoc funciona em todo o território angolano, mas a cobertura é maior em Luanda onde há mais utilizadores ativos. Outras cidades terão mais dados à medida que a comunidade crescer.',
  },
  {
    q: 'O que significa o indicador de fiabilidade (%)?',
    a: 'É uma pontuação calculada com base no histórico de reports daquele ATM. Quanto mais alto, mais consistente tem sido a informação reportada pelos utilizadores.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact cards */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:admin@kudiloc.com')}
            activeOpacity={0.75}
          >
            <View style={[styles.contactIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="mail-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>admin@kudiloc.com</Text>
          </TouchableOpacity>

        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>

        <View style={styles.faqCard}>
          {FAQS.map((item, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.sep} />}
              <TouchableOpacity
                style={styles.faqRow}
                onPress={() => toggle(i)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Ionicons
                  name={openIndex === i ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
              {openIndex === i && (
                <Text style={styles.faqAnswer}>{item.a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Beta notice */}
        <View style={styles.betaBanner}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.betaText}>
            A KudiLoc está em fase beta. O teu feedback é essencial para melhorarmos a plataforma. Envia as tuas sugestões para <Text style={styles.betaEmail}>admin@kudiloc.com</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  scroll: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  // Contact cards
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: FontSize.xs + 1,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // FAQ
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: -Spacing.sm,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: FontSize.sm * 1.4,
  },
  faqAnswer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.6,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md + 2,
  },

  // Beta banner
  betaBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  betaText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.6,
  },
  betaEmail: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
