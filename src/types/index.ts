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
  type: 'compras' | 'tarefas';
  suppliers: string[];
  items: ListItem[];
  createdAt: string;
  isCompleted: boolean;
  isArchived: boolean;
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

// Catálogo universal de itens já adicionados (persiste mesmo após excluir listas).
// Alimenta a busca "Pesquisar meus itens" dentro de Adicionar Item.
export interface CatalogItem {
  name: string;
  type: 'compras' | 'tarefas';
  unit: string | null;
  lastPrice: number | null;
  priceType?: 'unit' | 'total';
  lastUsedAt: number; // Date.now()
  useCount: number;
}

export type ScreenName = 'listas' | 'config';

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
