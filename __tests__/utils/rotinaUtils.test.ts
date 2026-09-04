// ===========================
// TESTES: rotinaUtils
// ===========================

import {
  getOccurrencesForDate,
  getOccurrenceDatesForMonth,
  getRotinaRecurrenceLabel,
  formatDateForDisplay,
  parseDateInput,
} from '../../src/utils/rotinaUtils';
import { Rotina } from '../../src/types';

// ===========================
// HELPERS
// ===========================

function makeRotina(overrides: Partial<Rotina>): Rotina {
  return {
    id: 1,
    title: 'Rotina Base',
    tag_name: 'Geral',
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    time: '08:00',
    end_time: null,
    recurrence_type: 'daily',
    weekdays: [],
    month_day: null,
    custom_interval: null,
    custom_unit: null,
    custom_reps: null,
    notes: [],
    is_suspended: false,
    suspended_from_date: null,
    completed_instances: [],
    linked_lists: {},
    ...overrides,
  };
}

// ===========================
// getOccurrencesForDate — DAILY
// ===========================

describe('getOccurrencesForDate — diária', () => {
  const rotina = makeRotina({ recurrence_type: 'daily', start_date: '2026-06-01', end_date: '2026-06-30' });

  it('retorna instância para qualquer dia do período', () => {
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-06-17');
    expect(result[0].rotinaId).toBe(1);
  });

  it('retorna vazio fora do período (antes)', () => {
    const result = getOccurrencesForDate(rotina, '2026-05-31');
    expect(result).toHaveLength(0);
  });

  it('retorna vazio fora do período (depois)', () => {
    const result = getOccurrencesForDate(rotina, '2026-07-01');
    expect(result).toHaveLength(0);
  });

  it('inclui data de início', () => {
    const result = getOccurrencesForDate(rotina, '2026-06-01');
    expect(result).toHaveLength(1);
  });

  it('inclui data de fim', () => {
    const result = getOccurrencesForDate(rotina, '2026-06-30');
    expect(result).toHaveLength(1);
  });

  it('instância herda title e tag_name da rotina', () => {
    const rotinaCustom = makeRotina({
      recurrence_type: 'daily',
      title: 'Meditação Diária',
      tag_name: 'Bem-Estar',
    });
    const result = getOccurrencesForDate(rotinaCustom, '2026-06-17');
    expect(result[0].title).toBe('Meditação Diária');
    expect(result[0].tag_name).toBe('Bem-Estar');
  });
});

// ===========================
// getOccurrencesForDate — WEEKLY
// ===========================

describe('getOccurrencesForDate — semanal', () => {
  // Seg=0, Ter=1, Qua=2, Qui=3, Sex=4, Sáb=5, Dom=6
  // 2026-06-17 = quarta-feira
  const rotinaSeg = makeRotina({
    recurrence_type: 'weekly',
    weekdays: [0], // segunda
    start_date: '2026-06-01',
    end_date: '2026-06-30',
  });

  const rotinaQua = makeRotina({
    recurrence_type: 'weekly',
    weekdays: [2], // quarta
    start_date: '2026-06-01',
    end_date: '2026-06-30',
  });

  it('não ocorre em dias que não correspondem', () => {
    // 2026-06-17 é quarta, não segunda
    const result = getOccurrencesForDate(rotinaSeg, '2026-06-17');
    expect(result).toHaveLength(0);
  });

  it('ocorre no dia correto (quarta)', () => {
    const result = getOccurrencesForDate(rotinaQua, '2026-06-17');
    expect(result).toHaveLength(1);
  });

  it('suporta múltiplos dias da semana', () => {
    const rotinaMtoQ = makeRotina({
      recurrence_type: 'weekly',
      weekdays: [0, 1, 2, 3, 4], // seg a sex
      start_date: '2026-06-01',
      end_date: '2026-06-30',
    });
    // 2026-06-17 = quarta (índice 2)
    expect(getOccurrencesForDate(rotinaMtoQ, '2026-06-17')).toHaveLength(1);
    // 2026-06-20 = sábado (índice 5) — não está no weekdays
    expect(getOccurrencesForDate(rotinaMtoQ, '2026-06-20')).toHaveLength(0);
  });

  it('retorna vazio se weekdays vazio', () => {
    const rotinaSemDias = makeRotina({
      recurrence_type: 'weekly',
      weekdays: [],
      start_date: '2026-06-01',
      end_date: '2026-06-30',
    });
    expect(getOccurrencesForDate(rotinaSemDias, '2026-06-17')).toHaveLength(0);
  });
});

