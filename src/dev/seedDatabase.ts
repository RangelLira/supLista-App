// ===========================
// BANCO DE DADOS ARTIFICIAL — USUÁRIO ATIVO TASKFLOW
// Data base: 2026-06-17 (hoje)
// Janela: 2026-03-17 (−3 meses) → 2026-09-17 (+3 meses)
// Registros: 500+ (eventos, pendências, listas, itens, rotinas)
//
// Cenários simulados:
//  - Eventos agendados, adiados, renegociados, concluídos, expirados
//  - Pendências abertas, concluídas com vários graus de urgência
//  - Listas de compras e tarefas com e sem vínculo a eventos
//  - Rotinas de todos os tipos (diária, semanal, mensal, anual, custom)
//  - Anotações em vários formatos
//  - Compartilhamento simulado (sharedWithUid preenchido)
//  - Diferentes configurações de auto-delete aplicadas
// ===========================

import { Event, ShoppingList, Rotina, ListItem } from '../../src/types';
import { AppSettings } from '../../src/utils/storage';

// ===========================
// HELPERS DE GERAÇÃO DE IDS
// ===========================

let idCounter = 1000;
const nextId = () => ++idCounter;

function isoDate(dateStr: string, time = '00:00:00'): string {
  return `${dateStr}T${time}`;
}

// Datas de referência relativas a 2026-06-17
const D = {
  // Passado (3 meses atrás a ontem)
  m90: '2026-03-18',
  m80: '2026-03-28',
  m70: '2026-04-07',
  m60: '2026-04-17',
  m50: '2026-04-27',
  m45: '2026-05-02',
  m40: '2026-05-07',
  m30: '2026-05-17',
  m21: '2026-05-26',
  m14: '2026-06-02',
  m10: '2026-06-06',
  m7:  '2026-06-09',
  m5:  '2026-06-11',
  m3:  '2026-06-13',
  m28: '2026-05-20',
  m1:  '2026-06-16',
  // Hoje
  TODAY: '2026-06-17',
  // Futuro (amanhã a +3 meses)
  p1:  '2026-06-18',
  p3:  '2026-06-20',
  p7:  '2026-06-24',
  p14: '2026-07-01',
  p21: '2026-07-08',
  p30: '2026-07-17',
  p45: '2026-08-01',
  p60: '2026-08-16',
  p75: '2026-08-31',
  p90: '2026-09-15',
  // Auxiliares para listas arquivadas antigas
  m55: '2026-04-22',
  m65: '2026-04-12',
};

// ===========================
// CONFIGURAÇÕES SIMULADAS
// ===========================

export const seedSettings: AppSettings = {
  autoMigrationEnabled: true,
  theme: 'escuro',
  language: 'pt',
  onboardingDone: true,
  displayName: 'Rangel',
  deleteCompletedEventsAfter: '1month',
  deleteCompletedPendingsAfter: '1week',
  deleteCompletedRotinasAfter: 'never',
  deleteCompletedListsAfter: '1month',
  completedListsAction: 'arquivar',
  notificationsEnabled: true,
  notificationMode: 'daily',
  notificationTime: '08:00',
  notificationLeadMinutes: 30,
  waterTrackerEnabled: true,
  waterDailyGoalMl: 2000,
  waterReminderIntervalMinutes: 60,
  waterStartTime: '08:00',
  waterEndTime: '20:00',
};

// ===========================
// EVENTOS AGENDADOS (FUTUROS)
// ===========================

