// ===========================
// TIPOS GLOBAIS DO TASKFLOW
// ===========================

export interface Step {
  id: number;
  text: string;
  completed: boolean;
}

export interface Event {
  id: number;
  title: string;
  tag_name: string;
  start_time: string | null;
  is_completed: boolean;
  is_pending: boolean;
  steps: Step[];
  notes: string[];
  linkedListId?: number | null;
  serieId?: string | null;
  isRecurring?: boolean;
  isScheduledFromPending?: boolean;
  isPreFilled?: boolean;
  // Compartilhamento
  sharedWithUid?: string | null; // UID único do parceiro (máx. 1 parceiro)
  ownerUid?: string;             // UID do dono (preenchido em itens recebidos)
  isSharedWithMe?: boolean;      // true = veio de outro usuário
  // Auditoria
  completedAt?: string | null; // ISO timestamp de quando foi concluído
  createdAt?: string | null;   // ISO timestamp de quando a pendência foi criada
}

export interface ListItem {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  isChecked: boolean;
  price: number | null;
  priceType?: 'unit' | 'total'; // 'unit' = preço por unidade (multiplica qty), 'total' = preço já é o total
}

export interface ShoppingList {
  id: number;
  name: string;
  type: 'compras' | 'tarefas';
  suppliers: string[];
  items: ListItem[];
  createdAt: string;
  isCompleted: boolean;
  isArchived: boolean;
  totalSpent: number;
  linkedEventId?: number | null;
  linkedPendingId?: number | null;
  linkedRotinaId?: number | null;
  linkedRotinaInstance?: string | null;
  // Compartilhamento
  sharedWithUid?: string | null; // UID único do parceiro (máx. 1 parceiro)
  ownerUid?: string;
  isSharedWithMe?: boolean;
  // Tag de categoria
  tag_name?: string;
  // Notas pessoais (texto livre)
  notes?: string;
  // Auditoria
  completedAt?: string | null; // ISO timestamp de quando foi concluída
}

// ===========================
// ROTINAS
// ===========================

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type CustomUnit = 'months' | 'weeks' | 'days' | 'hours' | 'minutes';

export interface Rotina {
  id: number;
  title: string;
  tag_name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (max 2 anos; auto-calc para custom)
  time: string | null;     // HH:MM ou null = Dia Todo (hora início da ocorrência)
  end_time?: string | null; // HH:MM ou null (hora fim da ocorrência)
  recurrence_type: RecurrenceType;
  weekdays: number[];       // 0=SEG, 1=TER, 2=QUA, 3=QUI, 4=SEX, 5=SAB, 6=DOM (max 6)
  month_day: number | null; // para 'monthly': 1-31
  custom_interval: number | null;
  custom_unit: CustomUnit | null;
  custom_reps: number | null; // para 'custom': 1-15 repetições
  notes: string[];
  is_suspended: boolean;
  suspended_from_date: string | null; // YYYY-MM-DD
  completed_instances: string[];      // array de instanceKeys
  linked_lists: Record<string, number>; // instanceKey → listId
}

export interface RotinaInstance {
  rotinaId: number;
  instanceKey: string; // YYYY-MM-DD ou YYYY-MM-DDTHH:MM
  date: string;        // YYYY-MM-DD
  time: string | null; // HH:MM ou null
  title: string;
  tag_name: string;
  notes: string[];
  is_completed: boolean;
  is_suspended: boolean;
  linkedListId: number | null;
}

// ===========================
// HIDRATAÇÃO
// ===========================

export interface WaterEntry {
  id: number;
  timestamp: string;  // ISO
  amountMl: number;
}

export interface WaterDayLog {
  date: string;          // 'YYYY-MM-DD'
  entries: WaterEntry[];
}

export type ScreenName = 'eventos' | 'calendario' | 'listas' | 'pendencias' | 'config';

export const AVAILABLE_UNITS = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'g' },
  { value: 'litros', label: 'Litros' },
  { value: 'ml', label: 'ml' },
  { value: 'mt', label: 'mt' },
  { value: 'cm', label: 'cm' },
  { value: 'porção', label: 'Porção' },
  { value: 'pedaço', label: 'Pedaço' },
];
