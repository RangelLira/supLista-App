// ===========================
// TESTES: dateUtils
// ===========================

import {
  getDayName,
  getMonthName,
  formatHeaderDate,
} from '../../src/utils/dateUtils';

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