// ===========================
// getOccurrencesForDate — MONTHLY
// ===========================

describe('getOccurrencesForDate — mensal', () => {
  const rotinaDia17 = makeRotina({
    recurrence_type: 'monthly',
    month_day: 17,
    start_date: '2026-01-17',
    end_date: '2026-12-17',
  });

  it('ocorre no dia correto do mês', () => {
    expect(getOccurrencesForDate(rotinaDia17, '2026-06-17')).toHaveLength(1);
  });

  it('não ocorre em outros dias do mês', () => {
    expect(getOccurrencesForDate(rotinaDia17, '2026-06-16')).toHaveLength(0);
    expect(getOccurrencesForDate(rotinaDia17, '2026-06-18')).toHaveLength(0);
  });

  it('ocorre em múltiplos meses', () => {
    expect(getOccurrencesForDate(rotinaDia17, '2026-07-17')).toHaveLength(1);
    expect(getOccurrencesForDate(rotinaDia17, '2026-09-17')).toHaveLength(1);
  });

  it('ajusta para último dia do mês em meses curtos (dia 31)', () => {
    const rotinaDia31 = makeRotina({
      recurrence_type: 'monthly',
      month_day: 31,
      start_date: '2026-01-31',
      end_date: '2026-12-31',
    });
    // Fevereiro tem 28 dias em 2026
    expect(getOccurrencesForDate(rotinaDia31, '2026-02-28')).toHaveLength(1);
  });
});

// ===========================
// getOccurrencesForDate — YEARLY
// ===========================

describe('getOccurrencesForDate — anual', () => {
  const rotinaAnual = makeRotina({
    recurrence_type: 'yearly',
    start_date: '2026-06-17',
    end_date: '2028-06-17',
  });

  it('ocorre na data exata do início', () => {
    expect(getOccurrencesForDate(rotinaAnual, '2026-06-17')).toHaveLength(1);
  });

  it('ocorre no aniversário', () => {
    expect(getOccurrencesForDate(rotinaAnual, '2027-06-17')).toHaveLength(1);
  });

  it('não ocorre em outras datas', () => {
    expect(getOccurrencesForDate(rotinaAnual, '2026-06-18')).toHaveLength(0);
    expect(getOccurrencesForDate(rotinaAnual, '2026-07-17')).toHaveLength(0);
  });
});

// ===========================
// getOccurrencesForDate — CUSTOM (dias)
// ===========================

describe('getOccurrencesForDate — custom (dias)', () => {
  const rotina = makeRotina({
    recurrence_type: 'custom',
    custom_interval: 3,
    custom_unit: 'days',
    custom_reps: 5,
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    time: '09:00',
  });

  it('ocorre no início', () => {
    expect(getOccurrencesForDate(rotina, '2026-06-01')).toHaveLength(1);
  });

  it('ocorre a cada 3 dias', () => {
    expect(getOccurrencesForDate(rotina, '2026-06-04')).toHaveLength(1);
    expect(getOccurrencesForDate(rotina, '2026-06-07')).toHaveLength(1);
  });

  it('não ocorre em dias sem ocorrência', () => {
    expect(getOccurrencesForDate(rotina, '2026-06-02')).toHaveLength(0);
    expect(getOccurrencesForDate(rotina, '2026-06-03')).toHaveLength(0);
  });

  it('respeita o limite de repetições (5 reps)', () => {
    // Dias: 1, 4, 7, 10, 13 → no dia 16 não ocorre mais
    expect(getOccurrencesForDate(rotina, '2026-06-16')).toHaveLength(0);
  });
});

// ===========================
// getOccurrencesForDate — estado is_completed e is_suspended
// ===========================

describe('getOccurrencesForDate — estado de instâncias', () => {
  it('is_completed = true quando instanceKey está em completed_instances', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      completed_instances: ['2026-06-17'],
    });
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result[0].is_completed).toBe(true);
  });

  it('is_completed = false quando não está em completed_instances', () => {
    const rotina = makeRotina({ recurrence_type: 'daily', completed_instances: [] });
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result[0].is_completed).toBe(false);
  });

  it('is_suspended = true quando rotina suspensa e data >= suspended_from_date', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      is_suspended: true,
      suspended_from_date: '2026-06-10',
    });
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result[0].is_suspended).toBe(true);
  });

  it('is_suspended = false quando data < suspended_from_date', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      is_suspended: true,
      suspended_from_date: '2026-07-01',
    });
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result[0].is_suspended).toBe(false);
  });

  it('lista vinculada aparece na instância via linked_lists', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      linked_lists: { '2026-06-17': 99 },
    });
    const result = getOccurrencesForDate(rotina, '2026-06-17');
    expect(result[0].linkedListId).toBe(99);
  });
});