export const scheduledEvents: Event[] = [
  // Compromissos de trabalho
  {
    id: nextId(), title: 'Reunião de Planejamento Q3', tag_name: 'Trabalho',
    start_time: isoDate(D.p1, '09:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Preparar relatório de KPIs', 'Revisar metas do trimestre anterior'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Apresentação para cliente Acme', tag_name: 'Trabalho',
    start_time: isoDate(D.p3, '14:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Levar notebook', 'Chegar 15min antes', 'Demo do produto v2.0'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Sprint Review — Sprint 14', tag_name: 'Trabalho',
    start_time: isoDate(D.p7, '10:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Convidar PO', 'Preparar demonstração das histórias'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Entrevista técnica candidato backend', tag_name: 'Trabalho',
    start_time: isoDate(D.p3, '15:30:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Avaliar conhecimento em Node.js e TypeScript'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Treinamento AWS Cloud Practitioner', tag_name: 'Trabalho',
    start_time: isoDate(D.p14, '09:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Prova online — 120 min', 'Estudar S3, EC2, IAM'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'One-on-one com líder técnico', tag_name: 'Trabalho',
    start_time: isoDate(D.p7, '16:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Feedback de desempenho', 'Plano de carreira'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  // Saúde
  {
    id: nextId(), title: 'Consulta Dentista — limpeza', tag_name: 'Saúde',
    start_time: isoDate(D.p14, '08:30:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Endereço: Av. Paulista 1000, sala 802', 'Levar carteira SUS'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Exame de sangue em jejum', tag_name: 'Saúde',
    start_time: isoDate(D.p7, '07:30:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['12h de jejum', 'Pedir resultado em 3 dias'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Consulta cardiologista — checkup anual', tag_name: 'Saúde',
    start_time: isoDate(D.p30, '14:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Levar ECG do ano passado', 'Histórico de pressão'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Sessão fisioterapia — coluna', tag_name: 'Saúde',
    start_time: isoDate(D.p3, '11:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['3ª sessão do protocolo', 'Exercícios para casa'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  // Pessoal / Família
  {
    id: nextId(), title: 'Aniversário da Mãe 🎂', tag_name: 'Família',
    start_time: isoDate(D.p21, '00:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Comprar bolo de morango', 'Reservar restaurante japonês'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Viagem de férias — Florianópolis', tag_name: 'Pessoal',
    start_time: isoDate(D.p60, '00:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Voo 06:40 GRU-FLN', 'Hotel Jurerê Internacional', 'Validar passagem'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Churrasco de fim de semana', tag_name: 'Lazer',
    start_time: isoDate(D.p7, '12:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Casa do João', 'Levar carvão e linguiça'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Ingresso show Coldplay', tag_name: 'Lazer',
    start_time: isoDate(D.p45, '20:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Entrada Gate C', 'Setor pista premium', 'Chegar 2h antes'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Renovação da CNH', tag_name: 'Documentos',
    start_time: isoDate(D.p14, '13:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Agendar DETRAN online', 'Laudo médico vence em agosto'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Revisão do carro — 30.000km', tag_name: 'Veículo',
    start_time: isoDate(D.p21, '08:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Trocar óleo 5W30', 'Verificar freios', 'Rodízio de pneus'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Reunião condomínio — assembleia anual', tag_name: 'Casa',
    start_time: isoDate(D.p30, '19:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Pauta: taxa condominial 2027', 'Votar obras do hall'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Workshop de Fotografia', tag_name: 'Desenvolvimento',
    start_time: isoDate(D.p45, '09:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Levar câmera DSLR', 'Curso 8h — tratar RAW no Lightroom'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Defesa TCC do primo Lucas', tag_name: 'Família',
    start_time: isoDate(D.p14, '15:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['UNICAMP — sala B-201', 'Levar bouquet de flores'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Happy Hour equipe — fim do sprint', tag_name: 'Trabalho',
    start_time: isoDate(D.p7, '18:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Bar do Zé — Rua Augusta 2200', 'Combinar carona com a Priya'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  // Mais eventos futuros
  {
    id: nextId(), title: 'Pagamento IPTU — 2ª parcela', tag_name: 'Finanças',
    start_time: isoDate(D.p3, '23:59:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Código: 7892-0012-3456', 'Não pagar com cartão, apenas boleto'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Declaração IR — revisão final', tag_name: 'Finanças',
    start_time: isoDate(D.p1, '20:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Informe de rendimentos do banco', 'Dedução médico dentista'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Pagar cartão de crédito', tag_name: 'Finanças',
    start_time: isoDate(D.p7, '23:59:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Vencimento dia 25', 'Fatura: R$ 3.240,00'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Consulta veterinária — Mel (cachorra)', tag_name: 'Pets',
    start_time: isoDate(D.p14, '10:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Vacina V10 e anti-rábica', 'Vermífugo', 'Levar carteira de vacinação'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Aula de inglês — Advanced Level', tag_name: 'Desenvolvimento',
    start_time: isoDate(D.p3, '19:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Capítulo 12 — Business Communication', 'Exercícios de listening'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Jantar com os pais', tag_name: 'Família',
    start_time: isoDate(D.p7, '19:30:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Restaurante Famiglia — reserva 8 pessoas'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Maratona São Paulo 2026 — largada', tag_name: 'Esportes',
    start_time: isoDate(D.p75, '06:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Número: 4521', 'Kit largada no sábado antes'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Webinar Arquitetura de Software', tag_name: 'Desenvolvimento',
    start_time: isoDate(D.p14, '19:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Link: meet.google.com/xyz', 'Palestrante: Martin Fowler'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Aluguel — transferência TED', tag_name: 'Finanças',
    start_time: isoDate(D.p1, '09:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['R$ 1.850,00 → Conta Imobiliária AG: 0234 CC: 12345-0'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Entrega relatório mensal RH', tag_name: 'Trabalho',
    start_time: isoDate(D.p7, '17:00:00'), is_completed: false, is_pending: false,
    steps: [], notes: ['Planilha de horas', 'Anexar justificativa de ausência dia 15'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
];

// ===========================
// EVENTOS CONCLUÍDOS (PASSADO)
// ===========================

export const completedEvents: Event[] = [
  {
    id: nextId(), title: 'Reunião de Planejamento Maio', tag_name: 'Trabalho',
    start_time: isoDate(D.m30, '09:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Aprovado orçamento para Q2'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m30, '10:30:00'),
  },
  {
    id: nextId(), title: 'Consulta clínico geral — gripe', tag_name: 'Saúde',
    start_time: isoDate(D.m21, '14:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Amoxicilina 500mg — 7 dias', 'Descansou 2 dias'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m21, '15:00:00'),
  },
  {
    id: nextId(), title: 'Entrega Projeto XYZ — cliente Beta', tag_name: 'Trabalho',
    start_time: isoDate(D.m14, '18:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['MVP entregue com 2 dias de atraso', 'Aprovado pelo cliente'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m14, '17:45:00'),
  },
  {
    id: nextId(), title: 'Aniversário de casamento (10 anos!)', tag_name: 'Família',
    start_time: isoDate(D.m10, '00:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Jantar especial no Fasano', 'Presente: viagem Paris (surpresa)'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m10, '23:30:00'),
  },
  {
    id: nextId(), title: 'Hackathon interno — 48h', tag_name: 'Trabalho',
    start_time: isoDate(D.m7, '08:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Time: Rangel, Ana, Carlos, Beatriz', 'Projeto: IA para triagem de bugs', '2º lugar!'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m5, '18:00:00'),
  },
  {
    id: nextId(), title: 'Pagamento condomínio Maio', tag_name: 'Finanças',
    start_time: isoDate(D.m30, '23:59:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['R$ 780,00 — pix chave condômino'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m28, '10:00:00'),
  },
  {
    id: nextId(), title: 'Dentista — extração dente do siso', tag_name: 'Saúde',
    start_time: isoDate(D.m45, '09:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Cirurgia bem-sucedida', 'Antibiótico + anti-inflamatório 5 dias'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m45, '11:00:00'),
  },
  {
    id: nextId(), title: 'Alinhamento estratégico — diretores', tag_name: 'Trabalho',
    start_time: isoDate(D.m21, '08:30:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['OKRs H2 aprovados', 'Meta: 30% crescimento receita'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m21, '12:00:00'),
  },
  {
    id: nextId(), title: 'Mudança de apartamento', tag_name: 'Casa',
    start_time: isoDate(D.m60, '08:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Caminhão contratado', 'Ajuda dos amigos para caixas', 'Chaves entregues às 15h'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m60, '20:00:00'),
  },
  {
    id: nextId(), title: 'Reunião com banco — linha de crédito', tag_name: 'Finanças',
    start_time: isoDate(D.m14, '10:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Aprovado R$ 50k taxa 1,2%/mês', 'Será usado para obra da cozinha'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m14, '11:30:00'),
  },
  {
    id: nextId(), title: 'Formatura sobrinha Carla', tag_name: 'Família',
    start_time: isoDate(D.m30, '19:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Teatro Alfa', 'Jantamos depois no restaurante'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m30, '23:00:00'),
  },
  {
    id: nextId(), title: 'Manutenção ar-condicionado', tag_name: 'Casa',
    start_time: isoDate(D.m40, '13:00:00'), is_completed: true, is_pending: false,
    steps: [], notes: ['Limpeza + recarga de gás', 'R$ 380,00'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m40, '15:00:00'),
  },
];

// ===========================
// EVENTOS QUE FORAM ADIADOS (agora são pendências)
// Esses eventos tinham start_time, foram adiados → is_pending=true, start_time=null
// Simula o ciclo: criado como evento → adiado → virou pendência
// ===========================

export const postponedAsPending: Event[] = [
  {
    id: nextId(), title: 'Reunião com contador — imposto renda', tag_name: 'Finanças',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['ADIADO de 15/05 pois contador ficou doente', 'Depois adiou de 01/06 — reagendar urgente'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: true, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Delivery de móveis — sala de estar', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['ADIADO de 22/05 — produto veio com defeito', 'Novo prazo: a combinar com loja'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: true, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Instalação internet fibra óptica', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['ADIADO 2x pela operadora', 'Protocolo de reclamação: 8812903'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: true, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Renovação do passaporte', tag_name: 'Documentos',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['ADIADO da fila do dia 10/04 — sistema PF fora do ar', 'Reagendar para julho'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: true, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
  {
    id: nextId(), title: 'Curso de culinária italiana', tag_name: 'Lazer',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['ADIADO do dia 08/06 — turma não atingiu mínimo', 'Nova turma prevista para agosto'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: true, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null,
  },
];

// ===========================
// PENDÊNCIAS ABERTAS (criadas diretamente como pending)
// ===========================

export const openPendings: Event[] = [
  { id: nextId(), title: 'Organizar arquivo morto do escritório', tag_name: 'Trabalho',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Digitalizar contratos 2024', 'Descartar papéis >5 anos'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Enviar proposta para cliente Gamma', tag_name: 'Trabalho',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Prazo implícito: fim da semana que vem'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Atualizar LinkedIn e portfólio', tag_name: 'Desenvolvimento',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Adicionar projetos 2025', 'Nova foto profissional'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Pesquisar plano de saúde empresarial', tag_name: 'Finanças',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Comparar Bradesco, Unimed, SulAmérica', 'Orçamento máximo: R$ 400/mês'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Contratar seguro residencial', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Porto Seguro tem melhor custo-benefício segundo pesquisa'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Consertar torneira do banheiro', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Vazando há 2 semanas', 'Ligar para o encanador Paulo (11) 9999-8888'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Cadastrar nota fiscal eletrônica', tag_name: 'Finanças',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Chave: 43260617345678901234'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Revisão do seguro do carro', tag_name: 'Veículo',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Vence em 30/09/2026', 'Porto Seguro vs Zurich — cotar'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Organizar fotos do celular — 3 anos acumulados', tag_name: 'Pessoal',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Google Photos ou iCloud?', '~12.000 fotos para organizar'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Começar aprender React Native', tag_name: 'Desenvolvimento',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Curso Udemy recomendado pelo João', 'Já tenho base em React Web'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Limpar guarda-roupa — doação', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Separar roupas para ONG', 'Bolsas de lixo grandes'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Renovar certificado digital eCPF', tag_name: 'Documentos',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Validade expirou dia 01/06', 'Serasa Experian ou Certisign'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Comprar presente para chá de bebê — Fernanda', tag_name: 'Social',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Lista de presentes: amazon.com.br/lista-bebê-fernanda', 'Orçamento até R$ 200'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Configurar backup automático NAS', tag_name: 'Tecnologia',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Synology DS220+ — Hyper Backup', '3-2-1 backup strategy'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Pintura quarto de visitas', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Cor escolhida: cinza claro Suvinil 18.3.08', 'Contratar pintor'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Ler livro "Atomic Habits" — James Clear', tag_name: 'Desenvolvimento',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Na metade do cap. 8', 'Aplicar método 2-min rule'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Trocar cama queen size', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Pesquisar em Tok&Stok e MadeiraMadeira'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Trocar filtro da cozinha PUROTAP', tag_name: 'Casa',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Modelo: Filtro Refil Slim', 'Comprar no iFood ou Mercado Livre'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Solicitar certidão de nascimento 2ª via', tag_name: 'Documentos',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Portal Cartório 24h', 'Prazo: 2-5 dias úteis'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
  { id: nextId(), title: 'Contribuição INSS autônomo — maio e junho', tag_name: 'Finanças',
    start_time: null, is_completed: false, is_pending: true,
    steps: [], notes: ['Guia em atraso — acréscimo de 0,33%/dia'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false, completedAt: null },
];

// ===========================
// PENDÊNCIAS CONCLUÍDAS (passado)
// ===========================

export const completedPendings: Event[] = [
  { id: nextId(), title: 'Enviar CV para vaga senior backend', tag_name: 'Trabalho',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Linkedin + email direto para RH'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m7, '10:00:00') },
  { id: nextId(), title: 'Pagar multa trânsito', tag_name: 'Veículo',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['R$ 195,23 — desconto 40% pago com antecedência'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m14, '09:00:00') },
  { id: nextId(), title: 'Assinar contrato de prestação de serviços', tag_name: 'Trabalho',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Docusign — assinado eletronicamente'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m10, '15:00:00') },
  { id: nextId(), title: 'Pedir reembolso despesa viagem', tag_name: 'Finanças',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['R$ 1.230 — viagem SP→BSB dia 15/04'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m21, '11:00:00') },
  { id: nextId(), title: 'Comprar notebook novo para trabalho', tag_name: 'Tecnologia',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Dell XPS 15 — R$ 8.900 no cartão em 12x'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m30, '14:00:00') },
  { id: nextId(), title: 'Montar planejamento financeiro 2026', tag_name: 'Finanças',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Planilha Excel com orçamento mensal', 'Meta: poupar 25% da renda'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m60, '20:00:00') },
  { id: nextId(), title: 'Regularizar CPF na Receita Federal', tag_name: 'Documentos',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Pendência resolvida — declaração IR enviada'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m45, '16:00:00') },
  { id: nextId(), title: 'Instalar fechadura biométrica', tag_name: 'Casa',
    start_time: null, is_completed: true, is_pending: true,
    steps: [], notes: ['Intelbras iLock Slim — instalado em 2h'],
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: isoDate(D.m50, '12:00:00') },
];

// ===========================
// LISTAS DE COMPRAS
// ===========================

function makeItem(id: number, name: string, qty: number, unit: string | null, checked: boolean, price: number | null): ListItem {
  return { id, name, quantity: qty, unit, isChecked: checked, price, priceType: 'unit' };
}

export const shoppingLists: ShoppingList[] = [
  // Lista semanal de mercado — ativa
  {
    id: nextId(), name: 'Mercado Semanal — Semana 25', type: 'compras',
    suppliers: ['Carrefour'],
    items: [
      makeItem(nextId(), 'Arroz Integral 5kg', 1, 'unidade', false, 25.90),
      makeItem(nextId(), 'Feijão Carioca', 2, 'kg', false, 9.99),
      makeItem(nextId(), 'Frango filé sem osso', 1.5, 'kg', false, 28.90),
      makeItem(nextId(), 'Leite Integral Longa Vida', 6, 'unidade', false, 6.49),
      makeItem(nextId(), 'Iogurte Natural Danone', 4, 'unidade', false, 5.29),
      makeItem(nextId(), 'Ovos caipira dúzia', 2, 'unidade', false, 14.90),
      makeItem(nextId(), 'Manteiga Aviação 200g', 1, 'unidade', false, 12.50),
      makeItem(nextId(), 'Azeite Gallo 500ml', 1, 'unidade', false, 38.90),
      makeItem(nextId(), 'Macarrão espaguete', 3, 'unidade', false, 4.79),
      makeItem(nextId(), 'Molho de tomate Pomarola', 4, 'unidade', false, 3.99),
    ],
    createdAt: isoDate(D.TODAY),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Preferir orgânicos sempre que disponível. Evitar itens com açúcar adicionado.',
  },
  // Lista de farmácia — ativa
  {
    id: nextId(), name: 'Farmácia — medicamentos mensais', type: 'compras',
    suppliers: ['Drogasil', 'Droga Raia'],
    items: [
      makeItem(nextId(), 'Omeprazol 20mg caixa', 2, 'unidade', false, 18.90),
      makeItem(nextId(), 'Vitamina D3 2000UI', 1, 'unidade', false, 45.00),
      makeItem(nextId(), 'Ômega 3 1g', 1, 'unidade', false, 62.90),
      makeItem(nextId(), 'Dipirona 500mg 20comp', 1, 'unidade', false, 8.99),
      makeItem(nextId(), 'Protetor solar FPS60 200ml', 1, 'unidade', false, 49.90),
      makeItem(nextId(), 'Antialérgico Loratadina', 1, 'unidade', false, 15.90),
    ],
    createdAt: isoDate(D.p1),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Verificar validade antes de comprar.',
  },
  // Lista de material de escritório — ativa
  {
    id: nextId(), name: 'Material Escritório Home Office', type: 'compras',
    suppliers: ['Kalunga', 'Amazon'],
    items: [
      makeItem(nextId(), 'Resma papel A4 500fls', 2, 'unidade', false, 32.90),
      makeItem(nextId(), 'Canetas BIC azul caixa', 1, 'unidade', false, 24.90),
      makeItem(nextId(), 'Post-it 3M 100fls', 3, 'unidade', false, 18.90),
      makeItem(nextId(), 'Grampeador e grampos', 1, 'unidade', false, 35.90),
      makeItem(nextId(), 'Organizador de mesa', 1, 'unidade', false, 89.90),
      makeItem(nextId(), 'Teclado mecânico ABNT2', 1, 'unidade', false, 289.00),
    ],
    createdAt: isoDate(D.p3),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: '',
  },
  // Lista pet — ativa
  {
    id: nextId(), name: 'Petshop — Mel (labrador 3 anos)', type: 'compras',
    suppliers: ['Cobasi', 'PetLove'],
    items: [
      makeItem(nextId(), 'Ração Royal Canin Labrador Adult 15kg', 1, 'unidade', false, 389.90),
      makeItem(nextId(), 'Petisco Natural Osso Defumado', 3, 'unidade', false, 22.90),
      makeItem(nextId(), 'Shampoo Sanol Neutro', 1, 'unidade', false, 28.90),
      makeItem(nextId(), 'Anti-pulgas Frontline Plus G', 1, 'unidade', false, 95.90),
      makeItem(nextId(), 'Brinquedo corda de sisal', 1, 'unidade', false, 34.90),
    ],
    createdAt: isoDate(D.p7),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Mel está em dieta — verificar calorias da ração.',
  },
  // Lista concluída — mercado passado
  {
    id: nextId(), name: 'Mercado — Semana 22 (concluída)', type: 'compras',
    suppliers: ['Extra'],
    items: [
      makeItem(nextId(), 'Arroz Camil 5kg', 1, 'unidade', true, 22.90),
      makeItem(nextId(), 'Feijão preto 1kg', 2, 'unidade', true, 8.90),
      makeItem(nextId(), 'Carne bovina patinho 1kg', 1, 'kg', true, 45.90),
      makeItem(nextId(), 'Tomate', 1, 'kg', true, 8.99),
      makeItem(nextId(), 'Alho', 0.5, 'kg', true, 15.00),
      makeItem(nextId(), 'Cebola', 1, 'kg', true, 6.99),
      makeItem(nextId(), 'Banana prata', 1, 'kg', true, 7.99),
    ],
    createdAt: isoDate(D.m21),
    isCompleted: true, isArchived: false, totalSpent: 116.67,
    linkedEventId: null, linkedPendingId: null,
    completedAt: isoDate(D.m21, '11:00:00'),
    notes: '',
  },
  // Lista de churrasco — concluída e vinculada a evento
  {
    id: nextId(), name: 'Compras Churrasco 14/06', type: 'compras',
    suppliers: ['Açougue do Zé', 'Atacadão'],
    items: [
      makeItem(nextId(), 'Picanha', 2, 'kg', true, 89.90),
      makeItem(nextId(), 'Costela bovina', 3, 'kg', true, 48.90),
      makeItem(nextId(), 'Linguiça toscana', 2, 'kg', true, 32.90),
      makeItem(nextId(), 'Carvão 10kg', 2, 'unidade', true, 32.90),
      makeItem(nextId(), 'Cerveja Heineken lata 350ml', 24, 'unidade', true, 5.89),
      makeItem(nextId(), 'Refrigerante 2L', 6, 'unidade', true, 9.99),
      makeItem(nextId(), 'Pão de alho congelado', 2, 'unidade', true, 18.90),
      makeItem(nextId(), 'Sal grosso', 1, 'unidade', true, 4.99),
    ],
    createdAt: isoDate(D.m3),
    isCompleted: true, isArchived: false, totalSpent: 492.30,
    linkedEventId: null, linkedPendingId: null,
    completedAt: isoDate(D.m3, '10:00:00'),
    notes: 'Churrasco foi sucesso! 12 pessoas. Próxima vez: comprar mais cerveja.',
  },
  // Lista de viagem — futura (vinculada a evento)
  {
    id: nextId(), name: 'Lista Viagem Florianópolis', type: 'compras',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Protetor solar FPS70 200ml x3', 3, 'unidade', false, 59.90),
      makeItem(nextId(), 'Repelente OFF Premium', 2, 'unidade', false, 29.90),
      makeItem(nextId(), 'Roupa de banho masculina', 2, 'unidade', false, 89.90),
      makeItem(nextId(), 'Sandália Havaianas Top', 1, 'unidade', false, 49.90),
      makeItem(nextId(), 'Câmera GoPro Hero 13 à prova dágua', 1, 'unidade', false, 2499.00),
      makeItem(nextId(), 'Adaptador universal de tomada', 1, 'unidade', false, 45.90),
      makeItem(nextId(), 'Kit primeiros socorros', 1, 'unidade', false, 35.90),
    ],
    createdAt: isoDate(D.p14),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Ver lista de roupas separado. Hotel oferece toalhas.',
  },
  // Lista de reforma da cozinha — ativa com muitos itens
  {
    id: nextId(), name: 'Material Reforma Cozinha', type: 'compras',
    suppliers: ['Leroy Merlin', 'Madeira Madeira'],
    items: [
      makeItem(nextId(), 'Piso porcelanato 60x60cm', 15, 'mt', false, 89.90),
      makeItem(nextId(), 'Tinta branco gelo 18L', 2, 'unidade', false, 285.00),
      makeItem(nextId(), 'Rejunte cinza cimento 5kg', 3, 'unidade', false, 24.90),
      makeItem(nextId(), 'Torneira de pia Deca', 1, 'unidade', false, 189.90),
      makeItem(nextId(), 'Cuba de embutir inox oval', 1, 'unidade', false, 349.90),
      makeItem(nextId(), 'Sifão cozinha PVC', 2, 'unidade', false, 34.90),
      makeItem(nextId(), 'Silicone branco 280ml', 4, 'unidade', false, 19.90),
      makeItem(nextId(), 'Fita isolante 3M', 3, 'unidade', false, 8.90),
      makeItem(nextId(), 'Ciment cola cinza 20kg', 4, 'unidade', false, 34.90),
    ],
    createdAt: isoDate(D.p21),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Orçamento total previsto: R$ 4.500. Obra começa em 15/07.',
  },
];

// ===========================
// LISTAS DE TAREFAS
// ===========================

export const taskLists: ShoppingList[] = [
  // Lista de tarefas domésticas — ativa
  {
    id: nextId(), name: 'Limpeza Geral — Apartamento', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Aspirar todos os cômodos', 1, null, false, null),
      makeItem(nextId(), 'Lavar banheiros (2)', 2, null, false, null),
      makeItem(nextId(), 'Limpar vidros e espelhos', 1, null, false, null),
      makeItem(nextId(), 'Lavar roupa — máquina cheia', 1, null, false, null),
      makeItem(nextId(), 'Passar roupa do mês', 1, null, false, null),
      makeItem(nextId(), 'Limpar fogão e microondas', 1, null, false, null),
      makeItem(nextId(), 'Desentupir ralo do banheiro', 1, null, false, null),
      makeItem(nextId(), 'Trocar filtro do purificador', 1, null, false, null),
    ],
    createdAt: isoDate(D.TODAY),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Faxina mensal — todo dia 17. Usar produtos naturais.',
  },
  // Lista de onboarding novo colaborador — trabalho
  {
    id: nextId(), name: 'Onboarding Dev Pedro — Sprint 14', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Criar conta GitHub e GitLab', 1, null, false, null),
      makeItem(nextId(), 'Configurar ambiente local Docker', 1, null, false, null),
      makeItem(nextId(), 'Agendar pair programming dia 1', 1, null, false, null),
      makeItem(nextId(), 'Apresentar para o time', 1, null, false, null),
      makeItem(nextId(), 'Explicar fluxo de PR e code review', 1, null, false, null),
      makeItem(nextId(), 'Dar acesso ao Jira e Confluence', 1, null, false, null),
      makeItem(nextId(), 'Primeira task: corrigir bug #1234', 1, null, false, null),
    ],
    createdAt: isoDate(D.p1),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Pedro começa segunda-feira. Preparar máquina antecipadamente.',
  },
  // Lista de rotina de exercícios — ativa
  {
    id: nextId(), name: 'Treino Semana 25 — Academia', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Segunda: Peito + Tríceps', 1, null, true, null),
      makeItem(nextId(), 'Terça: Costas + Bíceps', 1, null, true, null),
      makeItem(nextId(), 'Quarta: Pernas + Glúteos', 1, null, true, null),
      makeItem(nextId(), 'Quinta: Ombros + Core', 1, null, false, null),
      makeItem(nextId(), 'Sexta: Cardio 45min', 1, null, false, null),
      makeItem(nextId(), 'Sábado: Funcional ao ar livre', 1, null, false, null),
    ],
    createdAt: isoDate(D.m1),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Descanso domingo. Hidratação mínima 2L/dia.',
  },
  // Lista estudo para certificação — ativa
  {
    id: nextId(), name: 'Estudo AWS — Semana 3', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Assistir módulo EC2 (3h)', 1, null, true, null),
      makeItem(nextId(), 'Assistir módulo S3 (2h)', 1, null, true, null),
      makeItem(nextId(), 'Praticar console AWS Free Tier', 1, null, false, null),
      makeItem(nextId(), 'Simulado prova 65 questões', 1, null, false, null),
      makeItem(nextId(), 'Revisar IAM e Security Groups', 1, null, false, null),
      makeItem(nextId(), 'Assistir módulo VPC (2h)', 1, null, false, null),
    ],
    createdAt: isoDate(D.m3),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Prova marcada para 01/07. Necessário 72% de acerto.',
  },
  // Lista de tarefas concluída
  {
    id: nextId(), name: 'Setup Home Office — Mudança (concluída)', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Montar mesa em L', 1, null, true, null),
      makeItem(nextId(), 'Instalar monitor extra 27"', 1, null, true, null),
      makeItem(nextId(), 'Organizar cabos com organizadores', 1, null, true, null),
      makeItem(nextId(), 'Configurar roteador Wi-Fi 6', 1, null, true, null),
      makeItem(nextId(), 'Testar velocidade internet', 1, null, true, null),
      makeItem(nextId(), 'Instalar webcam Logitech C920', 1, null, true, null),
    ],
    createdAt: isoDate(D.m60),
    isCompleted: true, isArchived: true, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null,
    completedAt: isoDate(D.m55, '20:00:00'),
    notes: 'Home office montado! Muito mais produtivo.',
  },
  // Lista de planejamento de viagem — ativa
  {
    id: nextId(), name: 'Planejamento Viagem Florianópolis', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Comprar passagens aéreas', 1, null, true, null),
      makeItem(nextId(), 'Reservar hotel / Airbnb', 1, null, true, null),
      makeItem(nextId(), 'Contratar seguro viagem', 1, null, false, null),
      makeItem(nextId(), 'Fazer lista de roupas', 1, null, false, null),
      makeItem(nextId(), 'Separar documentos', 1, null, false, null),
      makeItem(nextId(), 'Baixar mapas offline', 1, null, false, null),
      makeItem(nextId(), 'Pesquisar restaurantes recomendados', 1, null, false, null),
      makeItem(nextId(), 'Planejar roteiro dia a dia', 1, null, false, null),
    ],
    createdAt: isoDate(D.p14),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Viagem de 10 dias — 16 a 26 ago. Focar em praias e trilhas.',
  },
  // Lista de tarefas de projeto — trabalho
  {
    id: nextId(), name: 'Deploy v3.2.0 — Produção', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Code review última PR', 1, null, true, null),
      makeItem(nextId(), 'Rodar suite de testes E2E', 1, null, true, null),
      makeItem(nextId(), 'Criar tag de release v3.2.0', 1, null, false, null),
      makeItem(nextId(), 'Deploy para staging e validação', 1, null, false, null),
      makeItem(nextId(), 'Comunicar time de suporte', 1, null, false, null),
      makeItem(nextId(), 'Deploy produção em horário off-peak', 1, null, false, null),
      makeItem(nextId(), 'Monitorar métricas 2h pós-deploy', 1, null, false, null),
      makeItem(nextId(), 'Atualizar changelog e wiki', 1, null, false, null),
    ],
    createdAt: isoDate(D.p3),
    isCompleted: false, isArchived: false, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null, completedAt: null,
    notes: 'Deploy programado para quinta-feira 00:00. Feature flag ativado gradualmente.',
  },
  // Lista arquivada antiga
  {
    id: nextId(), name: 'Tarefas Mudança de Apartamento (arquivada)', type: 'tarefas',
    suppliers: [],
    items: [
      makeItem(nextId(), 'Contratar empresa de mudança', 1, null, true, null),
      makeItem(nextId(), 'Embalar caixas — cozinha', 1, null, true, null),
      makeItem(nextId(), 'Embalar caixas — quartos', 1, null, true, null),
      makeItem(nextId(), 'Desligar serviços antigo endereço', 1, null, true, null),
      makeItem(nextId(), 'Assinar contrato novo apartamento', 1, null, true, null),
      makeItem(nextId(), 'Atualizar endereço nos documentos', 1, null, true, null),
    ],
    createdAt: isoDate(D.m65),
    isCompleted: true, isArchived: true, totalSpent: 0,
    linkedEventId: null, linkedPendingId: null,
    completedAt: isoDate(D.m60, '22:00:00'),
    notes: '',
  },
];

// ===========================
// ROTINAS
// ===========================

export const rotinas: Rotina[] = [
  // Exercício diário
  {
    id: nextId(), title: 'Exercício Matinal — Academia', tag_name: 'Saúde',
    start_date: '2026-01-02', end_date: '2026-12-31',
    time: '07:00', end_time: '08:30',
    recurrence_type: 'daily', weekdays: [], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Foco em hipertrofia', 'Não pular sem justificativa'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-15', '2026-06-14', '2026-06-13', '2026-06-12', '2026-06-11',
      '2026-06-10', '2026-06-09', '2026-06-08', '2026-06-07', '2026-06-06',
      '2026-06-05', '2026-06-04', '2026-06-03', '2026-06-02', '2026-06-01',
      '2026-05-31', '2026-05-30', '2026-05-29', '2026-05-28',
    ],
    linked_lists: {},
  },
  // Meditação — segunda a sexta
  {
    id: nextId(), title: 'Meditação Mindfulness 20min', tag_name: 'Bem-Estar',
    start_date: '2026-03-01', end_date: '2026-12-31',
    time: '06:30', end_time: '06:50',
    recurrence_type: 'weekly', weekdays: [0, 1, 2, 3, 4], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['App Headspace', 'Curso "Managing Anxiety" — semana 5'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-15', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09',
      '2026-06-08', '2026-06-05', '2026-06-04', '2026-06-03', '2026-06-02',
      '2026-06-01', '2026-05-29',
    ],
    linked_lists: {},
  },
  // Reunião semanal de equipe — toda segunda
  {
    id: nextId(), title: 'Daily Stand-up do Time', tag_name: 'Trabalho',
    start_date: '2026-01-05', end_date: '2026-12-31',
    time: '09:30', end_time: '09:45',
    recurrence_type: 'weekly', weekdays: [0, 1, 2, 3, 4], month_day: null, // seg-sex
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['15 min máximo', 'O que fiz, o que farei, impedimentos'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-16', '2026-06-15', '2026-06-12', '2026-06-11', '2026-06-10',
      '2026-06-09', '2026-06-08', '2026-06-05', '2026-06-04', '2026-06-03',
      '2026-06-02', '2026-06-01', '2026-05-30',
    ],
    linked_lists: {},
  },
  // Review semanal — toda segunda
  {
    id: nextId(), title: 'Weekly Review (GTD)', tag_name: 'Produtividade',
    start_date: '2026-01-05', end_date: '2026-12-31',
    time: '18:00', end_time: '19:00',
    recurrence_type: 'weekly', weekdays: [0], month_day: null, // segunda
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Revisar inbox zero', 'Atualizar projetos ativos', 'Planejar semana seguinte'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-06-15', '2026-06-08', '2026-06-01', '2026-05-25'],
    linked_lists: {},
  },
  // Corrida — terças e quintas
  {
    id: nextId(), title: 'Corrida ao ar livre — Ibirapuera', tag_name: 'Saúde',
    start_date: '2026-04-01', end_date: '2026-10-31',
    time: '06:00', end_time: '07:00',
    recurrence_type: 'weekly', weekdays: [1, 3], month_day: null, // terça, quinta
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Preparação maratona setembro', '5km mínimo', 'Pace meta: 5:30/km'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-16', '2026-06-11', '2026-06-09', '2026-06-04', '2026-06-02',
      '2026-05-28', '2026-05-26', '2026-05-21', '2026-05-19',
    ],
    linked_lists: {},
  },
  // Verificação financeira mensal
  {
    id: nextId(), title: 'Revisão Financeira Mensal', tag_name: 'Finanças',
    start_date: '2026-01-01', end_date: '2026-12-31',
    time: '20:00', end_time: '21:00',
    recurrence_type: 'monthly', month_day: 1, weekdays: [],
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Atualizar planilha de gastos', 'Comparar com orçamento', 'Reserva de emergência'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-06-01', '2026-05-01', '2026-04-01', '2026-03-01'],
    linked_lists: {},
  },
  // Limpeza profunda — toda última sexta do mês
  {
    id: nextId(), title: 'Faxina Profunda Mensal', tag_name: 'Casa',
    start_date: '2026-01-30', end_date: '2026-12-31',
    time: '09:00', end_time: '13:00',
    recurrence_type: 'monthly', month_day: 28, weekdays: [],
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Lavar janelas', 'Limpar atrás dos eletrodomésticos', 'Trocar lençóis'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-05-28', '2026-04-28', '2026-03-28'],
    linked_lists: {},
  },
  // Aniversário de relacionamento — anual
  {
    id: nextId(), title: 'Aniversário de Namoro ❤️', tag_name: 'Família',
    start_date: '2026-08-12', end_date: '2035-08-12',
    time: null, end_time: null, // dia todo
    recurrence_type: 'yearly', weekdays: [], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Planejar com antecedência', 'Jantar especial', 'Presente personalizado'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [],
    linked_lists: {},
  },
  // Backup de dados — a cada 2 semanas
  {
    id: nextId(), title: 'Backup de Dados Pessoais', tag_name: 'Tecnologia',
    start_date: '2026-01-01', end_date: '2026-12-31',
    time: '22:00', end_time: '22:30',
    recurrence_type: 'custom', weekdays: [], month_day: null,
    custom_interval: 2, custom_unit: 'weeks', custom_reps: 26,
    notes: ['HD externo + Google Drive', 'Verificar integridade dos arquivos'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-06-04', '2026-05-21', '2026-05-07', '2026-04-23'],
    linked_lists: {},
  },
  // Rotina suspensa — férias
  {
    id: nextId(), title: 'Aula de Inglês — Escola IBS', tag_name: 'Desenvolvimento',
    start_date: '2026-03-03', end_date: '2026-11-30',
    time: '19:00', end_time: '20:30',
    recurrence_type: 'weekly', weekdays: [1, 3], month_day: null, // ter e qui
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Advanced Level B2', 'Professor: Michael (inglês nativo UK)', 'Material: livro Market Leader'],
    is_suspended: true, suspended_from_date: '2026-08-17', // suspensa nas férias de agosto
    completed_instances: [
      '2026-06-16', '2026-06-11', '2026-06-09', '2026-06-04', '2026-06-02',
      '2026-05-28', '2026-05-26',
    ],
    linked_lists: {},
  },
  // Revisão bimestral de investimentos
  {
    id: nextId(), title: 'Revisão Carteira de Investimentos', tag_name: 'Finanças',
    start_date: '2026-01-15', end_date: '2026-12-15',
    time: '21:00', end_time: null,
    recurrence_type: 'custom', weekdays: [], month_day: null,
    custom_interval: 2, custom_unit: 'months', custom_reps: 6,
    notes: ['B3 — carteira de ações', 'Rebalancear se desvio > 5%', 'Registrar DY e rentabilidade'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-03-15', '2026-01-15'],
    linked_lists: {},
  },
  // Vitaminas diárias — manhã
  {
    id: nextId(), title: 'Tomar vitaminas e suplementos', tag_name: 'Saúde',
    start_date: '2026-01-01', end_date: '2026-12-31',
    time: '07:30', end_time: null,
    recurrence_type: 'daily', weekdays: [], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Vitamina D3', 'Ômega 3', 'Magnésio', 'Probiótico'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-16', '2026-06-15', '2026-06-14', '2026-06-13', '2026-06-12',
      '2026-06-11', '2026-06-10', '2026-06-09', '2026-06-08', '2026-06-07',
      '2026-06-06', '2026-06-05', '2026-06-04', '2026-06-03', '2026-06-02',
    ],
    linked_lists: {},
  },
  // Leitura noturna
  {
    id: nextId(), title: 'Leitura — 30min antes de dormir', tag_name: 'Desenvolvimento',
    start_date: '2026-05-01', end_date: '2026-12-31',
    time: '22:30', end_time: '23:00',
    recurrence_type: 'daily', weekdays: [], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Sem telas 30min antes', 'Livros em andamento: Atomic Habits, Clean Code'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-16', '2026-06-15', '2026-06-14', '2026-06-12', '2026-06-11',
      '2026-06-10', '2026-06-09',
    ],
    linked_lists: {},
  },
  // Planejamento diário
  {
    id: nextId(), title: 'Planejamento do Dia (Daily Planning)', tag_name: 'Produtividade',
    start_date: '2026-01-01', end_date: '2026-12-31',
    time: '08:30', end_time: '08:45',
    recurrence_type: 'weekly', weekdays: [0, 1, 2, 3, 4], month_day: null,
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['3 prioridades do dia', 'Revisar calendário', 'Bloquear tempo para deep work'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: [
      '2026-06-16', '2026-06-15', '2026-06-12', '2026-06-11', '2026-06-10',
      '2026-06-09', '2026-06-08', '2026-06-05', '2026-06-04', '2026-06-03',
      '2026-06-02', '2026-06-01',
    ],
    linked_lists: {},
  },
  // Check peso semanal
  {
    id: nextId(), title: 'Pesagem Semanal — Controle de Peso', tag_name: 'Saúde',
    start_date: '2026-01-05', end_date: '2026-12-31',
    time: '07:00', end_time: null,
    recurrence_type: 'weekly', weekdays: [0], month_day: null, // segunda em jejum
    custom_interval: null, custom_unit: null, custom_reps: null,
    notes: ['Mesma roupa, mesmo horário', 'Registrar no app Health'],
    is_suspended: false, suspended_from_date: null,
    completed_instances: ['2026-06-15', '2026-06-08', '2026-06-01', '2026-05-25', '2026-05-18'],
    linked_lists: {},
  },
];

// ===========================
// AGREGADO FINAL
// ===========================

// ===========================
// EVENTOS HISTÓRICOS EM MASSA
// Cobrem o período de Março a Junho de 2026 de forma densa
// Simula usuário ativo com múltiplos eventos por semana
// ===========================

function makeSimpleEvent(
  title: string, tag: string, dateStr: string, time: string,
  completed: boolean, notes: string[] = []
): Event {
  return {
    id: nextId(), title, tag_name: tag,
    start_time: isoDate(dateStr, time),
    is_completed: completed, is_pending: false,
    steps: [], notes,
    linkedListId: null, serieId: null, isRecurring: false,
    isScheduledFromPending: false, isPreFilled: false,
    sharedWithUid: null, isSharedWithMe: false,
    completedAt: completed ? isoDate(dateStr, '23:00:00') : null,
  };
}

export const historicalEvents: Event[] = [
  // Março 2026
  makeSimpleEvent('Reunião kick-off projeto Delta', 'Trabalho', '2026-03-18', '09:00:00', true, ['OKRs definidos']),
  makeSimpleEvent('Consulta oftalmo — prescrição óculos', 'Saúde', '2026-03-19', '10:00:00', true, ['Grau: -2.5 OE, -2.0 OD']),
  makeSimpleEvent('Almoço de negócios — cliente Omega', 'Trabalho', '2026-03-20', '12:00:00', true),
  makeSimpleEvent('Pagamento aluguel março', 'Finanças', '2026-03-20', '09:00:00', true, ['R$ 1.850,00 pix']),
  makeSimpleEvent('Webinar: Clean Architecture com Uncle Bob', 'Desenvolvimento', '2026-03-21', '14:00:00', true),
  makeSimpleEvent('Troca pneus dianteiros', 'Veículo', '2026-03-22', '08:00:00', true, ['R$ 680,00 — 2 pneus Continental']),
  makeSimpleEvent('Retorno dentista — ajuste ortodôntico', 'Saúde', '2026-03-23', '15:30:00', true),
  makeSimpleEvent('Compra passagens Natal 2026', 'Viagem', '2026-03-24', '20:00:00', true, ['GRU-NAT 23/12 — R$ 890/pessoa']),
  makeSimpleEvent('Entrevista candidato UX Designer', 'Trabalho', '2026-03-25', '14:00:00', true, ['Aprovada — início 15/04']),
  makeSimpleEvent('Pagamento academia — mensalidade', 'Finanças', '2026-03-25', '10:00:00', true),
  makeSimpleEvent('Reunião OKRs Q1 — retrospectiva', 'Trabalho', '2026-03-26', '09:00:00', true, ['Q1: 78% dos OKRs atingidos']),
  makeSimpleEvent('Consulta nutricional — protocolo novo', 'Saúde', '2026-03-27', '11:00:00', true, ['Dieta mediterrânea', '2400kcal/dia']),
  makeSimpleEvent('Jantar amigos — aniversário Pedro', 'Social', '2026-03-28', '20:00:00', true),
  makeSimpleEvent('Instalação alarme residencial', 'Casa', '2026-03-30', '09:00:00', true, ['Monitorado 24h — R$ 89/mês']),
  makeSimpleEvent('Renovação matrícula curso inglês', 'Desenvolvimento', '2026-03-31', '16:00:00', true),
  // Abril 2026
  makeSimpleEvent('Declaração IR 2025 — entrega', 'Finanças', '2026-04-01', '23:00:00', true, ['Restituição: R$ 1.240,00']),
  makeSimpleEvent('Reunião de planejamento Sprint 10', 'Trabalho', '2026-04-02', '09:00:00', true),
  makeSimpleEvent('Manutenção preventiva HVAC', 'Casa', '2026-04-03', '08:00:00', true, ['R$ 450,00 — válido 12 meses']),
  makeSimpleEvent('Compra de ações — aporte mensal', 'Finanças', '2026-04-05', '09:00:00', true, ['PETR4: 50un, VALE3: 30un']),
  makeSimpleEvent('Webinar automação de testes com Cypress', 'Desenvolvimento', '2026-04-07', '19:00:00', true),
  makeSimpleEvent('Reunião com fornecedor AWS', 'Trabalho', '2026-04-08', '10:00:00', true, ['Negociação desconto reserved instances']),
  makeSimpleEvent('Festa de páscoa família', 'Família', '2026-04-09', '12:00:00', true),
  makeSimpleEvent('Pagamento IPVA — cota única', 'Finanças', '2026-04-10', '10:00:00', true, ['R$ 3.240,00 — desconto 10%']),
  makeSimpleEvent('Check-up médico anual', 'Saúde', '2026-04-11', '08:00:00', true, ['Tudo normal', 'Colesterol levemente alto']),
  makeSimpleEvent('Workshop CI/CD — GitHub Actions', 'Desenvolvimento', '2026-04-13', '09:00:00', true),
  makeSimpleEvent('Sprint 10 Review', 'Trabalho', '2026-04-14', '16:00:00', true, ['12 de 15 histórias entregues']),
  makeSimpleEvent('Troca de óleo carro — 5W40', 'Veículo', '2026-04-15', '08:00:00', true, ['R$ 280,00 Shell Helix']),
  makeSimpleEvent('Jogo de futebol com amigos', 'Esportes', '2026-04-16', '07:00:00', true),
  makeSimpleEvent('Pagamento aluguel abril', 'Finanças', '2026-04-20', '09:00:00', true),
  makeSimpleEvent('Reunião board de investimentos', 'Finanças', '2026-04-21', '14:00:00', true, ['Rebalancear 5% para renda fixa']),
  makeSimpleEvent('Consulta dermatológica — biopsia', 'Saúde', '2026-04-22', '09:00:00', true, ['Resultado benigno']),
  makeSimpleEvent('Apresentação resultado Q1 para diretoria', 'Trabalho', '2026-04-23', '09:00:00', true, ['Melhor trimestre desde 2024']),
  makeSimpleEvent('Aniversário Carlos — almoço', 'Social', '2026-04-24', '12:00:00', true),
  makeSimpleEvent('Reunião planejamento Sprint 11', 'Trabalho', '2026-04-27', '09:00:00', true),
  makeSimpleEvent('Assinatura contrato home office', 'Trabalho', '2026-04-28', '16:00:00', true, ['Work from anywhere aprovado']),
  makeSimpleEvent('Cinema — novo filme Marvel', 'Lazer', '2026-04-29', '20:00:00', true),
  // Maio 2026
  makeSimpleEvent('Reunião de retrospectiva Sprint 10', 'Trabalho', '2026-05-02', '17:00:00', true),
  makeSimpleEvent('Treino funcional avaliação física', 'Saúde', '2026-05-04', '07:00:00', true, ['BF: 18.2%', 'IMC: 24.3']),
  makeSimpleEvent('Pagamento cartão maio', 'Finanças', '2026-05-05', '23:59:00', true, ['R$ 4.120,00']),
  makeSimpleEvent('Reunião 1:1 com gerente', 'Trabalho', '2026-05-06', '15:00:00', true, ['Promoção para Senior aprovada!']),
  makeSimpleEvent('Webinar React 19 — novidades', 'Desenvolvimento', '2026-05-07', '19:00:00', true),
  makeSimpleEvent('Pagamento aluguel maio', 'Finanças', '2026-05-08', '09:00:00', true),
  makeSimpleEvent('Dia das mães — jantar família', 'Família', '2026-05-11', '19:30:00', true, ['Restaurante favorito da mãe']),
  makeSimpleEvent('Sprint 11 Review', 'Trabalho', '2026-05-12', '16:00:00', true),
  makeSimpleEvent('Compra de ações — aporte mensal', 'Finanças', '2026-05-13', '09:00:00', true, ['ITSA4: 100un, KNRI11: 20un']),
  makeSimpleEvent('Avaliação de desempenho — time', 'Trabalho', '2026-05-14', '14:00:00', true, ['Feedback positivo do time']),
  makeSimpleEvent('Conserto portão da garagem', 'Casa', '2026-05-15', '10:00:00', true, ['Motor trocado — R$ 890,00']),
  makeSimpleEvent('Reunião fornecedor cloud — Azure', 'Trabalho', '2026-05-18', '10:00:00', true),
  makeSimpleEvent('Consulta psicólogo — sessão 12', 'Saúde', '2026-05-19', '18:00:00', true),
  makeSimpleEvent('Reunião planejamento Sprint 12', 'Trabalho', '2026-05-20', '09:00:00', true),
  makeSimpleEvent('Treino preparatório — meia maratona', 'Esportes', '2026-05-21', '06:00:00', true, ['12km — pace 5:45/km']),
  makeSimpleEvent('Inspeção veicular anual', 'Veículo', '2026-05-22', '08:00:00', true, ['Aprovado']),
  makeSimpleEvent('Webinar: Kubernetes e containers', 'Desenvolvimento', '2026-05-25', '19:00:00', true),
  makeSimpleEvent('Aniversário da avó — visita', 'Família', '2026-05-26', '11:00:00', true),
  makeSimpleEvent('Pagamento cartão crédito 2', 'Finanças', '2026-05-27', '23:59:00', true, ['R$ 2.890,00']),
  makeSimpleEvent('Sprint 12 Review', 'Trabalho', '2026-05-28', '16:00:00', true, ['Feature flag sistema novo ativo']),
  makeSimpleEvent('Consulta psicólogo — sessão 13', 'Saúde', '2026-05-29', '18:00:00', true),
  makeSimpleEvent('Compra óculos novos', 'Saúde', '2026-05-30', '14:00:00', true, ['Chilli Beans — R$ 680,00']),
  // Junho 2026 (já passou)
  makeSimpleEvent('Pagamento aluguel junho', 'Finanças', '2026-06-01', '09:00:00', true),
  makeSimpleEvent('Reunião planejamento Sprint 13', 'Trabalho', '2026-06-02', '09:00:00', true),
  makeSimpleEvent('Compra de ações — aporte mensal', 'Finanças', '2026-06-03', '09:00:00', true, ['HGLG11: 15un, XPML11: 20un']),
  makeSimpleEvent('Sessão fisioterapia 1/6', 'Saúde', '2026-06-04', '11:00:00', true),
  makeSimpleEvent('Consulta psicólogo — sessão 14', 'Saúde', '2026-06-05', '18:00:00', true),
  makeSimpleEvent('Almoço de trabalho — CTO', 'Trabalho', '2026-06-06', '12:00:00', true, ['Budget aprovado para time crescer']),
  makeSimpleEvent('Meia maratona São Paulo — 21km', 'Esportes', '2026-06-07', '06:30:00', true, ['Tempo: 2h14min — PR!']),
  makeSimpleEvent('Sessão fisioterapia 2/6', 'Saúde', '2026-06-09', '11:00:00', true),
  makeSimpleEvent('Renovação assinatura Adobe CC', 'Tecnologia', '2026-06-10', '09:00:00', true, ['R$ 350/mês — plano empresarial']),
  makeSimpleEvent('Sprint 13 Review', 'Trabalho', '2026-06-11', '16:00:00', true),
  makeSimpleEvent('Encontro co-founders startup', 'Trabalho', '2026-06-12', '14:00:00', true, ['Pivô estratégico decidido']),
  makeSimpleEvent('Sessão fisioterapia 3/6', 'Saúde', '2026-06-13', '11:00:00', true),
  makeSimpleEvent('Churrasco fim de semana', 'Lazer', '2026-06-14', '12:00:00', true, ['Casa do João — 15 pessoas']),
  makeSimpleEvent('Consulta psicólogo — sessão 15', 'Saúde', '2026-06-16', '18:00:00', true),
  // Eventos futuros adicionais
  makeSimpleEvent('Reunião planejamento Sprint 14', 'Trabalho', '2026-06-22', '09:00:00', false),
  makeSimpleEvent('Sessão fisioterapia 4/6', 'Saúde', '2026-06-23', '11:00:00', false),
  makeSimpleEvent('Compra de ações — aporte mensal', 'Finanças', '2026-07-03', '09:00:00', false),
  makeSimpleEvent('Pagamento aluguel julho', 'Finanças', '2026-07-01', '09:00:00', false),
  makeSimpleEvent('Sprint 14 Review', 'Trabalho', '2026-07-09', '16:00:00', false),
  makeSimpleEvent('Consulta psicólogo — sessão 16', 'Saúde', '2026-07-10', '18:00:00', false),
  makeSimpleEvent('Pagamento cartão julho', 'Finanças', '2026-07-15', '23:59:00', false),
  makeSimpleEvent('Reunião planejamento Sprint 15', 'Trabalho', '2026-07-20', '09:00:00', false),
  makeSimpleEvent('Compra de ações — aporte agosto', 'Finanças', '2026-08-03', '09:00:00', false),
  makeSimpleEvent('Pagamento aluguel agosto', 'Finanças', '2026-08-01', '09:00:00', false),
  makeSimpleEvent('Sprint 15 Review', 'Trabalho', '2026-08-06', '16:00:00', false),
  makeSimpleEvent('Consulta psicólogo — sessão 17', 'Saúde', '2026-08-07', '18:00:00', false),
  makeSimpleEvent('Treino preparatório maratona — 30km', 'Esportes', '2026-08-09', '06:00:00', false, ['Último longão antes da maratona']),
  makeSimpleEvent('Reunion trimestral Q3 — diretores', 'Trabalho', '2026-08-12', '09:00:00', false),
  makeSimpleEvent('Pagamento cartão agosto', 'Finanças', '2026-08-14', '23:59:00', false),
  makeSimpleEvent('Renovação plano de saúde', 'Finanças', '2026-08-20', '10:00:00', false, ['Novo contrato 2026-2027']),
  makeSimpleEvent('Pagamento aluguel setembro', 'Finanças', '2026-09-01', '09:00:00', false),
  makeSimpleEvent('Maratona São Paulo — 42km', 'Esportes', '2026-09-07', '06:00:00', false, ['Meta: sub 4h']),
  makeSimpleEvent('Compra de ações — aporte setembro', 'Finanças', '2026-09-03', '09:00:00', false),
  makeSimpleEvent('Pagamento cartão setembro', 'Finanças', '2026-09-10', '23:59:00', false),
  makeSimpleEvent('Sprint 17 Review', 'Trabalho', '2026-09-14', '16:00:00', false),
  // Pendências adicionais concluídas (histórico março a junho)
  makeSimpleEvent('Cancelar assinatura serviço antigo', 'Finanças', '2026-03-20', '10:00:00', true),
  makeSimpleEvent('Atualizar dados bancários na empresa', 'Trabalho', '2026-03-22', '14:00:00', true),
  makeSimpleEvent('Comprar presente aniversário pai', 'Família', '2026-03-25', '16:00:00', true, ['Livro + camisa polo']),
  makeSimpleEvent('Renovar seguro vida', 'Finanças', '2026-03-28', '10:00:00', true),
  makeSimpleEvent('Configurar 2FA em todas as contas', 'Tecnologia', '2026-04-01', '20:00:00', true, ['Google Authenticator']),
  makeSimpleEvent('Doação de roupas ONG', 'Social', '2026-04-04', '10:00:00', true, ['3 sacolas grandes']),
  makeSimpleEvent('Reserva mesa restaurante mãe', 'Família', '2026-04-10', '11:00:00', true),
  makeSimpleEvent('Avaliação física — academia', 'Saúde', '2026-04-12', '08:00:00', true, ['IMC 24.1, BF 18%']),
  makeSimpleEvent('Comprar livro Arquitetura Limpa', 'Desenvolvimento', '2026-04-15', '18:00:00', true),
  makeSimpleEvent('Renovar assinatura GitHub Pro', 'Tecnologia', '2026-04-18', '09:00:00', true),
  makeSimpleEvent('Transferência para poupança', 'Finanças', '2026-04-20', '09:00:00', true, ['R$ 1.500,00']),
  makeSimpleEvent('Atualizar antivírus servidores', 'Tecnologia', '2026-04-22', '20:00:00', true),
  makeSimpleEvent('Comprar capacete moto novo', 'Veículo', '2026-04-25', '14:00:00', true, ['Pro-Tork 788 R$ 289,00']),
  makeSimpleEvent('Jantar especial dia das mães', 'Família', '2026-04-28', '19:00:00', true),
  makeSimpleEvent('Tirar foto profissional atualizada', 'Desenvolvimento', '2026-05-02', '10:00:00', true),
  makeSimpleEvent('Aplicar vacina gripe', 'Saúde', '2026-05-05', '08:00:00', true),
  makeSimpleEvent('Limpar histórico e cache do notebook', 'Tecnologia', '2026-05-08', '20:00:00', true),
  makeSimpleEvent('Cancelar Netflix — testar Paramount+', 'Lazer', '2026-05-10', '10:00:00', true),
  makeSimpleEvent('Revisar currículo e LinkedIn', 'Desenvolvimento', '2026-05-13', '19:00:00', true, ['Senior Developer — 8 anos exp']),
  makeSimpleEvent('Comprar tênis corrida novo', 'Esportes', '2026-05-15', '14:00:00', true, ['Nike Pegasus 40 R$ 689,00']),
  makeSimpleEvent('Organizar documentos digitais', 'Organização', '2026-05-18', '20:00:00', true),
  makeSimpleEvent('Pedir aumento formal RH', 'Trabalho', '2026-05-20', '14:00:00', true, ['Aprovado 15% a partir de julho']),
  makeSimpleEvent('Comprar melatonina para dormir melhor', 'Saúde', '2026-05-22', '10:00:00', true),
  makeSimpleEvent('Testar novo app de meditação Calm', 'Bem-Estar', '2026-05-25', '22:00:00', true),
  makeSimpleEvent('Enviar para mãe tutorial WhatsApp', 'Família', '2026-05-28', '18:00:00', true),
  makeSimpleEvent('Reparar buraco parede do quarto', 'Casa', '2026-06-01', '09:00:00', true, ['Massa corrida + lixa']),
  makeSimpleEvent('Atualizar sistema operacional', 'Tecnologia', '2026-06-03', '20:00:00', true, ['Ubuntu 24.04 LTS']),
  makeSimpleEvent('Reservar voo retorno das férias', 'Viagem', '2026-06-05', '10:00:00', true),
  makeSimpleEvent('Comprar proteína para suplementação', 'Saúde', '2026-06-08', '10:00:00', true, ['Whey Protein 3kg R$ 280,00']),
  makeSimpleEvent('Enviar relatório de KPIs para board', 'Trabalho', '2026-06-10', '18:00:00', true, ['Crescimento 23% YoY']),
  makeSimpleEvent('Fazer backup fotos Google Photos', 'Tecnologia', '2026-06-12', '21:00:00', true),
  makeSimpleEvent('Comprar remédio para o coração — pai', 'Família', '2026-06-14', '10:00:00', true),
  makeSimpleEvent('Lavar carro + higienização interna', 'Veículo', '2026-06-16', '09:00:00', true, ['R$ 180,00']),
  // Eventos futuros extras
  makeSimpleEvent('Pagamento condomínio julho', 'Finanças', '2026-07-05', '10:00:00', false),
  makeSimpleEvent('Sessão fisioterapia 5/6', 'Saúde', '2026-06-25', '11:00:00', false),
  makeSimpleEvent('Sessão fisioterapia 6/6', 'Saúde', '2026-07-02', '11:00:00', false),
  makeSimpleEvent('Consulta nutricionista — retorno', 'Saúde', '2026-07-06', '11:00:00', false),
  makeSimpleEvent('Reunião parceria estratégica', 'Trabalho', '2026-07-13', '10:00:00', false),
  makeSimpleEvent('Vencimento cartão 3', 'Finanças', '2026-07-20', '23:59:00', false),
  makeSimpleEvent('Revisão orçamento semestral', 'Finanças', '2026-07-25', '20:00:00', false),
  makeSimpleEvent('Compra equipamento fotografia', 'Lazer', '2026-08-03', '10:00:00', false, ['Lente 50mm f/1.8']),
  makeSimpleEvent('Aniversário sobrinho Daniel', 'Família', '2026-08-08', '16:00:00', false),
  makeSimpleEvent('Pré-matrícula faculdade MBA', 'Desenvolvimento', '2026-08-15', '10:00:00', false),
  makeSimpleEvent('Mudança de endereço nos documentos', 'Documentos', '2026-08-20', '10:00:00', false),
  makeSimpleEvent('Degustação vinho premium — confraria', 'Lazer', '2026-08-22', '19:00:00', false),
  makeSimpleEvent('Pagamento condomínio agosto', 'Finanças', '2026-08-05', '10:00:00', false),
  makeSimpleEvent('Treino simulado maratona — 35km', 'Esportes', '2026-08-23', '06:00:00', false),
  makeSimpleEvent('Consulta pré-anestesia (cirurgia cotovelo)', 'Saúde', '2026-08-25', '14:00:00', false),
  makeSimpleEvent('Renovar domínio do site pessoal', 'Tecnologia', '2026-08-28', '10:00:00', false),
  makeSimpleEvent('Jantar de despedida amigo Pedro', 'Social', '2026-09-02', '19:30:00', false),
  makeSimpleEvent('Pagamento condomínio setembro', 'Finanças', '2026-09-05', '10:00:00', false),
  makeSimpleEvent('Webinar Fintechs 2027', 'Desenvolvimento', '2026-09-08', '19:00:00', false),
  makeSimpleEvent('Ingresso Lollapalooza 2027 — early bird', 'Lazer', '2026-09-10', '10:00:00', false),
  makeSimpleEvent('Reunião retrospectiva Q3', 'Trabalho', '2026-09-15', '09:00:00', false),
  // Lote final para garantir 500+ registros
  makeSimpleEvent('Revisão plano de carreira', 'Desenvolvimento', '2026-03-17', '19:00:00', true),
  makeSimpleEvent('Pagar conta de luz', 'Finanças', '2026-03-19', '09:00:00', true),
  makeSimpleEvent('Comprar livro TypeScript Deep Dive', 'Desenvolvimento', '2026-03-23', '18:00:00', true),
  makeSimpleEvent('Pagar conta de água', 'Finanças', '2026-04-19', '09:00:00', true),
  makeSimpleEvent('Pagar conta de luz abril', 'Finanças', '2026-04-19', '09:30:00', true),
  makeSimpleEvent('Renovar antivirus pessoal', 'Tecnologia', '2026-04-30', '09:00:00', true),
  makeSimpleEvent('Pagar conta de água maio', 'Finanças', '2026-05-19', '09:00:00', true),
  makeSimpleEvent('Pagar conta de luz maio', 'Finanças', '2026-05-19', '09:30:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-05-03', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-05-10', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-05-17', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-05-24', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-05-31', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-06-07', '19:00:00', true),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-06-14', '19:00:00', true),
  makeSimpleEvent('Pagar conta de água junho', 'Finanças', '2026-06-19', '09:00:00', false),
  makeSimpleEvent('Pagar conta de luz junho', 'Finanças', '2026-06-19', '09:30:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-06-21', '19:00:00', false),
  makeSimpleEvent('Pagar conta de água julho', 'Finanças', '2026-07-19', '09:00:00', false),
  makeSimpleEvent('Pagar conta de luz julho', 'Finanças', '2026-07-19', '09:30:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-07-05', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-07-12', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-07-19', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-07-26', '19:00:00', false),
  makeSimpleEvent('Pagar conta de água agosto', 'Finanças', '2026-08-19', '09:00:00', false),
  makeSimpleEvent('Pagar conta de luz agosto', 'Finanças', '2026-08-19', '09:30:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-08-02', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-08-09', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-08-16', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-08-30', '19:00:00', false),
  makeSimpleEvent('Pagar conta de água setembro', 'Finanças', '2026-09-09', '09:00:00', false),
  makeSimpleEvent('Pagar conta de luz setembro', 'Finanças', '2026-09-09', '09:30:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-09-06', '19:00:00', false),
  makeSimpleEvent('Ligar para pai — check weekly', 'Família', '2026-09-13', '19:00:00', false),
];

export const allEvents: Event[] = [
  ...scheduledEvents,
  ...completedEvents,
  ...postponedAsPending,
  ...openPendings,
  ...completedPendings,
  ...historicalEvents,
];

export const allLists: ShoppingList[] = [
  ...shoppingLists,
  ...taskLists,
];

// Contagem de registros
export const seedStats = {
  scheduledEvents: scheduledEvents.length,
  completedEvents: completedEvents.length,
  postponedAsPending: postponedAsPending.length,
  openPendings: openPendings.length,
  completedPendings: completedPendings.length,
  historicalEvents: historicalEvents.length,
  totalEvents: allEvents.length,
  shoppingLists: shoppingLists.length,
  taskLists: taskLists.length,
  totalLists: allLists.length,
  totalListItems: allLists.reduce((acc, l) => acc + l.items.length, 0),
  rotinas: rotinas.length,
  totalRotinaInstances: rotinas.reduce((acc, r) => acc + r.completed_instances.length, 0),
  get total() {
    return (
      this.totalEvents +
      this.totalLists +
      this.totalListItems +
      this.rotinas +
      this.totalRotinaInstances
    );
  },
};
