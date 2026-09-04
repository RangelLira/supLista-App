// ===========================
// FUNÇÕES DE DATA E HORA
// ===========================

import { LangType } from '../contexts/LanguageContext';

// Formata Date para string YYYY-MM-DD (local, não UTC)
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formata data para exibição DD/MM/YYYY
export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

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

// Detecta datas em texto digitado
// Suporta formatos: DD/MM/YYYY, DD/MM/YY, DD/MM com separadores / - .
export const detectDateInText = (text: string): Date | null => {
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // DD/MM/YYYY
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})/,   // DD/MM/YY
    /(\d{1,2})[\/\-\.](\d{1,2})/,                   // DD/MM
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      let year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
      if (year < 100) year += 2000;

      const date = new Date(year, month, day);
      if (date.getDate() === day && date.getMonth() === month) {
        return date;
      }
    }
  }
  return null;
};

// Formata data detectada para exibição amigável
export const formatDetectedDate = (date: Date, lang: LangType = 'pt'): string => {
  const dayName = getDayName(date, lang);
  const day = date.getDate();
  const month = getMonthName(date.getMonth(), lang);
  const year = date.getFullYear();

  if (lang === 'en') {
    return `${dayName}, ${month} ${day}, ${year}`;
  }
  return `${dayName}, ${day} de ${month} de ${year}`;
};
