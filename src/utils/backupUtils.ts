// ===========================
// UTILITÁRIOS: BACKUP DE DADOS (local, sem nuvem)
// ===========================

import { Alert, Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import { loadLists, loadSettings, saveLists, saveSettings } from './storage';

const BACKUP_VERSION = 1;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: {
    lists: any[];
    settings: any;
  };
}

// ─── Payload completo de todos os dados do usuário ───────────────────────────

async function buildBackupPayload(): Promise<BackupPayload> {
  const [lists, settings] = await Promise.all([loadLists(), loadSettings()]);
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { lists, settings },
  };
}

// ─── Validação básica do payload ─────────────────────────────────────────────

function validatePayload(parsed: any): asserts parsed is BackupPayload {
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_format');
  if (!parsed.version || !parsed.data) throw new Error('invalid_format');
  if (!Array.isArray(parsed.data.lists)) throw new Error('invalid_format');
}

// ─── Grava o timestamp do último backup bem-sucedido ─────────────────────────

async function saveLastBackupAt(): Promise<void> {
  await saveSettings({ lastBackupAt: new Date().toISOString() });
}

// ─── Nome do arquivo de backup ────────────────────────────────────────────────

function backupFilename(): string {
  return `suplist-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

// ─── IMPORT LOCAL — lista arquivos de backup disponíveis ─────────────────────
// Retorna os arquivos suplist-backup-*.json encontrados em Downloads (Android)
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
      .filter(f => f.isFile() && f.name.startsWith('suplist-backup') && f.name.endsWith('.json'))
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

// ─── APLICA RESTORE — chamado após confirmação do usuário ────────────────────

export const applyBackupRestore = async (payload: BackupPayload): Promise<void> => {
  const { lists, settings } = payload.data;
  await Promise.all([
    saveLists(lists ?? []),
    saveSettings(settings ?? {}),
  ]);
};
