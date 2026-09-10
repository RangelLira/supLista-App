// ===========================
// TESTES: motor de log (dev)
// ===========================

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

import { clearLog, getLogCount, getLogText, logEvent } from '../../src/dev/devLog';

beforeEach(async () => {
  await clearLog();
});

describe('logEvent / getLog', () => {
  it('registra um evento simples', () => {
    logEvent('TEST', 'ola');
    expect(getLogCount()).toBe(1);
    expect(getLogText()).toContain('[TEST]');
    expect(getLogText()).toContain('ola');
  });

  it('serializa o payload como JSON', () => {
    logEvent('LIST', 'update', { id: 7, itens: 3 });
    expect(getLogText()).toContain('update {"id":7,"itens":3}');
  });

  it('não quebra com payload circular', () => {
    const a: any = {};
    a.self = a;
    expect(() => logEvent('X', 'circ', a)).not.toThrow();
    expect(getLogCount()).toBe(1);
  });

  it('getLogText respeita lastN', () => {
    for (let i = 0; i < 40; i++) logEvent('N', String(i));
    const lines = getLogText(10).split('\n');
    expect(lines).toHaveLength(10);
    expect(lines[9]).toContain('[N]  39');
    expect(lines[0]).toContain('[N]  30');
  });

  it('mantém no máximo 5000 linhas', () => {
    for (let i = 0; i < 5200; i++) logEvent('N', String(i));
    expect(getLogCount()).toBe(5000);
    expect(getLogText(1)).toContain('[N]  5199');
  });
});

describe('clearLog', () => {
  it('zera memória', async () => {
    logEvent('X', 'y');
    expect(getLogCount()).toBe(1);
    await clearLog();
    expect(getLogCount()).toBe(0);
    expect(getLogText()).toBe('');
  });
});
