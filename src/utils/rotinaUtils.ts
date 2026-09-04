// ===========================
// UTILITÁRIOS DE ROTINAS
// ===========================

import { CustomUnit, Rotina, RotinaInstance } from '../types';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSubDaily(rotina: Rotina): boolean {
  return (
    rotina.recurrence_type === 'custom' &&
    (rotina.custom_unit === 'hours' || rotina.custom_unit === 'minutes')
  );
}

// Gera todos os instanceKeys da rotina
function generateAllOccurrences(rotina: Rotina): string[] {
  if (!rotina.start_date) return [];
  const start = parseDate(rotina.start_date);
  const occurrences: string[] = [];

  switch (rotina.recurrence_type) {
    case 'daily': {
      if (!rotina.end_date) break;
      const end = parseDate(rotina.end_date);
      const cur = new Date(start);
      while (cur <= end) {
        occurrences.push(formatDateStr(cur));
        cur.setDate(cur.getDate() + 1);
      }
      break;
    }

    case 'weekly': {
      if (!rotina.end_date || !rotina.weekdays.length) break;
      const end = parseDate(rotina.end_date);
      // Our: 0=SEG(Mon=1), 1=TER(Tue=2), ..., 5=SAB(Sat=6), 6=DOM(Sun=0)
      const toJsDay = [1, 2, 3, 4, 5, 6, 0];
      const jsWeekdays = rotina.weekdays.map(w => toJsDay[w]);
      const cur = new Date(start);
      while (cur <= end) {
        if (jsWeekdays.includes(cur.getDay())) {
          occurrences.push(formatDateStr(cur));
        }
        cur.setDate(cur.getDate() + 1);
      }
      break;
    }

    case 'monthly': {
      if (!rotina.end_date || !rotina.month_day) break;
      const end = parseDate(rotina.end_date);
      const targetDay = rotina.month_day;
      const cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(targetDay, lastDay);
        const occ = new Date(cur.getFullYear(), cur.getMonth(), actualDay, 12, 0, 0);
        if (occ >= start && occ <= end) {
          occurrences.push(formatDateStr(occ));
        }
        cur.setMonth(cur.getMonth() + 1);
      }
      break;
    }

    case 'yearly': {
      if (!rotina.end_date) break;
      const end = parseDate(rotina.end_date);
      const cur = new Date(start);
      while (cur <= end) {
        occurrences.push(formatDateStr(cur));
        cur.setFullYear(cur.getFullYear() + 1);
      }
      break;
    }

    case 'custom': {
      const interval = rotina.custom_interval || 1;
      const unit = rotina.custom_unit || 'days';
      const reps = Math.min(rotina.custom_reps || 1, 15);

      if (unit === 'hours' || unit === 'minutes') {
        const timeStr = rotina.time || '00:00';
        const [h, m] = timeStr.split(':').map(Number);
        const cur = new Date(start);
        cur.setHours(h, m, 0, 0);
        for (let i = 0; i < reps; i++) {
          const dateStr = formatDateStr(cur);
          const hh = cur.getHours().toString().padStart(2, '0');
          const mm = cur.getMinutes().toString().padStart(2, '0');
          occurrences.push(`${dateStr}T${hh}:${mm}`);
          if (unit === 'hours') cur.setHours(cur.getHours() + interval);
          else cur.setMinutes(cur.getMinutes() + interval);
        }
      } else {
        const cur = new Date(start);
        for (let i = 0; i < reps; i++) {
          occurrences.push(formatDateStr(cur));
          if (unit === 'days') cur.setDate(cur.getDate() + interval);
          else if (unit === 'weeks') cur.setDate(cur.getDate() + interval * 7);
          else if (unit === 'months') cur.setMonth(cur.getMonth() + interval);
        }
      }
      break;
    }
  }

  return occurrences;
}

function buildInstance(rotina: Rotina, instanceKey: string): RotinaInstance {
  const isSubDailyKey = instanceKey.includes('T');
  const date = isSubDailyKey ? instanceKey.substring(0, 10) : instanceKey;
  const time = isSubDailyKey ? instanceKey.substring(11) : rotina.time;

  const is_completed = rotina.completed_instances.includes(instanceKey);
  const is_suspended = !!(
    rotina.is_suspended &&
    rotina.suspended_from_date &&
    instanceKey >= rotina.suspended_from_date
  );

  return {
    rotinaId: rotina.id,
    instanceKey,
    date,
    time,
    title: rotina.title,
    tag_name: rotina.tag_name,
    notes: rotina.notes,
    is_completed,
    is_suspended,
    linkedListId: rotina.linked_lists[instanceKey] ?? null,
  };
}

// Retorna todas as instâncias de uma rotina para uma data (YYYY-MM-DD)
export function getOccurrencesForDate(rotina: Rotina, dateStr: string): RotinaInstance[] {
  const occurrences = generateAllOccurrences(rotina);
  let keys: string[];

  if (isSubDaily(rotina)) {
    keys = occurrences.filter(k => k.startsWith(dateStr + 'T'));
  } else {
    keys = occurrences.filter(k => k === dateStr);
  }

  return keys.map(k => buildInstance(rotina, k));
}

// Retorna datas (YYYY-MM-DD) que têm ocorrências num determinado mês
export function getOccurrenceDatesForMonth(
  rotina: Rotina,
  year: number,
  month: number // 0-based
): string[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstStr = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
  const lastStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

  const occurrences = generateAllOccurrences(rotina);
  const result = new Set<string>();

  occurrences.forEach(key => {
    const dateStr = key.substring(0, 10);
    if (dateStr >= firstStr && dateStr <= lastStr) {
      result.add(dateStr);
    }
  });

  return Array.from(result);
}

// Label legível do tipo de recorrência
export function getRotinaRecurrenceLabel(rotina: Rotina): string {
  const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const UNIT_LABELS: Record<CustomUnit, string> = {
    months: 'meses',
    weeks: 'semanas',
    days: 'dias',
    hours: 'horas',
    minutes: 'min',
  };

  switch (rotina.recurrence_type) {
    case 'daily': return 'Diária';
    case 'weekly': return rotina.weekdays.map(w => DAY_NAMES[w]).join(', ');
    case 'monthly': return `Dia ${rotina.month_day} de cada mês`;
    case 'yearly': return 'Anual';
    case 'custom': {
      if (!rotina.custom_unit) return 'Personalizado';
      return `A cada ${rotina.custom_interval} ${UNIT_LABELS[rotina.custom_unit]}`;
    }
    default: return '';
  }
}

// Formata YYYY-MM-DD → DD/MM/YYYY
export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return '';
  return `${dateStr.substring(8, 10)}/${dateStr.substring(5, 7)}/${dateStr.substring(0, 4)}`;
}

// Converte DD/MM/AAAA → YYYY-MM-DD
export function parseDateInput(input: string): string | null {
  const parts = input.split('/');
  if (parts.length !== 3) return null;
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  let year = parts[2];
  if (year.length <= 2) year = '20' + year.padStart(2, '0');
  if (year.length !== 4) return null;
  const d = new Date(`${year}-${month}-${day}T12:00:00`);
  if (isNaN(d.getTime())) return null;
  return `${year}-${month}-${day}`;
}
