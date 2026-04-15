// ---------------------------------------------------------------------------
// Portuguese UI strings for KudiLoc (Angola)
// ---------------------------------------------------------------------------

const pt = {
  // General
  appName: 'KudiLoc',
  loading: 'A carregar...',
  error: 'Erro',
  retry: 'Tentar novamente',
  cancel: 'Cancelar',
  save: 'Guardar',
  ok: 'OK',
  close: 'Fechar',
  yes: 'Sim',
  no: 'Não',
  send: 'Enviar',

  // Tabs
  tabMap: 'Mapa',
  tabLeaderboard: 'Ranking',
  tabProfile: 'Perfil',

  // Map screen
  mapTitle: 'ATMs Próximos',
  searchPlaceholder: 'Procurar ATM ou banco...',
  noATMsFound: 'Nenhum ATM encontrado nesta área.',
  nearbyListTitle: 'ATMs mais próximos',
  kmAway: 'km',
  minWalk: 'min a pé',

  // ATM status
  statusOperational: 'Operacional',
  statusMaintenance: 'Manutenção',
  statusOffline: 'Fora de serviço',
  statusAvailable: 'Disponível',
  statusUnavailable: 'Indisponível',
  total: 'Total',
  hasCash: 'Tem dinheiro',
  noCash: 'Sem dinheiro',
  hasPaper: 'Tem papel',
  noPaper: 'Sem papel',
  unknown: 'Desconhecido',
  lastVerified: 'Última verificação',
  reports: 'relatórios',
  reliability: 'Fiabilidade',

  // ATM Detail
  detailTitle: 'Detalhes do ATM',
  tabInfo: 'Informações',
  tabReports: 'Relatórios',
  tabComments: 'Comentários',
  address: 'Morada',
  landmark: 'Referência',
  services: 'Serviços',
  bank: 'Banco',
  province: 'Província',
  neighborhood: 'Bairro',
  noReports: 'Ainda não há relatórios.',
  noComments: 'Ainda não há comentários.',
  addComment: 'Escrever comentário...',
  helpful: 'Útil',
  reportedAt: 'Reportado em',
  reportedBy: 'Reportado por',
  submitReport: 'Reportar Estado',

  // Report
  reportTitle: 'Reportar Estado do ATM',
  reportCashQuestion: 'O ATM tem dinheiro?',
  reportPaperQuestion: 'O ATM tem papel para recibos?',
  reportStatusQuestion: 'Estado operacional',
  reportNotes: 'Notas adicionais (opcional)',
  reportNotesPlaceholder: 'Descreva o estado do ATM...',
  reportSubmit: 'Enviar Relatório',
  reportSuccess: 'Relatório enviado com sucesso!',
  reportError: 'Erro ao enviar relatório.',
  reportLoginRequired: 'Inicie sessão para enviar relatórios.',

  // Login
  loginTitle: 'Iniciar Sessão',
  loginSubtitle: 'Introduza o seu número de telefone angolano',
  phoneLabel: 'Número de telefone',
  phonePlaceholder: '9XX XXX XXX',
  otpLabel: 'Código OTP',
  otpPlaceholder: 'Introduza o código de 6 dígitos',
  requestOtp: 'Enviar Código',
  verifyOtp: 'Verificar',
  otpSent: 'Código enviado para',
  otpExpires: 'O código expira em',
  seconds: 'segundos',
  loginError: 'Erro ao iniciar sessão.',
  invalidPhone: 'Número de telefone inválido.',

  // Leaderboard
  leaderboardTitle: 'Ranking de Contribuidores',
  position: 'Posição',
  contributor: 'Contribuidor',
  totalReports: 'Total de relatórios',
  accurateReports: 'Relatórios correctos',
  reputation: 'Reputação',

  // Profile
  profileTitle: 'Meu Perfil',
  logout: 'Terminar Sessão',
  logoutConfirm: 'Tem certeza que deseja sair?',
  notLoggedIn: 'Não tem sessão iniciada.',
  loginPrompt: 'Inicie sessão para ver o seu perfil e contribuir.',
  memberSince: 'Membro desde',
  loginButton: 'Iniciar Sessão',

  // Location
  locationPermissionTitle: 'Permissão de Localização',
  locationPermissionMessage:
    'KudiLoc precisa da sua localização para encontrar ATMs próximos.',
  locationDenied: 'Permissão de localização negada.',
  locationUnavailable: 'Não foi possível obter a sua localização.',

  // Distance / time
  distance: 'Distância',
  walkingTime: 'Tempo a pé',
} as const;

export default pt;
