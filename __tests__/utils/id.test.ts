// ===========================
// TESTES: nextId
// ===========================

import { nextId } from '../../src/utils/id';

describe('nextId', () => {
  it('retorna número finito', () => {
    const id = nextId();
    expect(typeof id).toBe('number');
    expect(Number.isFinite(id)).toBe(true);
  });

  it('é estritamente crescente', () => {
    let prev = nextId();
    for (let i = 0; i < 50; i++) {
      const cur = nextId();
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });

  it('não colide num burst dentro do mesmo milissegundo', () => {
    const ids = new Set<number>();
    // 5000 chamadas seguidas caem quase todas no mesmo ms
    for (let i = 0; i < 5000; i++) ids.add(nextId());
    expect(ids.size).toBe(5000);
  });

  it('fica próximo do relógio (é um timestamp em ms)', () => {
    const before = Date.now();
    const id = nextId();
    expect(id).toBeGreaterThanOrEqual(before);
    expect(id).toBeLessThan(before + 10000);
  });
});
