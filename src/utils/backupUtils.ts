// ===========================
// UTILITÁRIOS: BACKUP DE DADOS
// ===========================

import { Alert, Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import firestore from '@react-native-firebase/firestore';
import {
  loadEvents, loadLists, loadRotinas, loadSettings, loadWaterLog,
  saveEvents, saveLists, saveRotinas, saveSettings, saveWaterLog,
} from './storage';

const BACKUP_VERSION = 1;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: {
    events: any[];
    lists: any[];
    rotinas: any[];
    settings: any;
    waterLog?: any;
  };
}

// ─── Payload completo de todos os dados do usuário ───────────────────────────

async function buildBackupPayload(): Promise<BackupPayload> {
  const [events, lists, rotinas, settings, waterLog] = await Promise.all([
    loadEvents(),
    loadLists(),
    loadRotinas(),
    loadSettings(),
    loadWaterLog(),
  ]);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { events, lists, rotinas, settings, waterLog },
  };
}

// ─── Validação básica do payload ─────────────────────────────────────────────

function validatePayload(parsed: any): asserts parsed is BackupPayload {
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_format');
  if (!parsed.version || !parsed.data) throw new Error('invalid_format');
  if (!Array.isArray(parsed.data.events)) throw new Error('invalid_format');
  if (!Array.isArray(parsed.data.lists)) throw new Error('invalid_format');
}

// ─── Grava o timestamp do último backup bem-sucedido ─────────────────────────

async function saveLastBackupAt(): Promise<void> {
  await saveSettings({ lastBackupAt: new Date().toISOString() });
}

// ─── Nome do arquivo de backup ────────────────────────────────────────────────

function backupFilename(): string {
  return `taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

// ─── EXPORT LOCAL — salva arquivo em Downloads (Android) / Share (iOS) ───────

export const exportLocalBackup = async (): Promise<void> => {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const filename = backupFilename();

  if (Platform.OS === 'android') {
    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, json, 'utf8');
  } else {
    // iOS: compartilha como arquivo via Share sheet
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, json, 'utf8');
    await Share.share({ title: filename, url: `file://${path}` });
  }

  await saveLastBackupAt();
};

// ─── EXPORT LOCAL SILENCIOSO — para auto-backup (sem Share sheet) ────────────

export const exportLocalBackupSilent = async (): Promise<void> => {
  const payload = await buildBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const filename = backupFilename();
  const dir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
  const path = `${dir}/${filename}`;
  await RNFS.writeFile(path, json, 'utf8');
  await saveLastBackupAt();
};

// ─── EXPORT NUVEM — grava em Firestore backups/{uid} ─────────────────────────

export const exportCloudBackup = async (uid: string): Promise<void> => {
  const payload = await buildBackupPayload();
  await firestore()
    .collection('backups')
    .doc(uid)
    .set({ ...payload, uid });
  await saveLastBackupAt();
};

// ─── IMPORT LOCAL — lista arquivos de backup disponíveis ─────────────────────
// Retorna os arquivos taskflow-backup-*.json encontrados em Downloads (Android)
// ou DocumentDirectory (iOS), do mais recente para o mais antigo.

export interface LocalBackupFile {
  name: string;
  path: string;
  mtime: Date | null;
}

export const listLocalBackups = async (): Promise<LocalBackupFile[]> => {
  const dir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
  try {
    const items = await RNFS.readDir(dir);
    return items
      .filter(f => f.isFile() && f.name.startsWith('taskflow-backup') && f.name.endsWith('.json'))
      .map(f => ({ name: f.name, path: f.path, mtime: f.mtime ?? null }))
      .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));
  } catch {
    return [];
  }
};

export const readLocalBackupFile = async (
  filePath: string,
  onConfirm: (payload: BackupPayload) => void,
  strings: { confirmTitle: string; confirmMsg: string; cancel: string; restore: string; errorTitle: string; errorMsg: string; },
): Promise<void> => {
  try {
    const content = await RNFS.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    validatePayload(parsed);
    Alert.alert(
      strings.confirmTitle,
      strings.confirmMsg,
      [
        { text: strings.cancel, style: 'cancel' },
        { text: strings.restore, style: 'destructive', onPress: () => onConfirm(parsed) },
      ],
    );
  } catch {
    Alert.alert(strings.errorTitle, strings.errorMsg);
  }
};

// ─── IMPORT NUVEM — busca Firestore + valida + restaura ──────────────────────

export const importCloudBackup = async (
  uid: string,
  onConfirm: (payload: BackupPayload) => void,
  strings: {
    confirmTitle: string;
    confirmMsg: (date: string) => string;
    cancel: string;
    restore: string;
    errorTitle: string;
    errorMsg: string;
    noBackupMsg: string;
  },
): Promise<void> => {
  const doc = await firestore().collection('backups').doc(uid).get();
  if (!doc.exists) {
    Alert.alert(strings.errorTitle, strings.noBackupMsg);
    return;
  }

  const data = doc.data() as BackupPayload;
  try {
    validatePayload(data);
  } catch {
    Alert.alert(strings.errorTitle, strings.errorMsg);
    return;
  }

  const dateStr = new Date(data.exportedAt).toLocaleString();
  Alert.alert(
    strings.confirmTitle,
    strings.confirmMsg(dateStr),
    [
      { text: strings.cancel, style: 'cancel' },
      {
        text: strings.restore,
        style: 'destructive',
        onPress: () => onConfirm(data),
      },
    ],
  );
};

// ─── APLICA RESTORE — chamado após confirmação do usuário ────────────────────

export const applyBackupRestore = async (payload: BackupPayload): Promise<void> => {
  const { events, lists, rotinas, settings, waterLog } = payload.data;
  await Promise.all([
    saveEvents(events ?? []),
    saveLists(lists ?? []),
    saveRotinas(rotinas ?? []),
    saveSettings(settings ?? {}),
    waterLog ? saveWaterLog(waterLog) : Promise.resolve(),
  ]);
};

// ─── AUTO-BACKUP DEBOUNCED — chamado após mutações significativas ─────────────

let _autoBackupTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleAutoBackup = (uid: string | null): void => {
  if (_autoBackupTimer) clearTimeout(_autoBackupTimer);
  _autoBackupTimer = setTimeout(async () => {
    _autoBackupTimer = null;
    try {
      const settings = await loadSettings();
      if (settings.backupMode !== 'auto') return;
      if (settings.backupLocation === 'cloud' && uid) {
        await exportCloudBackup(uid);
      } else if (settings.backupLocation === 'local') {
        await exportLocalBackupSilent();
      }
    } catch (e) {
      console.warn('[autoBackup] falhou:', e);
    }
  }, 10_000);
};

// ─── AUTO-BACKUP NO STARTUP ───────────────────────────────────────────────────

export const runAutoBackupIfEnabled = async (uid: string | null): Promise<void> => {
  try {
    const settings = await loadSettings();
    if (settings.backupMode !== 'auto') return;
    if (settings.backupLocation === 'cloud' && uid) {
      await exportCloudBackup(uid);
    } else if (settings.backupLocation === 'local') {
      await exportLocalBackupSilent();
    }
  } catch (error) {
    console.warn('[backupUtils] auto-backup no startup falhou:', error);
  }
};
