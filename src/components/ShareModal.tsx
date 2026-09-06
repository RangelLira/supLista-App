// ===========================
// COMPONENTE: MODAL DE COMPARTILHAMENTO
// ===========================

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFirebase } from '../contexts/FirebaseContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ShareConnection, getUserProfile, listenToShareConnections } from '../utils/firestore';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Nome da lista (para os diálogos de confirmação) */
  listName: string;
  /** UID atualmente compartilhado com este item (null = não compartilhado) */
  currentSharedWithUid: string | null;
  onToggle: (partnerUid: string, partnerName: string, isCurrentlyShared: boolean) => Promise<void>;
}

export default function ShareModal({ visible, onClose, listName, currentSharedWithUid, onToggle }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { userId, sharingEnabled } = useFirebase();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [connections, setConnections] = useState<ShareConnection[]>([]);
  const [loadingUid, setLoadingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !visible) return;
    const unsub = listenToShareConnections(userId, setConnections);
    return unsub;
  }, [userId, visible]);

  // Contatos com o mesmo nome exibido — mostra a data da conexão para diferenciar.
  const nameCounts = useMemo(() => {
    const m: Record<string, number> = {};
    connections.forEach(c => {
      const n = (c.fromUid === userId ? c.toDisplayName : c.fromDisplayName).trim().toLowerCase();
      m[n] = (m[n] ?? 0) + 1;
    });
    return m;
  }, [connections, userId]);
  const fmtConnDate = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const confirmAsync = (title: string, message: string, confirmLabel: string, destructive: boolean) =>
    new Promise<boolean>(resolve => {
      Alert.alert(
        title,
        message,
        [
          { text: t.common.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });

  const handleToggle = async (conn: ShareConnection) => {
    const partnerUid = conn.fromUid === userId ? conn.toUid : conn.fromUid;
    const partnerName = conn.fromUid === userId ? conn.toDisplayName : conn.fromDisplayName;
    const isShared = currentSharedWithUid === partnerUid;

    const confirmed = isShared
      ? await confirmAsync(t.sharing.confirmUnshareTitle, t.sharing.confirmUnshareMsg(partnerName), t.common.unshare, true)
      : await confirmAsync(t.sharing.confirmShareTitle, t.sharing.confirmShareMsg(partnerName, listName), t.common.share, false);
    if (!confirmed) return;

    setLoadingUid(partnerUid);
    try {
      if (!isShared) {
        // O parceiro pode ter desativado o compartilhamento — não pode receber listas agora.
        const profile = await getUserProfile(partnerUid).catch(() => null);
        if (profile && profile.acceptsSharing === false) {
          Alert.alert(t.sharing.partnerUnavailableTitle, t.sharing.partnerUnavailableMsg(partnerName));
          return;
        }
      }
      await onToggle(partnerUid, partnerName, isShared);
    } finally {
      setLoadingUid(null);
    }
  };

  if (!sharingEnabled) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
          <View style={styles.sheet}>
            <Text style={styles.title}>{t.common.share}</Text>
            <Text style={styles.emptyText}>{t.sharing.modalDisabled}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t.sharing.modalClose}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{t.sharing.modalTitle}</Text>

          {connections.length === 0 ? (
            <Text style={styles.emptyText}>{t.sharing.modalNoConnection}</Text>
          ) : (
            connections.map(conn => {
              const partnerUid = conn.fromUid === userId ? conn.toUid : conn.fromUid;
              const partnerName = conn.fromUid === userId ? conn.toDisplayName : conn.fromDisplayName;
              const isShared = currentSharedWithUid === partnerUid;
              const isLoading = loadingUid === partnerUid;
              const ambiguous = (nameCounts[partnerName.trim().toLowerCase()] ?? 0) > 1;
              return (
                <TouchableOpacity
                  key={conn.id}
                  style={[styles.connRow, isShared && styles.connRowActive]}
                  onPress={() => handleToggle(conn)}
                  disabled={loadingUid !== null}>
                  <Text style={styles.connAvatar}>👤</Text>
                  <View style={styles.connNameWrap}>
                    <Text style={styles.connName}>{partnerName}</Text>
                    {ambiguous && (
                      <Text style={styles.connMeta}>{t.sharing.connectedOn(fmtConnDate(conn.createdAt))}</Text>
                    )}
                  </View>
                  {isLoading
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text style={[styles.connStatus, isShared && styles.connStatusActive]}>
                        {isShared ? t.sharing.modalShared : t.common.share}
                      </Text>
                  }
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t.sharing.modalClose}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function createStyles(c: typeof import('../styles/theme').darkColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
    },
    title: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 16,
      textAlign: 'center',
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    connRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
      gap: 12,
      backgroundColor: c.bgSecondary,
    },
    connRowActive: {
      borderColor: c.primary,
      backgroundColor: c.bgMain,
    },
    connAvatar: { fontSize: 20 },
    connNameWrap: { flex: 1 },
    connName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    connMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    connStatus: {
      color: c.textSecondary,
      fontSize: 13,
    },
    connStatusActive: {
      color: c.primary,
      fontWeight: '600',
    },
    closeBtn: {
      marginTop: 8,
      paddingVertical: 13,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    closeBtnText: { color: c.textSecondary, fontSize: 15 },
  });
}
