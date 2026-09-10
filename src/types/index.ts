// ===========================
// TIPOS GLOBAIS DO SUPLISTA
// ===========================

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
  suppliers: string[];
  items: ListItem[];
  createdAt: string;
  isCompleted: boolean;
  isArchived: boolean;
  archivedAt?: string | null; // ISO timestamp de quando foi arquivada
  totalSpent: number;
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

export type ScreenName = 'listas' | 'config' | 'arquivo';

// "tarefa" é uma "unidade": um item classificado como tarefa aparece só com o
// nome (sem quantidade). Não existe mais lista de compras vs lista de tarefas —
// uma lista pode misturar itens de compra e tarefas.
export const AVAILABLE_UNITS = [
  { value: 'tarefa', label: 'Tarefa' },
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

export const TASK_UNIT = 'tarefa';
