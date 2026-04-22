import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="1. IDENTIFICAÇÃO DA EMPRESA">
          <Body>A Kudivila é uma empresa privada de tecnologia registada em Angola, responsável pela plataforma digital colaborativa KudiLoc. Com sede na Av. 21 de Janeiro, Luanda, Angola.</Body>
          <Body>A KudiLoc é uma plataforma digital de dados colaborativos que permite aos utilizadores consultar e reportar a disponibilidade efetiva de numerário em caixas automáticos (ATMs), em tempo quase real.</Body>
          <Body>A KudiLoc não é uma plataforma financeira. Não processa pagamentos, não armazena dados bancários nem qualquer informação financeira sensível dos utilizadores.</Body>
        </Section>

        <Section title="2. DADOS RECOLHIDOS">
          <Body>Para a utilização da KudiLoc, o utilizador precisa fornecer:</Body>
          <Bullet>Identificador de conta — endereço de email ou número de telefone</Bullet>
          <Bullet>Reports — informações submetidas sobre o estado dos ATMs, disponibilidade ou indisponibilidade de numerário e outras informações</Bullet>
          <Body>Adicionalmente, podem ser recolhidos automaticamente dados técnicos de utilização, como endereço IP, tipo de dispositivo e registos de atividade na plataforma, para fins de segurança e melhoria do serviço.</Body>
          <Body>Não são recolhidos dados bancários, números de cartão, informações de conta ou quaisquer dados financeiros sensíveis.</Body>
        </Section>

        <Section title="3. DADOS DE LOCALIZAÇÃO">
          <Body>Para cumprir a sua função principal — indicar a disponibilidade de numerário em ATMs próximos do utilizador — a KudiLoc pode recolher e processar dados de localização geográfica, nas seguintes condições:</Body>
          <Bullet>Localização aproximada (baseada em IP ou zona geográfica selecionada) utilizada por omissão para apresentar resultados relevantes para a região do utilizador, sem necessidade de acesso ao GPS do dispositivo</Bullet>
          <Bullet>Localização precisa (GPS) ativada apenas com consentimento explícito do utilizador, quando este autoriza o acesso à localização do dispositivo</Bullet>
          <Body>Os dados de localização são utilizados exclusivamente para apresentar informação geográfica relevante ao utilizador, validar a coerência geográfica dos reports e melhorar a precisão e utilidade da plataforma.</Body>
          <Body>Os dados de localização precisa não são armazenados de forma permanente nem associados ao perfil do utilizador sem consentimento adicional. O utilizador pode revogar o acesso a localização a qualquer momento através das definições do seu dispositivo.</Body>
        </Section>

        <Section title="4. FINALIDADES E UTILIZAÇÃO DOS DADOS">
          <Body>Os dados recolhidos serão utilizados para:</Body>
          <Bullet>Disponibilizar informação atualizada e colaborativa sobre a disponibilidade de dinheiro nos ATMs</Bullet>
          <Bullet>Validar e processar os reports submetidos pelos utilizadores</Bullet>
          <Bullet>Gerir e autenticar as contas de utilizador</Bullet>
          <Bullet>Melhorar a qualidade, fiabilidade e precisão da plataforma</Bullet>
          <Bullet>Garantir a segurança e integridade do serviço</Bullet>
          <Bullet>Cumprir obrigações legais aplicáveis em Angola</Bullet>
        </Section>

        <Section title="5. FREQUÊNCIA E ATUALIDADE DOS DADOS">
          <Body>A informação na plataforma é atualizada em tempo quase real, à medida que os reports são submetidos e validados pelos utilizadores. Poderá existir um atraso pontual na disponibilização de informação, dependendo da frequência de reports e do nível de atividade dos utilizadores numa determinada zona geográfica.</Body>
          <Body>A KudiLoc não garante a precisão absoluta ou imediata das informações apresentadas, uma vez que estas dependem parcialmente da contribuição colaborativa dos utilizadores.</Body>
        </Section>

        <Section title="6. PARTILHA DE DADOS">
          <Body>A Kudivila não vende nem cede dados pessoais a terceiros para fins comerciais. Os dados poderão ser partilhados com prestadores de serviços técnicos, instituições financeiras parceiras e autoridades competentes.</Body>
        </Section>

        <Section title="7. CONSERVAÇÃO DOS DADOS">
          <Body>Os dados pessoais são conservados pelo período necessário à prestação do serviço e cumprimento das obrigações legais. Após o encerramento de conta, os dados são eliminados ou anonimizados, salvo obrigação legal de conservação.</Body>
        </Section>

        <Section title="8. SEGURANÇA">
          <Body>A KudiLoc adota medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda ou divulgação indevida, incluindo encriptação das comunicações e controlo de acessos.</Body>
        </Section>

        <Section title="9. IDADE MÍNIMA">
          <Body>A KudiLoc destina-se a utilizadores com 16 ou mais anos. Não recolhemos intencionalmente dados de menores de 16 anos. Caso seja detectado o registo de um menor, a conta será desativada e os dados eliminados.</Body>
        </Section>

        <Section title="10. DIREITOS DOS UTILIZADORES">
          <Body>O utilizador tem direito a qualquer momento a:</Body>
          <Bullet>Aceder os seus dados pessoais</Bullet>
          <Bullet>Retificar informações incorretas ou desatualizadas</Bullet>
          <Bullet>Eliminar a sua conta e os dados associados</Bullet>
          <Bullet>Opor-se ao tratamento para fins de comunicação</Bullet>
          <Bullet>Revogar o consentimento prestado</Bullet>
          <Body>Para exercer qualquer destes direitos, contacte: admin@kudiloc.com</Body>
        </Section>

        <Section title="11. ALTERAÇÕES À POLÍTICA">
          <Body>A Kudivila reserva-se o direito de atualizar esta política de privacidade. Alterações relevantes serão comunicadas através da plataforma ou por email. A continuação do uso do serviço após a data de entrada em vigor implica a aceitação das alterações.</Body>
          <Body>Para qualquer questão relacionada com privacidade e proteção de dados:</Body>
          <Body>Morada: Av. 21 de Janeiro, Luanda, Angola</Body>
          <Body>Email: admin@kudiloc.com</Body>
          <Body style={{ marginTop: Spacing.md, fontStyle: 'italic' }}>Esta política foi elaborada em conformidade com a legislação angolana aplicável, nomeadamente a Lei n.º 22/11, de 17 de Junho — Lei de Proteção de Dados Pessoais.</Body>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
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
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  body: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  bulletDot: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: FontSize.sm * 1.6,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: FontSize.sm * 1.6,
  },
});
