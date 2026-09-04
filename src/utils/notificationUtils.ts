// ===========================
// UTILITÁRIOS: NOTIFICAÇÕES LOCAIS (notifee)
// ===========================

import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  AndroidCategory,
} from '@notifee/react-native';
import { Event } from '../types';
import { AppSettings } from './storage';

const CHANNEL_ID = 'taskflow_events';
const WATER_CHANNEL_ID = 'taskflow_water';
const WATER_ALARM_CHANNEL_ID = 'taskflow_water_alarm';
const WATER_NOTIF_ID_PREFIX = 'water_reminder_';
const MAX_WATER_REMINDERS = 20;

// ===========================
// STRINGS INTERNACIONALIZADAS
// ===========================
type LangKey = 'pt' | 'en' | 'es';

const STRINGS: Record<LangKey, {
  channelName: string;
  dailyTitle: (count: number) => string;
  dailyBody: string;
  eventBody: (leadMin: number) => string;
}> = {
  pt: {
    channelName: 'Eventos TaskFlow',
    dailyTitle: (n) => `Você tem ${n} compromisso${n !== 1 ? 's' : ''} hoje`,
    dailyBody: 'Toque para ver sua agenda do dia.',
    eventBody: (m) => m >= 60 ? `Começa em ${Math.round(m / 60)}h` : `Começa em ${m} min`,
  },
  en: {
    channelName: 'TaskFlow Events',
    dailyTitle: (n) => `You have ${n} event${n !== 1 ? 's' : ''} today`,
    dailyBody: 'Tap to view your schedule.',
    eventBody: (m) => m >= 60 ? `Starts in ${Math.round(m / 60)}h` : `Starts in ${m} min`,
  },
  es: {
    channelName: 'Eventos TaskFlow',
    dailyTitle: (n) => `Tienes ${n} compromiso${n !== 1 ? 's' : ''} hoy`,
    dailyBody: 'Toca para ver tu agenda del día.',
    eventBody: (m) => m >= 60 ? `Empieza en ${Math.round(m / 60)}h` : `Empieza en ${m} min`,
  },
};

// ===========================
// CANAL ANDROID
// ===========================
const ensureChannel = async (): Promise<void> => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'TaskFlow Events',
    importance: AndroidImportance.DEFAULT,
  });
};

const ensureWaterChannel = async (): Promise<void> => {
  await notifee.createChannel({
    id: WATER_CHANNEL_ID,
    name: 'TaskFlow Water Reminders',
    importance: AndroidImportance.DEFAULT,
  });
};

