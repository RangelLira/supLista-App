// ===========================
// DEV — GERADOR DE DADOS FAKE + RELATÓRIO
// ===========================
// Só carregado sob __DEV__. Cria um cenário de uso intenso (sem compartilhamento):
//   • >= 100 listas, >= 4000 itens
//   • 1 lista com 1000 itens, >= 4 listas com > 100 itens, resto com <= 10
//   • mistura os 7 tags preset + tags personalizadas
// PRNG com seed fixa → duas execuções com a mesma seed produzem o mesmo cenário
// (o relatório bate com os dados).

import { CatalogItem, ListItem, ShoppingList } from '../types';
import { seedCatalogFromLists } from '../utils/storage';
import {
  CUSTOM_TAGS, GROCERY, LIST_NAMES_SHOPPING, LIST_NAMES_TASKS, TASKS, UNITS,
} from './pools';

const PRESET_TAGS = ['Trabalho', 'Pessoal', 'Saúde', 'Família', 'Financeiro', 'Estudos', 'Lazer'];

// mulberry32 — PRNG determinístico, suficiente para dados de teste.
/* eslint-disable no-bitwise */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

export interface FakeDataOptions {
  seed?: number;
  baselineLists?: number;
  baselineItems?: number;
  baselineCatalog?: number;
}

export interface FakeDataResult {
  lists: ShoppingList[];
  catalog: CatalogItem[];
  report: string;
}

const two = (n: number) => String(n).padStart(2, '0');
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

export function generateFakeData(opts: FakeDataOptions = {}): FakeDataResult {
  const rnd = mulberry32(opts.seed ?? 20260910);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
  const chance = (p: number) => rnd() < p;

  const NOW = Date.now();
  const DAY = 86400000;
  let idSeq = NOW;
  const nextId = () => (idSeq -= 7); // decrescente: único entre si e abaixo de qualquer Date.now() futuro

  const allTags = [...PRESET_TAGS, ...CUSTOM_TAGS];

  const makeItems = (n: number, type: 'compras' | 'tarefas'): ListItem[] => {
    const pool = type === 'compras' ? GROCERY : TASKS;
    const items: ListItem[] = [];
    for (let j = 0; j < n; j++) {
      const hasPrice = type === 'compras' && chance(0.6);
      items.push({
        id: nextId(),
        name: pick(pool),
        quantity: type === 'compras' ? int(1, 12) : 1,
        unit: type === 'compras' ? pick(UNITS) : null,
        isChecked: chance(0.5),
        price: hasPrice ? Math.round(rnd() * 4900 + 50) / 100 : null,
        priceType: chance(0.8) ? 'unit' : 'total',
      });
    }
    return items;
  };

  let seq = 0;
  const makeList = (nItems: number): ShoppingList => {
    seq += 1;
    const type: 'compras' | 'tarefas' = chance(0.65) ? 'compras' : 'tarefas';
    const base = type === 'compras' ? pick(LIST_NAMES_SHOPPING) : pick(LIST_NAMES_TASKS);
    const createdAt = new Date(NOW - int(0, 365) * DAY).toISOString();
    const isCompleted = chance(0.2);
    return {
      id: nextId(),
      name: `${base} #${seq}`,
      type,
      suppliers: [],
      items: makeItems(nItems, type),
      createdAt,
      isCompleted,
      isArchived: false,
      totalSpent: 0,
      completedAt: isCompleted ? createdAt : null,
      tag_name: pick(allTags),
      notes: chance(0.12) ? 'Nota de teste gerada pelo Fake user.' : undefined,
    };
  };

  const lists: ShoppingList[] = [];
  lists.push(makeList(1000));                        // 1 gigante
  for (let i = 0; i < 8; i++) lists.push(makeList(int(120, 320))); // 8 grandes (> 100)

  // Listas normais (0–10 itens) até bater os pisos: >= 4300 itens e >= 130 normais.
  const TARGET_ITEMS = 4300;
  const MIN_NORMAL = 130;
  const MAX_NORMAL = 500;
  let normalCount = 0;
  const countItems = () => lists.reduce((s, l) => s + l.items.length, 0);
  while ((countItems() < TARGET_ITEMS || normalCount < MIN_NORMAL) && normalCount < MAX_NORMAL) {
    lists.push(makeList(int(0, 10)));
    normalCount += 1;
  }

  const catalog = seedCatalogFromLists(lists);
  return { lists, catalog, report: buildReport(lists, catalog, opts) };
}

