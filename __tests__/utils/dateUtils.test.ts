// ===========================
// TESTES: dateUtils
// ===========================

import {
  formatDate,
  formatDateDisplay,
  getDayName,
  getMonthName,
  formatHeaderDate,
  detectDateInText,
  formatDetectedDate,
} from '../../src/utils/dateUtils';

describe('formatDate', () => {
  it('formata Date para YYYY-MM-DD corretamente', () => {
    expect(formatDate(new Date(2026, 5, 17))).toBe('2026-06-17'); // jun = 5
  });

  it('padeia mês e dia com zero', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('não usa UTC (evita bug de fuso horário)', () => {
    const d = new Date(2026, 11, 31);
    expect(formatDate(d)).toBe('2026-12-31');
  });
});

describe('formatDateDisplay', () => {
  it('formata string ISO para DD/MM/YYYY', () => {
    const result = formatDateDisplay('2026-06-17T10:00:00');
    expect(result).toMatch(/17\/06\/2026/);
  });
});

describe('getDayName', () => {
  const segunda = new Date(2026, 5, 15); // 15 jun 2026 = segunda-feira
  const domingo = new Date(2026, 5, 14); // 14 jun 2026 = domingo

  it('retorna nome correto em português', () => {
    expect(getDayName(segunda, 'pt')).toBe('segunda-feira');
    expect(getDayName(domingo, 'pt')).toBe('domingo');
  });

  it('retorna nome correto em inglês', () => {
    expect(getDayName(segunda, 'en')).toBe('Monday');
    expect(getDayName(domingo, 'en')).toBe('Sunday');
  });

  it('retorna nome correto em espanhol', () => {
    expect(getDayName(segunda, 'es')).toBe('lunes');
    expect(getDayName(domingo, 'es')).toBe('domingo');
  });

  it('usa pt como padrão quando idioma não é passado', () => {
    expect(getDayName(segunda)).toBe('segunda-feira');
  });
});

describe('getMonthName', () => {
  it('retorna nome correto em português', () => {
    expect(getMonthName(0, 'pt')).toBe('janeiro');
    expect(getMonthName(5, 'pt')).toBe('junho');
    expect(getMonthName(11, 'pt')).toBe('dezembro');
  });

  it('retorna nome correto em inglês', () => {
    expect(getMonthName(0, 'en')).toBe('January');
    expect(getMonthName(5, 'en')).toBe('June');
    expect(getMonthName(11, 'en')).toBe('December');
  });

  it('retorna nome correto em espanhol', () => {
    expect(getMonthName(0, 'es')).toBe('enero');
    expect(getMonthName(5, 'es')).toBe('junio');
    expect(getMonthName(11, 'es')).toBe('diciembre');
  });
});

describe('formatHeaderDate', () => {
  const date = new Date(2026, 5, 17); // quarta-feira, 17 jun 2026

  it('formata corretamente em português', () => {
    const result = formatHeaderDate(date, 'pt');
    expect(result).toBe('Quarta-feira, 17 de Junho');
  });

  it('formata corretamente em inglês', () => {
    const result = formatHeaderDate(date, 'en');
    expect(result).toBe('Wednesday, June 17');
  });

  it('formata corretamente em espanhol', () => {
    const result = formatHeaderDate(date, 'es');
    expect(result).toBe('Miércoles, 17 de Junio');
  });

  it('capitaliza o primeiro caractere', () => {
    const result = formatHeaderDate(date, 'pt');
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});

describe('detectDateInText', () => {
  it('detecta formato DD/MM/YYYY', () => {
    const date = detectDateInText('Reunião em 25/12/2026');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(25);
    expect(date?.getMonth()).toBe(11); // dezembro = 11
    expect(date?.getFullYear()).toBe(2026);
  });

  it('detecta formato DD/MM/YY', () => {
    const date = detectDateInText('prazo 30/06/26');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
  });

  it('detecta formato DD/MM (sem ano, usa ano atual)', () => {
    const date = detectDateInText('apresentação 15/08');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(15);
    expect(date?.getMonth()).toBe(7); // agosto = 7
  });

  it('detecta separadores alternativos (- e .)', () => {
    const dateDash = detectDateInText('tarefa 10-07-2026');
    expect(dateDash).not.toBeNull();

    const dateDot = detectDateInText('evento 22.09.2026');
    expect(dateDot).not.toBeNull();
  });

  it('retorna null quando não encontra data', () => {
    const date = detectDateInText('nenhuma data aqui');
    expect(date).toBeNull();
  });

  it('retorna null para datas inválidas', () => {
    const date = detectDateInText('data inválida 99/13/2026');
    expect(date).toBeNull();
  });

  it('detecta data no início do texto', () => {
    const date = detectDateInText('01/01/2026 começo do ano');
    expect(date).not.toBeNull();
    expect(date?.getDate()).toBe(1);
    expect(date?.getMonth()).toBe(0);
  });
});

describe('formatDetectedDate', () => {
  const date = new Date(2026, 11, 25); // 25 de dezembro de 2026

  it('formata em português', () => {
    const result = formatDetectedDate(date, 'pt');
    expect(result).toContain('sexta-feira');
    expect(result).toContain('25');
    expect(result).toContain('dezembro');
    expect(result).toContain('2026');
  });

  it('formata em inglês', () => {
    const result = formatDetectedDate(date, 'en');
    expect(result).toContain('Friday');
    expect(result).toContain('December');
    expect(result).toContain('25');
    expect(result).toContain('2026');
  });

  it('formata em espanhol', () => {
    const result = formatDetectedDate(date, 'es');
    expect(result).toContain('viernes');
    expect(result).toContain('diciembre');
    expect(result).toContain('25');
    expect(result).toContain('2026');
  });
});