const ensureWaterAlarmChannel = async (): Promise<void> => {
  await notifee.createChannel({
    id: WATER_ALARM_CHANNEL_ID,
    name: 'TaskFlow Water Alarm',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
};

const WATER_STRINGS: Record<LangKey, { title: string; body: string }> = {
  pt: { title: 'Hora de beber água! 💧', body: 'Não se esqueça da sua meta de hidratação.' },
  en: { title: 'Time to drink water! 💧', body: "Don't forget your hydration goal." },
  es: { title: '¡Hora de tomar agua! 💧', body: 'No olvides tu meta de hidratación.' },
};

// ===========================
// PERMISSÃO
// ===========================
/**
 * Solicita permissão de notificações.
 * Retorna true se concedida, false se negada.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const result = await notifee.requestPermission();
  return (
    result.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    result.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
};

// ===========================
// HELPERS
// ===========================
/** Extrai YYYY-MM-DD de uma start_time ISO */
const dateOf = (start_time: string): string => start_time.slice(0, 10);

/** True se o evento é de dia todo (hora = T00:00:00) */
const isAllDay = (start_time: string): boolean =>
  start_time.endsWith('T00:00:00') || start_time.endsWith('T00:00');

/** Retorna timestamp ms para HH:MM no dia YYYY-MM-DD (fuso local) */
const timestampForTimeOnDate = (dateStr: string, timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

/** Eventos agendados, não concluídos, não pendentes, com start_time */
const schedulableEvents = (events: Event[]): Event[] =>
  events.filter(
    (e) =>
      !e.is_completed &&
      !e.is_pending &&
      e.start_time != null,
  );

// ===========================
// AGENDAMENTO PRINCIPAL
// ===========================
/**
 * Cancela todas as notificações pendentes e reagenda de acordo com as configurações.
 * Deve ser chamado:
 *   - no init() do App.tsx após carregar eventos
 *   - após qualquer mutação de eventos
 *   - após qualquer mudança de configuração de notificação
 */
export const scheduleAllNotifications = async (
  events: Event[],
  settings: AppSettings,
): Promise<void> => {
  // Sempre cancela tudo antes
  await notifee.cancelAllNotifications();

  if (!settings.notificationsEnabled) return;

  await ensureChannel();

  const lang: LangKey = (settings.language as LangKey) ?? 'pt';
  const strings = STRINGS[lang] ?? STRINGS.pt;
  const now = Date.now();
  const mode = settings.notificationMode ?? 'daily';
  const morningTime = settings.notificationTime ?? '08:00';
  const leadMinutes = settings.notificationLeadMinutes ?? 30;

  const evts = schedulableEvents(events);

  if (mode === 'daily') {
    // Agrupa por data
    const byDate = new Map<string, number>();
    for (const e of evts) {
      const d = dateOf(e.start_time!);
      byDate.set(d, (byDate.get(d) ?? 0) + 1);
    }

    for (const [dateStr, count] of byDate.entries()) {
      const triggerTs = timestampForTimeOnDate(dateStr, morningTime);
      if (triggerTs <= now) continue; // já passou

      await notifee.createTriggerNotification(
        {
          title: strings.dailyTitle(count),
          body: strings.dailyBody,
          android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', importance: AndroidImportance.DEFAULT },
          ios: { sound: 'default' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: triggerTs },
      );
    }
  } else {
    // Por evento
    for (const e of evts) {
      const startTs = new Date(e.start_time!).getTime();
      let triggerTs: number;

      if (isAllDay(e.start_time!)) {
        // Dia todo → notifica no horário matinal do mesmo dia
        triggerTs = timestampForTimeOnDate(dateOf(e.start_time!), morningTime);
      } else {
        // Evento com hora → notifica com antecedência
        triggerTs = startTs - leadMinutes * 60 * 1000;
      }

      if (triggerTs <= now) continue; // já passou

      await notifee.createTriggerNotification(
        {
          title: e.title,
          body: isAllDay(e.start_time!)
            ? strings.dailyBody
            : strings.eventBody(leadMinutes),
          android: { channelId: CHANNEL_ID, smallIcon: 'ic_launcher', importance: AndroidImportance.DEFAULT },
          ios: { sound: 'default' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: triggerTs },
      );
    }
  }
};

// ===========================
// LEMBRETES DE ÁGUA (W5)
// ===========================
/**
 * Cancela os lembretes de água existentes e reagenda de acordo com as configs.
 * Deve ser chamado após cada registro de ingestão e após mudar as configurações.
 */
type WaterSettings = Pick<AppSettings,
  'waterTrackerEnabled' | 'waterReminderEnabled' | 'waterDailyGoalMl' | 'waterReminderIntervalMinutes' |
  'waterStartTime' | 'waterEndTime' | 'language'
>;

export const scheduleWaterReminders = async (
  settings: WaterSettings,
  consumedMl: number,
): Promise<void> => {
  // Cancela todos os lembretes de água existentes
  const existingIds = Array.from(
    { length: MAX_WATER_REMINDERS },
    (_, i) => `${WATER_NOTIF_ID_PREFIX}${i}`,
  );
  await Promise.allSettled(existingIds.map(id => notifee.cancelNotification(id)));

  if (!settings.waterTrackerEnabled) return;
  if (!settings.waterReminderEnabled) return;
  const intervalMin = settings.waterReminderIntervalMinutes ?? 120;
  if (intervalMin <= 0) return;
  const goalMl = settings.waterDailyGoalMl ?? 2000;
  if (consumedMl >= goalMl) return; // meta já atingida — sem lembretes

  await ensureWaterChannel();

  const lang: LangKey = (settings.language as LangKey) ?? 'pt';
  const strings = WATER_STRINGS[lang] ?? WATER_STRINGS.pt;
  const now = Date.now();

  const today = new Date().toISOString().split('T')[0];
  const startTs = timestampForTimeOnDate(today, settings.waterStartTime ?? '08:00');
  const endTs = timestampForTimeOnDate(today, settings.waterEndTime ?? '18:00');

  let notifIndex = 0;
  // Primeiro lembrete: no mínimo depois do horário de início, nunca antes de (now + intervalo)
  let triggerTs = Math.max(now + intervalMin * 60 * 1000, startTs);

  while (triggerTs <= endTs && notifIndex < MAX_WATER_REMINDERS) {
    await notifee.createTriggerNotification(
      {
        id: `${WATER_NOTIF_ID_PREFIX}${notifIndex}`,
        title: strings.title,
        body: strings.body,
        android: {
          channelId: WATER_CHANNEL_ID,
          smallIcon: 'ic_launcher',
          importance: AndroidImportance.DEFAULT,
        },
        ios: {},
      },
      { type: TriggerType.TIMESTAMP, timestamp: triggerTs },
    );
    notifIndex++;
    triggerTs += intervalMin * 60 * 1000;
  }
};
