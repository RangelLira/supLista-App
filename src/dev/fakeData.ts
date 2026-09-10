// ===========================
// DEV — GERADOR DE DADOS FAKE + RELATÓRIO
// ===========================
// Só carregado sob __DEV__. Cria um cenário de uso intenso (sem compartilhamento):
//   • >= 100 listas, >= 4000 itens
//   • 1 lista com 1000 itens, >= 4 listas com > 100 itens, resto com <= 10
//   • mistura os 7 tags preset + tags personalizadas; itens de compra + tarefas
//   • algumas listas concluídas e algumas ARQUIVADAS
// PRNG com seed fixa → duas execuções com a mesma seed produzem o mesmo cenário.

import { ListItem, ShoppingList, TASK_UNIT } from '../types';
import {
  CUSTOM_TAGS, GROCERY, LIST_NAMES_SHOPPING, LIST_NAMES_TASKS, TASKS, UNITS,
} from './pools';

const PRESET_TAGS = ['Trabalho', 'Pessoal', 'Saúde', 'Família', 'Financeiro', 'Estudos', 'Lazer'];
const LIST_NAMES = [...LIST_NAMES_SHOPPING, ...LIST_NAMES_TASKS];

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
}

export interface FakeDataResult {
  lists: ShoppingList[];
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

  const makeItems = (n: number): ListItem[] => {
    const items: ListItem[] = [];
    for (let j = 0; j < n; j++) {
      const isTask = chance(0.3);
      if (isTask) {
        items.push({
          id: nextId(), name: pick(TASKS), quantity: 1, unit: TASK_UNIT,
          isChecked: chance(0.5), price: null, priceType: 'unit',
        });
      } else {
        const hasPrice = chance(0.55);
        items.push({
          id: nextId(), name: pick(GROCERY), quantity: int(1, 12), unit: pick(UNITS),
          isChecked: chance(0.5),
          price: hasPrice ? Math.round(rnd() * 4900 + 50) / 100 : null,
          priceType: chance(0.8) ? 'unit' : 'total',
        });
      }
    }
    return items;
  };

  let seq = 0;
  const makeList = (nItems: number): ShoppingList => {
    seq += 1;
    const createdAt = new Date(NOW - int(0, 365) * DAY).toISOString();
    const isCompleted = chance(0.25);
    const isArchived = isCompleted && chance(0.4); // ~10% do total
    return {
      id: nextId(),
      name: `${pick(LIST_NAMES)} #${seq}`,
      suppliers: [],
      items: makeItems(nItems),
      createdAt,
      isCompleted,
      isArchived,
      archivedAt: isArchived ? createdAt : null,
      totalSpent: 0,
      completedAt: isCompleted ? createdAt : null,
      tag_name: pick(allTags),
      notes: chance(0.12) ? 'Nota de teste gerada pelo Fake user.' : undefined,
    };
  };

  const lists: ShoppingList[] = [];
  lists.push(makeList(1000));                        // 1 gigante
  for (let i = 0; i < 8; i++) lists.push(makeList(int(120, 320))); // 8 grandes (> 100)

  const TARGET_ITEMS = 4300;
  const MIN_NORMAL = 130;
  const MAX_NORMAL = 500;
  let normalCount = 0;
  const countItems = () => lists.reduce((s, l) => s + l.items.length, 0);
  while ((countItems() < TARGET_ITEMS || normalCount < MIN_NORMAL) && normalCount < MAX_NORMAL) {
    lists.push(makeList(int(0, 10)));
    normalCount += 1;
  }

  return { lists, report: buildReport(lists, opts) };
}

function buildReport(lists: ShoppingList[], opts: FakeDataOptions): string {
  const L = lists.length;
  const items = lists.flatMap(l => l.items);
  const I = items.length || 1;
  const tasks = items.filter(i => i.unit === 'tarefa').length;
  const completed = lists.filter(l => l.isCompleted).length;
  const archived = lists.filter(l => l.isArchived).length;
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
  p();
  p('GERADO');
  p(`  Listas:            ${L}   (arquivadas: ${archived})`);
  p(`  Itens:             ${items.length}   (tarefas: ${tasks}, compra: ${items.length - tasks})`);
  p(`  Concluídas:        ${completed}   Abertas: ${L - completed}`);
  p(`  Listas vazias:     ${empty}`);
  p(`  Itens marcados:    ${checked} (${((checked / I) * 100).toFixed(1)}%)`);
  p(`  Itens com preço:   ${priced} (${((priced / I) * 100).toFixed(1)}%)`);
  p();
  p(`LISTAS GRANDES (> 100 itens) — ${big.length}`);
  big.forEach(l => p(`  id ${l.id}  ${pad(l.name, 26)} ${String(l.items.length).padStart(4)} itens  [${l.tag_name}]${l.isArchived ? '  (arquivada)' : ''}`));
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
  p('AMOSTRA PARA TESTAR "BUSCAR ITENS"  (nomes em poucas listas)');
  sample.forEach(([name, ls]) => {
    const bySize = [...ls].sort((a, b) => a.items.length - b.items.length);
    const shown = bySize.slice(0, 3).map(l => `"${l.name}"`).join(', ');
    const extra = bySize.length > 3 ? ` +${bySize.length - 3}` : '';
    p(`  ${pad(name, 30)} → ${shown}${extra}  (${ls.length} listas)`);
  });
  p();
  p('STORAGE (após salvar)');
  p(`  @suplista_lists   ${L} registros (${archived} arquivadas)`);
  p();
  p('COMO TESTAR');
  p('  • Navegação: role a lista; entre/saia; swipe no cabeçalho da lista.');
  p('  • Busca: abra uma lista → Adicionar item → "Buscar itens".');
  p('  • Arquivo: Config → Arquivo de Listas (as arquivadas aparecem lá).');
  p('  • Storage: feche e reabra o app — as listas devem persistir.');
  p('  • Baseline: Sobre → Fake user → "Limpar tudo" zera as listas.');
  p('════════════════════════════════════════════════');
  return out.join('\n');
}