function buildReport(lists: ShoppingList[], catalog: CatalogItem[], opts: FakeDataOptions): string {
  const L = lists.length;
  const items = lists.flatMap(l => l.items);
  const I = items.length || 1;
  const compras = lists.filter(l => l.type === 'compras').length;
  const tarefas = lists.filter(l => l.type === 'tarefas').length;
  const completed = lists.filter(l => l.isCompleted).length;
  const checked = items.filter(i => i.isChecked).length;
  const priced = items.filter(i => i.price != null).length;
  const empty = lists.filter(l => l.items.length === 0).length;
  const big = lists.filter(l => l.items.length > 100).sort((a, b) => b.items.length - a.items.length);

  const buckets: Array<[string, (n: number) => boolean]> = [
    ['0', n => n === 0],
    ['1–5', n => n >= 1 && n <= 5],
    ['6–10', n => n >= 6 && n <= 10],
    ['11–50', n => n >= 11 && n <= 50],
    ['51–100', n => n >= 51 && n <= 100],
    ['101–500', n => n >= 101 && n <= 500],
    ['> 500', n => n > 500],
  ];

  const byTag = new Map<string, number>();
  lists.forEach(l => {
    const tag = l.tag_name ?? 'Geral';
    byTag.set(tag, (byTag.get(tag) ?? 0) + l.items.length);
  });

  const nameToLists = new Map<string, ShoppingList[]>();
  lists.forEach(l => {
    const seen = new Set<string>();
    l.items.forEach(it => {
      if (seen.has(it.name)) return;
      seen.add(it.name);
      const arr = nameToLists.get(it.name) ?? [];
      arr.push(l);
      nameToLists.set(it.name, arr);
    });
  });
  // Prioriza nomes que estão em poucas listas (2–8): mais fáceis de achar e
  // conferir na navegação do que um nome que aparece em 15+ listas.
  const sample = [...nameToLists.entries()]
    .filter(([, ls]) => ls.length >= 2 && ls.length <= 8)
    .sort((a, b) => a[1].length - b[1].length)
    .slice(0, 25);

  const d = new Date();
  const ts = `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;

  const out: string[] = [];
  const p = (s = '') => out.push(s);

  p('════════════════════════════════════════════════');
  p('  RELATÓRIO — FAKE USER (supLista dev)');
  p(`  ${ts}`);
  p('════════════════════════════════════════════════');
  p();
  p('BASELINE (antes da injeção)');
  p(`  Listas armazenadas: ${opts.baselineLists ?? 0}`);
  p(`  Itens armazenados:  ${opts.baselineItems ?? 0}`);
  p(`  Catálogo:           ${opts.baselineCatalog ?? 0} entradas`);
  p();
  p('GERADO');
  p(`  Listas:           ${L}`);
  p(`  Itens:            ${items.length}`);
  p(`    compras:        ${compras} listas`);
  p(`    tarefas:        ${tarefas} listas`);
  p(`  Concluídas:       ${completed}   Abertas: ${L - completed}`);
  p(`  Listas vazias:    ${empty}`);
  p(`  Itens marcados:   ${checked} (${((checked / I) * 100).toFixed(1)}%)`);
  p(`  Itens com preço:  ${priced} (${((priced / I) * 100).toFixed(1)}%)`);
  p(`  Catálogo semeado: ${catalog.length} entradas (teto 500 / LRU)`);
  p();
  p(`LISTAS GRANDES (> 100 itens) — ${big.length}`);
  big.forEach(l => p(`  id ${l.id}  ${pad(l.name, 26)} ${String(l.items.length).padStart(4)} itens  [${l.tag_name}]  ${l.type}`));
  p();
  p('DISTRIBUIÇÃO DE TAMANHO');
  buckets.forEach(([label, fn]) => {
    const n = lists.filter(l => fn(l.items.length)).length;
    if (n > 0) p(`  ${pad(label, 9)} ${n} listas`);
  });
  p();
  p('ITENS POR TAG');
  [...byTag.entries()].sort((a, b) => b[1] - a[1]).forEach(([tag, n]) => {
    p(`  ${pad(tag, 16)} ${String(n).padStart(5)}   (${PRESET_TAGS.includes(tag) ? 'preset' : 'custom'})`);
  });
  p();
  p('AMOSTRA PARA TESTAR "PESQUISAR MEUS ITENS"  (nomes em poucas listas)');
  sample.forEach(([name, ls]) => {
    const bySize = [...ls].sort((a, b) => a.items.length - b.items.length);
    const shown = bySize.slice(0, 3).map(l => `"${l.name}"`).join(', ');
    const extra = bySize.length > 3 ? ` +${bySize.length - 3}` : '';
    p(`  ${pad(name, 30)} → ${shown}${extra}  (${ls.length} listas)`);
  });
  p();
  p('STORAGE (após salvar)');
  p(`  @suplista_lists          ${L} registros`);
  p(`  @suplista_item_catalog   ${catalog.length} entradas`);
  p();
  p('COMO TESTAR');
  p('  • Navegação: role a lista; entre/saia; swipe no cabeçalho da lista');
  p('    para navegar entre listas vizinhas.');
  p('  • Busca: abra uma lista → Adicionar Item → "Pesquisar meus itens" e');
  p('    digite um nome da amostra acima.');
  p('  • Storage: feche e reabra o app — as listas devem persistir.');
  p('  • Baseline: Sobre → Fake user → "Limpar tudo" zera listas e catálogo.');
  p('════════════════════════════════════════════════');
  return out.join('\n');
}