// ===========================
// getOccurrenceDatesForMonth
// ===========================

describe('getOccurrenceDatesForMonth', () => {
  it('retorna todas as datas de uma rotina diária no mês', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      start_date: '2026-06-01',
      end_date: '2026-06-30',
    });
    const dates = getOccurrenceDatesForMonth(rotina, 2026, 5); // junho = mês 5 (0-based)
    expect(dates).toHaveLength(30);
  });

  it('retorna apenas datas do mês (recorta por boundaries)', () => {
    const rotina = makeRotina({
      recurrence_type: 'daily',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    const dates = getOccurrenceDatesForMonth(rotina, 2026, 5); // junho
    expect(dates).toHaveLength(30);
    dates.forEach(d => expect(d.startsWith('2026-06-')).toBe(true));
  });

  it('retorna vazio para mês sem ocorrências', () => {
    const rotina = makeRotina({
      recurrence_type: 'monthly',
      month_day: 17,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    const dates = getOccurrenceDatesForMonth(rotina, 2026, 5);
    expect(dates).toContain('2026-06-17');
    expect(dates).toHaveLength(1);
  });
});

// ===========================
// getRotinaRecurrenceLabel
// ===========================

describe('getRotinaRecurrenceLabel', () => {
  it('retorna "Diária" para recorrência diária', () => {
    const rotina = makeRotina({ recurrence_type: 'daily' });
    expect(getRotinaRecurrenceLabel(rotina)).toBe('Diária');
  });

  it('retorna dias da semana para recorrência semanal', () => {
    const rotina = makeRotina({ recurrence_type: 'weekly', weekdays: [0, 4] }); // Seg, Sex
    expect(getRotinaRecurrenceLabel(rotina)).toBe('Seg, Sex');
  });

  it('retorna dia do mês para recorrência mensal', () => {
    const rotina = makeRotina({ recurrence_type: 'monthly', month_day: 15 });
    expect(getRotinaRecurrenceLabel(rotina)).toBe('Dia 15 de cada mês');
  });

  it('retorna "Anual" para recorrência anual', () => {
    const rotina = makeRotina({ recurrence_type: 'yearly' });
    expect(getRotinaRecurrenceLabel(rotina)).toBe('Anual');
  });

  it('retorna label customizada com intervalo e unidade', () => {
    const rotina = makeRotina({
      recurrence_type: 'custom',
      custom_interval: 2,
      custom_unit: 'weeks',
    });
    expect(getRotinaRecurrenceLabel(rotina)).toBe('A cada 2 semanas');
  });

  it('retorna "Personalizado" se custom_unit ausente', () => {
    const rotina = makeRotina({ recurrence_type: 'custom', custom_unit: null });
    expect(getRotinaRecurrenceLabel(rotina)).toBe('Personalizado');
  });
});

// ===========================
// formatDateForDisplay e parseDateInput
// ===========================

describe('formatDateForDisplay', () => {
  it('converte YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatDateForDisplay('2026-06-17')).toBe('17/06/2026');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(formatDateForDisplay('')).toBe('');
  });

  it('retorna string vazia para entrada curta demais', () => {
    expect(formatDateForDisplay('2026')).toBe('');
  });
});

describe('parseDateInput', () => {
  it('converte DD/MM/AAAA para YYYY-MM-DD', () => {
    expect(parseDateInput('17/06/2026')).toBe('2026-06-17');
  });

  it('converte DD/MM/AA para YYYY-MM-DD com 2000+', () => {
    expect(parseDateInput('17/06/26')).toBe('2026-06-17');
  });

  it('retorna null para formato inválido', () => {
    expect(parseDateInput('17-06-2026')).toBeNull(); // separador errado
    expect(parseDateInput('não é data')).toBeNull();
  });

  it('retorna null para data inválida', () => {
    expect(parseDateInput('32/13/2026')).toBeNull();
  });

  it('padeia dia e mês com zero', () => {
    expect(parseDateInput('5/6/2026')).toBe('2026-06-05');
  });
});
