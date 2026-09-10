// ===========================
// TESTES: gerador de dados fake (dev)
// ===========================

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

import { generateFakeData } from '../../src/dev/fakeData';

const PRESET = ['Trabalho', 'Pessoal', 'Saúde', 'Família', 'Financeiro', 'Estudos', 'Lazer'];

const r = generateFakeData({ seed: 42, baselineLists: 0 });
const totalItems = r.lists.reduce((s, l) => s + l.items.length, 0);

describe('generateFakeData — pisos exigidos', () => {
  it('>= 100 listas', () => {
    expect(r.lists.length).toBeGreaterThanOrEqual(100);
  });

  it('>= 4000 itens', () => {
    expect(totalItems).toBeGreaterThanOrEqual(4000);
  });

  it('pelo menos 1 lista com 1000 itens', () => {
    expect(r.lists.filter(l => l.items.length === 1000).length).toBeGreaterThanOrEqual(1);
  });

  it('pelo menos 4 listas com mais de 100 itens', () => {
    expect(r.lists.filter(l => l.items.length > 100).length).toBeGreaterThanOrEqual(4);
  });

  it('pelo menos 100 listas com no máximo 10 itens', () => {
    expect(r.lists.filter(l => l.items.length <= 10).length).toBeGreaterThanOrEqual(100);
  });
});

describe('generateFakeData — variedade', () => {
  it('mistura itens de compra e itens-tarefa', () => {
    const items = r.lists.flatMap(l => l.items);
    expect(items.some(i => i.unit === 'tarefa')).toBe(true);
    expect(items.some(i => i.unit !== 'tarefa')).toBe(true);
  });

  it('gera listas arquivadas e não-arquivadas', () => {
    expect(r.lists.some(l => l.isArchived)).toBe(true);
    expect(r.lists.some(l => !l.isArchived)).toBe(true);
  });

  it('mistura tags preset e personalizadas', () => {
    const tags = new Set(r.lists.map(l => l.tag_name));
    expect(PRESET.filter(t => tags.has(t)).length).toBeGreaterThanOrEqual(3);
    expect([...tags].some(t => !!t && !PRESET.includes(t))).toBe(true);
  });

  it('gera listas concluídas e abertas', () => {
    expect(r.lists.some(l => l.isCompleted)).toBe(true);
    expect(r.lists.some(l => !l.isCompleted)).toBe(true);
  });

  it('gera itens com e sem preço', () => {
    const items = r.lists.flatMap(l => l.items);
    expect(items.some(i => i.price != null)).toBe(true);
    expect(items.some(i => i.price == null)).toBe(true);
  });
});

describe('generateFakeData — integridade', () => {
  it('todos os ids (listas + itens) são únicos', () => {
    const ids: number[] = [];
    r.lists.forEach(l => {
      ids.push(l.id);
      l.items.forEach(i => ids.push(i.id));
    });
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nenhuma lista é compartilhada', () => {
    expect(r.lists.every(l => !l.sharedWithUid && !l.isSharedWithMe && !l.ownerUid)).toBe(true);
  });

  it('completedAt coerente com isCompleted', () => {
    expect(r.lists.every(l => (l.isCompleted ? !!l.completedAt : l.completedAt === null))).toBe(true);
  });

  it('é determinístico para a mesma seed', () => {
    const a = generateFakeData({ seed: 7 });
    const b = generateFakeData({ seed: 7 });
    expect(a.lists.length).toBe(b.lists.length);
    expect(a.lists.map(l => l.name)).toEqual(b.lists.map(l => l.name));
    expect(a.lists.map(l => l.items.length)).toEqual(b.lists.map(l => l.items.length));
  });
});

describe('generateFakeData — relatório', () => {
  it('contém as seções principais', () => {
    for (const sec of [
      'RELATÓRIO — FAKE USER', 'BASELINE', 'GERADO', 'LISTAS GRANDES',
      'DISTRIBUIÇÃO DE TAMANHO', 'ITENS POR TAG', 'AMOSTRA PARA TESTAR', 'STORAGE',
    ]) {
      expect(r.report).toContain(sec);
    }
  });

  it('reflete o baseline informado', () => {
    const withBaseline = generateFakeData({ seed: 1, baselineLists: 5, baselineItems: 33 });
    expect(withBaseline.report).toContain('Listas armazenadas: 5');
    expect(withBaseline.report).toContain('Itens armazenados:  33');
  });
});
