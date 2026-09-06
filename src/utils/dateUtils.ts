// ===========================
// FUNÇÕES DE DATA E HORA
// ===========================

import { LangType } from '../contexts/LanguageContext';

// Retorna nome do dia da semana no idioma solicitado
export const getDayName = (date: Date, lang: LangType = 'pt'): string => {
  const days: Record<LangType, string[]> = {
    pt: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  };
  return days[lang][date.getDay()];
};

// Retorna nome do mês no idioma solicitado
export const getMonthName = (month: number, lang: LangType = 'pt'): string => {
  const months: Record<LangType, string[]> = {
    pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    en: ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'],
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  };
  return months[lang][month];
};

// Formata data para o header (Terça-feira, 25 de Maio / Tuesday, May 25 / Martes, 25 de Mayo)
export const formatHeaderDate = (date: Date, lang: LangType = 'pt'): string => {
  const dayName = getDayName(date, lang);
  const day = date.getDate();
  const monthName = getMonthName(date.getMonth(), lang);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (lang === 'en') {
    return `${cap(dayName)}, ${cap(monthName)} ${day}`;
  }
  return `${cap(dayName)}, ${day} de ${cap(monthName)}`;
};
