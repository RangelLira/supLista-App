// ===========================
// TELA: COMPARTILHAMENTO
// ===========================

import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFirebase } from '../contexts/FirebaseContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ShareConnection,
  ShareRequest,
  acceptShareRequest,
  cleanupSharedDocsOnDisconnect,
  createInviteCode,
  createShareRequest,
  deleteShareConnection,
  listenToIncomingRequests,
  listenToShareConnections,
  lookupInviteCode,
  rejectShareRequest,
} from '../utils/firestore';
import { loadSettings } from '../utils/storage';

// ───────────────────────────────────────────────
// MODAL: EXIBIR QR CODE
// ───────────────────────────────────────────────
function QRModal({ visible, code, onClose }: { visible: boolean; code: string; onClose: () => void }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={qrModalStyles.overlay}>
        <View style={[qrModalStyles.container, { backgroundColor: colors.bgCard }]}>
          <Text style={[qrModalStyles.title, { color: colors.textPrimary }]}>{t.sharing.qrTitle}</Text>
          <Text style={[qrModalStyles.subtitle, { color: colors.textSecondary }]}>
            {t.sharing.qrSubtitle}
          </Text>
          <View style={qrModalStyles.qrBox}>
            <QRCode value={code} size={200} color="#000000" backgroundColor="#FFFFFF" />
          </View>
          <Text style={[qrModalStyles.codeLabel, { color: colors.primary }]}>{code}</Text>
          <Text style={[qrModalStyles.hint, { color: colors.textMuted }]}>
            {t.sharing.qrHint}
          </Text>
          <TouchableOpacity style={[qrModalStyles.copyBtn, { backgroundColor: copied ? colors.success : colors.primary }]} onPress={handleCopy}>
            <Text style={qrModalStyles.copyBtnText}>{copied ? t.sharing.copiedTitle : t.sharing.copyCode}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[qrModalStyles.closeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]} onPress={onClose}>
            <Text style={[qrModalStyles.closeBtnText, { color: colors.textSecondary }]}>{t.sharing.qrClose}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const qrModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  copyBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  copyBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

