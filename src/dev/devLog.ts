// ===========================
// DEV — MOTOR DE LOG
// ===========================
// Buffer circular em memória, persistido no AsyncStorage. Só faz algo sob
// __DEV__ — em release toda função é no-op e o require some (ver SettingsScreen).
//
// Uso:
//   import { logEvent, initDevLog } from '../dev/devLog';
//   initDevLog();                        // 1x, no boot
//   logEvent('LIST', 'update', { id }); // em qualquer handler

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@suplista_devlog';
const MAX = 5000;

export interface LogLine {
  t: number;      // Date.now()
  tag: string;    // 'APP' | 'LIST' | 'ITEM' | 'SYNC' | 'WARN' | 'ERROR' | 'DEV' ...
  msg: string;
}

let buffer: LogLine[] = [];
let started = false;
let hooked = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const persist = () => {
  if (!__DEV__) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(buffer)).catch(() => {});
  }, 500);
};

const push = (tag: string, msg: string) => {
  buffer.push({ t: Date.now(), tag, msg });
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
  persist();
};

const safeJson = (v: unknown): string => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

/** Registra um evento. No-op fora de __DEV__. */
export const logEvent = (tag: string, msg: string, data?: unknown): void => {
  if (!__DEV__) return;
  const line = data === undefined ? msg : `${msg} ${safeJson(data)}`;
  push(tag, line);
};

/** Instala captura de console.warn/console.error no buffer (idempotente). */
const installConsoleHook = () => {
  if (!__DEV__ || hooked) return;
  hooked = true;
  (['warn', 'error'] as const).forEach(level => {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        const msg = args
          .map(a =>
            typeof a === 'string' ? a
            : a instanceof Error ? (a.stack || a.message)
            : safeJson(a),
          )
          .join(' ');
        push(level.toUpperCase(), msg);
      } catch {
        // nunca deixa a captura derrubar o console real
      }
      orig(...args);
    };
  });
};

/** Carrega o log persistido e liga a captura do console. Chamar 1x no boot. */
export const initDevLog = async (): Promise<void> => {
  if (!__DEV__ || started) return;
  started = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Eventos que chegaram antes do load ficam no fim.
        buffer = [...parsed, ...buffer].slice(-MAX);
      }
    }
  } catch {
    // storage indisponível — segue só em memória
  }
  installConsoleHook();
  logEvent('DEV', 'devLog iniciado', { linhas: buffer.length });
};

const two = (n: number) => String(n).padStart(2, '0');
const three = (n: number) => String(n).padStart(3, '0');
const stamp = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ` +
    `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${three(d.getMilliseconds())}`;
};

export const getLogLines = (): LogLine[] => buffer;
export const getLogCount = (): number => buffer.length;

/** Últimas N linhas em texto puro, uma por linha. */
export const getLogText = (lastN = 1000): string =>
  buffer
    .slice(-lastN)
    .map(l => `${stamp(l.t)}  [${l.tag}]  ${l.msg}`)
    .join('\n');

/** Zera o log (memória + storage). */
export const clearLog = async (): Promise<void> => {
  buffer = [];
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
};
