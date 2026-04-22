import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos e Condições</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="1. INTRODUÇÃO">
          <Body>O presente documento estabelece os Termos e Condições que regulam o acesso e a utilização da aplicação KudiLoc, operada pela empresa Kudivila, sociedade privada, com sede na Av. 21 de Janeiro, Luanda, Angola.</Body>
          <Body>Ao aceder, registar-se ou utilizar a aplicação KudiLoc, o utilizador declara que leu, compreendeu e aceita integralmente os presentes Termos e Condições.</Body>
          <Body>Caso o utilizador não concorde com qualquer disposição aqui prevista, deverá abster-se de utilizar a aplicação.</Body>
        </Section>

        <Section title="2. OBJETO E FUNCIONAMENTO DA PLATAFORMA">
          <Body>2.1  A KudiLoc é uma plataforma digital colaborativa que permite aos utilizadores:</Body>
          <Bullet>Visualizar a disponibilidade reportada de numerário em ATMs</Bullet>
          <Bullet>Reportar se um ATM possui ou não dinheiro disponível</Bullet>
          <Bullet>Consultar a hora da última atualização/report associada a cada ATM</Bullet>
          <Body>2.2  A informação apresentada na aplicação é de natureza colaborativa, não oficial, baseada em reports submetidos por utilizadores, podendo ser complementada por validações automáticas internas.</Body>
          <Body>2.3  A KudiLoc não possui ligação oficial a bancos comerciais, à EMIS ou a qualquer instituição financeira.</Body>
        </Section>

        <Section title="3. NATUREZA DA INFORMAÇÃO E ISENÇÃO DE RESPONSABILIDADE">
          <Body>3.1  A informação disponibilizada tem caráter meramente indicativo.</Body>
          <Body>3.2  A KudiLoc não garante:</Body>
          <Bullet>A disponibilidade efetiva de numerário no momento da chegada ao ATM</Bullet>
          <Bullet>A exatidão absoluta dos reports</Bullet>
          <Bullet>A inexistência de atrasos na atualização da informação</Bullet>
          <Body>3.3  Pode existir atraso na atualização dos dados, dependendo da frequência de reports e da atividade dos utilizadores numa determinada zona.</Body>
          <Body>3.4  A Kudivila não será responsável por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes:</Body>
          <Bullet>Da utilização da aplicação</Bullet>
          <Bullet>Da confiança depositada na informação apresentada</Bullet>
          <Bullet>Da deslocação a um ATM com base nos dados disponibilizados</Bullet>
        </Section>

        <Section title="4. FASE BETA">
          <Body>4.1  A aplicação encontra-se em fase beta, com duração estimada de 4 a 6 semanas a contar da data de lançamento.</Body>
          <Body>4.2  Durante esta fase podem ocorrer falhas técnicas, funcionalidades podem ser alteradas, suspensas ou removidas e o serviço pode ficar temporariamente indisponível.</Body>
          <Body>4.3  A Kudivila reserva-se o direito de modificar ou descontinuar a aplicação, total ou parcialmente, a qualquer momento.</Body>
        </Section>

        <Section title="5. REQUISITOS DE UTILIZAÇÃO">
          <Body>5.1  Idade mínima: 16 anos.</Body>
          <Body>5.2  A aplicação destina-se principalmente a residentes em Angola, com foco inicial na cidade de Luanda.</Body>
          <Body>5.3  Cada utilizador pode possuir apenas uma conta, associada a um identificador único (ex.: email ou número de telefone).</Body>
          <Body>5.4  O utilizador compromete-se a fornecer informações verdadeiras e atualizadas.</Body>
        </Section>

        <Section title="6. OBRIGAÇÕES DO UTILIZADOR">
          <Body>O utilizador compromete-se a:</Body>
          <Bullet>Submeter apenas reports verdadeiros e baseados em observação real</Bullet>
          <Bullet>Não manipular, adulterar ou tentar comprometer o sistema</Bullet>
          <Bullet>Não criar múltiplas contas com o objetivo de distorcer informações</Bullet>
          <Bullet>Não utilizar a aplicação para fins ilícitos ou fraudulentos</Bullet>
          <Body>A Kudivila reserva-se o direito de suspender ou encerrar contas que violem os presentes Termos e Condições.</Body>
        </Section>

        <Section title="7. DADOS PESSOAIS">
          <Body>7.1  A KudiLoc recolhe apenas os dados mínimos necessários ao funcionamento da plataforma, incluindo identificador de conta (ex.: email ou outro método de autenticação) e reports submetidos pelo utilizador.</Body>
          <Body>7.2  A aplicação não recolhe dados bancários nem informações financeiras sensíveis.</Body>
          <Body>7.3  O tratamento de dados pessoais é realizado em conformidade com a Lei da Proteção de Dados Pessoais de Angola (Lei n.º 22/11).</Body>
          <Body>7.4  Os dados poderão ser utilizados para:</Body>
          <Bullet>Melhorar a qualidade e fiabilidade dos reports</Bullet>
          <Bullet>Prevenir uso abusivo da plataforma</Bullet>
          <Bullet>Garantir a segurança e integridade do sistema</Bullet>
          <Body>Para questões relacionadas com dados pessoais, contacte: admin@kudiloc.com</Body>
        </Section>

        <Section title="8. DADOS DE LOCALIZAÇÃO">
          <Body>Para o correto funcionamento da KudiLoc, a aplicação pode aceder e processar dados de localização geográfica do dispositivo do utilizador, nas seguintes condições:</Body>
          <Bullet>A localização aproximada, baseada em rede ou zona geográfica selecionada manualmente, é utilizada por omissão para apresentar ATMs relevantes para a região do utilizador</Bullet>
          <Bullet>O acesso a localização precisa via GPS é opcional e requer consentimento explícito do utilizador</Bullet>
          <Bullet>Os dados de localização são utilizados exclusivamente para fins de funcionamento da plataforma, não sendo partilhados com terceiros para fins comerciais</Bullet>
          <Bullet>O utilizador pode revogar o acesso a localização a qualquer momento através das definições do seu dispositivo</Bullet>
        </Section>

        <Section title="9. PROPRIEDADE INTELECTUAL">
          <Body>9.1  Todos os direitos relativos à aplicação KudiLoc, incluindo marca, design, logotipo, software, código e estrutura da plataforma, pertencem à Kudivila.</Body>
          <Body>9.2  É proibida a reprodução, modificação, distribuição ou utilização não autorizada dos conteúdos da aplicação.</Body>
        </Section>

        <Section title="10. ALTERAÇÕES AOS TERMOS">
          <Body>10.1  A Kudivila poderá atualizar os presentes Termos e Condições a qualquer momento.</Body>
          <Body>10.2  A versão atualizada será disponibilizada no website e/ou na aplicação, indicando a data da última atualização.</Body>
          <Body>10.3  A continuidade da utilização da aplicação após alterações constitui aceitação dos novos Termos.</Body>
        </Section>

        <Section title="11. LEI APLICÁVEL E FORO">
          <Body>11.1  Os presentes Termos são regidos pela legislação da República de Angola.</Body>
          <Body>11.2  Para a resolução de quaisquer litígios emergentes da utilização da aplicação, é competente o foro da Comarca de Luanda, com renúncia expressa a qualquer outro.</Body>
        </Section>

        <Section title="12. CONTACTO, SUPORTE E RECLAMAÇÕES">
          <Body>Para questões gerais sobre o funcionamento da aplicação, sugestões ou reporte de problemas técnicos, o utilizador pode contactar a Kudivila.</Body>
          <Body>Email: admin@kudiloc.com</Body>
          <Body>Morada: Av. 21 de Janeiro, Luanda, Angola</Body>
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

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
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