// ───────────────────────────────────────────────
// TELA PRINCIPAL
// ───────────────────────────────────────────────
export default function SharingScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { userId, sharingEnabled, setSharingEnabled, isGoogleConnected } = useFirebase();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [displayName, setDisplayName] = useState('');
  const [connections, setConnections] = useState<ShareConnection[]>([]);

  // Desambiguação de contatos com o mesmo nome de exibição (o usuário não controla
  // o nome do amigo) — mostra a data da conexão quando há colisão.
  const partnerNameOf = (c: ShareConnection) => (c.fromUid === userId ? c.toDisplayName : c.fromDisplayName);
  const nameCounts = useMemo(() => {
    const m: Record<string, number> = {};
    connections.forEach(c => {
      const k = partnerNameOf(c).trim().toLowerCase();
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, userId]);
  const isAmbiguousName = (c: ShareConnection) =>
    (nameCounts[partnerNameOf(c).trim().toLowerCase()] ?? 0) > 1;
  const fmtConnDate = (ms: number) => {
    const d = new Date(ms);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  const [incomingRequests, setIncomingRequests] = useState<ShareRequest[]>([]);
  const [connectCode, setConnectCode] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectResult, setConnectResult] = useState<'sent' | 'error' | null>(null);
  const [loadingEnable, setLoadingEnable] = useState(false);

  // Código de convite gerado
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Modal QR Code
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      if (s.displayName) setDisplayName(s.displayName);
    });
  }, []);

  useEffect(() => {
    if (!userId || !sharingEnabled) return;
    const unsubConnections = listenToShareConnections(userId, setConnections);
    const unsubRequests = listenToIncomingRequests(userId, setIncomingRequests);
    return () => { unsubConnections(); unsubRequests(); };
  }, [userId, sharingEnabled]);

  const handleEnable = async () => {
    setLoadingEnable(true);
    try {
      await setSharingEnabled(true);
    } catch {
      // sharing-requires-google — sem conta Google não dá para compartilhar
      Alert.alert(t.sharing.requiresGoogleTitle, t.sharing.requiresGoogleMsg);
    }
    setLoadingEnable(false);
  };

  const handleDisable = () => {
    Alert.alert(
      t.sharing.disableAlertTitle,
      t.sharing.disableAlertMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.sharing.disableAlertBtn, style: 'destructive', onPress: async () => {
          setLoadingEnable(true);
          try {
            await setSharingEnabled(false);
          } catch (err) {
            console.warn('[handleDisable] falha ao revogar compartilhamentos:', err);
            Alert.alert(t.common.error, t.sharing.disableErrorMsg);
          }
          setLoadingEnable(false);
        }},
      ]
    );
  };

  const handleGenerateCode = async () => {
    if (!userId) {
      Alert.alert(t.common.error, t.sharing.authErrorMsg);
      return;
    }
    if (!displayName.trim()) {
      Alert.alert(t.common.error, t.sharing.noDisplayNameMsg);
      return;
    }
    if (inviteCode) {
      setShowQRModal(true);
      return;
    }
    setGeneratingCode(true);
    try {
      const code = await createInviteCode(userId, displayName);
      setInviteCode(code);
      setShowQRModal(true);
    } catch (err: any) {
      const detail = err?.message ?? err?.code ?? String(err);
      console.error('[handleGenerateCode] Firestore error:', detail, err);
      Alert.alert(t.common.error, `${t.sharing.errorGenerate}\n\n${detail}`);
    }
    setGeneratingCode(false);
  };

  const handleConnect = async () => {
    const code = connectCode.trim().toUpperCase();
    if (!code) {
      Alert.alert(t.sharing.codeInvalidTitle, t.sharing.codeEmptyMsg);
      return;
    }
    if (!userId || !displayName) {
      Alert.alert(t.common.error, t.sharing.authErrorMsg);
      return;
    }

    setConnectLoading(true);
    setConnectResult(null);
    try {
      const invite = await lookupInviteCode(code);
      if (!invite) {
        Alert.alert(t.sharing.codeInvalidTitle, t.sharing.codeInvalidMsg);
        setConnectLoading(false);
        return;
      }
      if (invite.used) {
        Alert.alert(t.sharing.codeUsedTitle, t.sharing.codeUsedMsg);
        setConnectLoading(false);
        return;
      }
      if (invite.ownerUid === userId) {
        Alert.alert(t.sharing.ownCodeTitle, t.sharing.ownCodeMsg);
        setConnectLoading(false);
        return;
      }
      const alreadyConnected = connections.some(
        c => c.fromUid === invite.ownerUid || c.toUid === invite.ownerUid
      );
      if (alreadyConnected) {
        Alert.alert(t.sharing.alreadyConnectedTitle, t.sharing.alreadyConnectedMsg(invite.ownerDisplayName));
        setConnectLoading(false);
        return;
      }

      await createShareRequest(code, userId, displayName, invite.ownerUid);
      setConnectCode('');
      setConnectResult('sent');
    } catch {
      Alert.alert(t.common.error, t.sharing.errorConnect);
      setConnectResult('error');
    }
    setConnectLoading(false);
  };

  const handleAccept = async (req: ShareRequest) => {
    try {
      await acceptShareRequest(req, displayName);
    } catch {
      Alert.alert(t.common.error, t.sharing.errorAccept);
    }
  };

  const handleReject = (req: ShareRequest) => {
    Alert.alert(
      t.sharing.rejectTitle,
      t.sharing.rejectMsg(req.fromDisplayName),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.sharing.rejectBtn, style: 'destructive', onPress: () => rejectShareRequest(req.id) },
      ]
    );
  };

  const handleDisconnect = (conn: ShareConnection) => {
    const otherName = conn.fromUid === userId ? conn.toDisplayName : conn.fromDisplayName;
    const partnerUid = conn.fromUid === userId ? conn.toUid : conn.fromUid;
    Alert.alert(
      t.sharing.disconnectTitle,
      t.sharing.disconnectMsg(otherName),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.sharing.disconnectBtn, style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            // Revoga o acesso às listas ANTES de apagar a conexão. Se a limpeza
            // falhar, aborta — não deixa a conexão sumir com listas ainda acessíveis.
            try {
              await cleanupSharedDocsOnDisconnect(userId, partnerUid);
            } catch (err) {
              console.warn('[handleDisconnect] falha ao revogar listas:', err);
              Alert.alert(t.common.error, t.sharing.disconnectCleanupError);
              return;
            }
            try {
              await deleteShareConnection(conn.id);
            } catch (err) {
              console.warn('[handleDisconnect] falha ao apagar conexão:', err);
              Alert.alert(t.common.error, t.sharing.errorConnect);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        {/* Sem conta Google não há compartilhamento */}
        {!isGoogleConnected ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.sharing.requiresGoogleTitle}</Text>
            <Text style={styles.sectionDesc}>{t.sharing.requiresGoogleMsg}</Text>
          </View>
        ) : (
          /* TOGGLE */
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>
              {sharingEnabled ? t.sharing.disableBtn : t.sharing.enableBtn}
            </Text>
            {loadingEnable
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Switch
                  value={!!sharingEnabled}
                  onValueChange={(val) => val ? handleEnable() : handleDisable()}
                  trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                  thumbColor={sharingEnabled ? colors.primaryLight : colors.textSecondary}
                />
            }
          </View>
        )}

        {/* SOLICITAÇÕES PENDENTES */}
        {isGoogleConnected && sharingEnabled && incomingRequests.length > 0 && (
          <View style={[styles.section, styles.sectionHighlight]}>
            <Text style={styles.sectionTitle}>
              {t.sharing.pendingRequests(incomingRequests.length)}
            </Text>
            <Text style={styles.sectionDesc}>
              {t.sharing.pendingRequestsDesc}
            </Text>
            {incomingRequests.map(req => (
              <View key={req.id} style={styles.requestRow}>
                <Text style={styles.requestAvatar}>👤</Text>
                <Text style={styles.requestName}>{req.fromDisplayName}</Text>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req)}>
                  <Text style={styles.acceptBtnText}>{t.sharing.accept}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(req)}>
                  <Text style={styles.rejectBtnText}>{t.sharing.reject}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {isGoogleConnected && sharingEnabled && (
          <>
            {/* GERAR CÓDIGO DE CONVITE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.sharing.generateCodeTitle}</Text>
              <Text style={styles.sectionDesc}>
                {t.sharing.generateCodeDesc}
              </Text>
              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateCode} disabled={generatingCode}>
                {generatingCode
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.generateBtnText}>{t.sharing.generateBtn}</Text>
                }
              </TouchableOpacity>
            </View>

            {/* CONECTAR COM ALGUÉM */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.sharing.useCodeTitle}</Text>
              <Text style={styles.sectionDesc}>{t.sharing.useCodeDesc}</Text>
              <TextInput
                style={styles.input}
                value={connectCode}
                onChangeText={code => { setConnectCode(code); setConnectResult(null); }}
                placeholder={t.sharing.codePlaceholder}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
              />
              {connectResult === 'sent' && (
                <Text style={styles.successMsg}>{t.sharing.requestSent}</Text>
              )}
              <TouchableOpacity
                style={styles.connectBtn}
                onPress={handleConnect}
                disabled={connectLoading}>
                {connectLoading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.connectBtnText}>{t.sharing.sendRequest}</Text>
                }
              </TouchableOpacity>
            </View>

            {/* CONEXÕES ATIVAS */}
            {connections.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.sharing.activeConnections}</Text>
                {connections.map(conn => {
                  const name = conn.fromUid === userId ? conn.toDisplayName : conn.fromDisplayName;
                  const isSent = conn.fromUid === userId;
                  return (
                    <View key={conn.id} style={styles.connectionRow}>
                      <Text style={styles.connectionAvatar}>👤</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.connectionName}>{name}</Text>
                        <Text style={styles.connectionMeta}>
                          {isSent ? t.sharing.youInitiated : t.sharing.addedYou}
                          {isAmbiguousName(conn) ? ` • ${t.sharing.connectedOn(fmtConnDate(conn.createdAt))}` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.disconnectBtn} onPress={() => handleDisconnect(conn)}>
                        <Text style={styles.disconnectBtnText}>{t.sharing.removeConnection}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {connections.length === 0 && incomingRequests.length === 0 && (
              <View style={styles.emptyConnections}>
                <Text style={styles.emptyIcon}>🤝</Text>
                <Text style={styles.emptyText}>{t.sharing.noConnections}</Text>
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* MODAL: EXIBIR QR CODE */}
      <QRModal
        visible={showQRModal}
        code={inviteCode ?? ''}
        onClose={() => setShowQRModal(false)}
      />

    </>
  );
}

function createStyles(c: typeof import('../styles/theme').darkColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgMain },
    content: { padding: 16, paddingBottom: 40 },

    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    toggleLabel: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '600' },

    section: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionHighlight: {
      borderColor: c.primary,
      backgroundColor: c.primary + '11',
    },
    sectionTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
    sectionDesc: { color: c.textSecondary, fontSize: 13, marginBottom: 12 },

    // Solicitações
    requestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 4,
    },
    requestAvatar: { fontSize: 20 },
    requestName: { flex: 1, color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    acceptBtn: { backgroundColor: c.success, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
    acceptBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },
    rejectBtn: { backgroundColor: c.bgSecondary, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: c.border },
    rejectBtnText: { color: c.textSecondary, fontSize: 12 },

    // Código de convite
    generateBtn: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 13,
      alignItems: 'center',
    },
    generateBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

    // Input
    input: {
      backgroundColor: c.bgSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 2,
      marginBottom: 10,
      textAlign: 'center',
    },
    successMsg: {
      color: c.success,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 8,
    },
    connectBtn: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    connectBtnDisabled: { backgroundColor: c.bgSecondary, borderWidth: 1, borderColor: c.border },
    connectBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

    // Conexões
    connectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 4,
    },
    connectionAvatar: { fontSize: 22 },
    connectionName: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
    connectionMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    disconnectBtn: {
      backgroundColor: c.bgSecondary,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    disconnectBtnText: { color: c.textSecondary, fontSize: 12, fontWeight: '500' },

    emptyConnections: { alignItems: 'center', paddingVertical: 24 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  });
}
