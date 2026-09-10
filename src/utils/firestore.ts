// ===========================
// UTILITÁRIOS: FIRESTORE SYNC
// ===========================

import firestore from '@react-native-firebase/firestore';
import { ShoppingList } from '../types';

// ===========================
// COLEÇÕES
// ===========================
// users/{userId}
// shares/{shareId} → { fromUid, toUid, displayName, createdAt }
// sharedLists/{ownerUid}_{listId}

// ===========================
// USUÁRIOS
// ===========================

export interface UserProfile {
  uid: string;
  displayName: string;
  createdAt: number;
  // false = o usuário desativou o compartilhamento e não pode receber listas agora.
  // undefined (perfis antigos) = disponível, por retrocompatibilidade.
  acceptsSharing?: boolean;
}

export const saveUserProfile = async (uid: string, displayName: string): Promise<void> => {
  await firestore().collection('users').doc(uid).set({
    uid,
    displayName,
    createdAt: Date.now(),
  }, { merge: true });
};

/** Atualiza só o nome de exibição no perfil (sem mexer em createdAt). */
export const setUserDisplayName = async (uid: string, displayName: string): Promise<void> => {
  await firestore().collection('users').doc(uid).set({ displayName }, { merge: true });
};

/**
 * Propaga um novo nome de exibição para todas as conexões (`shares`) das quais
 * o usuário participa, para que o parceiro veja o nome atualizado em tempo real.
 * O `fromDisplayName` / `toDisplayName` é um snapshot no doc — sem isto, o nome
 * antigo fica congelado no aparelho do parceiro.
 */
export const propagateDisplayName = async (uid: string, displayName: string): Promise<void> => {
  const db = firestore();
  const [asSender, asReceiver] = await Promise.all([
    db.collection('shares').where('fromUid', '==', uid).get(),
    db.collection('shares').where('toUid', '==', uid).get(),
  ]);
  const batch = db.batch();
  let n = 0;
  asSender.docs.forEach(d => {
    if ((d.data() as any).fromDisplayName !== displayName) { batch.update(d.ref, { fromDisplayName: displayName }); n++; }
  });
  asReceiver.docs.forEach(d => {
    if ((d.data() as any).toDisplayName !== displayName) { batch.update(d.ref, { toDisplayName: displayName }); n++; }
  });
  if (n > 0) await batch.commit();
};

/**
 * Publica no perfil se este usuário aceita receber compartilhamentos.
 * Espelha o toggle local `sharingEnabled` para que o parceiro consiga checar
 * antes de tentar compartilhar uma lista.
 */
export const setAcceptsSharing = async (uid: string, accepts: boolean): Promise<void> => {
  await firestore().collection('users').doc(uid).set({ acceptsSharing: accepts }, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const doc = await firestore().collection('users').doc(uid).get();
  const data = doc.data();
  return data ? (data as UserProfile) : null;
};

// ===========================
// COMPARTILHAMENTOS
// ===========================

export interface ShareConnection {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  toUid: string;
  toDisplayName: string;
  createdAt: number;
}

/** Conecta dois usuários. Retorna o ID da conexão. */
export const createShareConnection = async (
  fromUid: string,
  fromDisplayName: string,
  toUid: string,
  toDisplayName: string,
): Promise<string> => {
  const ref = await firestore().collection('shares').add({
    fromUid,
    fromDisplayName,
    toUid,
    toDisplayName,
    createdAt: Date.now(),
  });
  return ref.id;
};

/**
 * Escuta conexões onde o usuário aparece (sender ou receiver).
 * Corrigido: processa os snapshots diretamente, sem queries adicionais.
 */
export const listenToShareConnections = (
  uid: string,
  onUpdate: (connections: ShareConnection[]) => void,
): (() => void) => {
  // Cache local dos dois lados, atualizado independentemente
  let sentConnections: ShareConnection[] = [];
  let receivedConnections: ShareConnection[] = [];

  const merge = () => {
    // Deduplica por ID antes de emitir
    const map = new Map<string, ShareConnection>();
    for (const c of [...sentConnections, ...receivedConnections]) map.set(c.id, c);
    onUpdate(Array.from(map.values()));
  };

  const unsubSent = firestore()
    .collection('shares')
    .where('fromUid', '==', uid)
    .onSnapshot(
      snap => {
        sentConnections = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareConnection));
        merge();
      },
      error => console.warn('[listenToShareConnections:sent] falha na escuta:', error),
    );

  const unsubReceived = firestore()
    .collection('shares')
    .where('toUid', '==', uid)
    .onSnapshot(
      snap => {
        receivedConnections = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareConnection));
        merge();
      },
      error => console.warn('[listenToShareConnections:received] falha na escuta:', error),
    );

  return () => { unsubSent(); unsubReceived(); };
};

export const deleteShareConnection = async (shareId: string): Promise<void> => {
  await firestore().collection('shares').doc(shareId).delete();
};

// ===========================
// LISTAS COMPARTILHADAS
// ===========================

/**
 * Só os campos que pertencem ao documento compartilhado. Whitelist explícita:
 * mantém fora campos locais (isSharedWithMe), o ownerUid vem sempre do parâmetro
 * de quem chama, e nada fica undefined (o Firestore rejeita undefined).
 */
export const toSharedDoc = (list: ShoppingList) => ({
  id: list.id,
  name: list.name ?? '',
  suppliers: list.suppliers ?? [],
  items: (list.items ?? []).map(i => ({
    id: i.id,
    name: i.name ?? '',
    quantity: i.quantity ?? 1,
    unit: i.unit ?? null,
    isChecked: i.isChecked ?? false,
    price: i.price ?? null,
    priceType: i.priceType ?? 'unit',
  })),
  createdAt: list.createdAt ?? new Date().toISOString(),
  isCompleted: list.isCompleted ?? false,
  isArchived: list.isArchived ?? false,
  totalSpent: list.totalSpent ?? 0,
  tag_name: list.tag_name ?? 'Geral',
  notes: list.notes ?? null,
  completedAt: list.completedAt ?? null,
  sharedWithUid: list.sharedWithUid ?? null,
});

export const shareList = async (list: ShoppingList, ownerUid: string, partnerUid: string): Promise<void> => {
  await firestore()
    .collection('sharedLists')
    .doc(`${ownerUid}_${list.id}`)
    .set({
      ...toSharedDoc(list),
      ownerUid,
      sharedWithUid: partnerUid,
      updatedAt: Date.now(),
    }, { merge: true });
};

export const unshareList = async (list: ShoppingList, ownerUid: string): Promise<void> => {
  await firestore()
    .collection('sharedLists')
    .doc(`${ownerUid}_${list.id}`)
    .update({
      sharedWithUid: null,
      updatedAt: Date.now(),
    });
};

export const updateSharedList = async (list: ShoppingList, ownerUid: string): Promise<void> => {
  await firestore()
    .collection('sharedLists')
    .doc(`${ownerUid}_${list.id}`)
    .set({ ...toSharedDoc(list), ownerUid, updatedAt: Date.now() }, { merge: true });
};

export const listenToSharedListsWithMe = (
  myUid: string,
  onUpdate: (lists: ShoppingList[]) => void,
  onError?: (error: unknown) => void,
): (() => void) => {
  return firestore()
    .collection('sharedLists')
    .where('sharedWithUid', '==', myUid)
    .onSnapshot(
      snap => {
        if (!snap) return;
        const lists = snap.docs.map(d => d.data() as ShoppingList);
        onUpdate(lists);
      },
      error => {
        console.warn('[listenToSharedListsWithMe] falha na escuta (rede/permissão):', error);
        onError?.(error);
      },
    );
};

/**
 * Sair de uma lista compartilhada comigo (receptor).
 * Remove sharedWithUid do documento mas não deleta — o dono continua com o item.
 */
export const exitSharedList = async (ownerUid: string, listId: number): Promise<void> => {
  await firestore()
    .collection('sharedLists')
    .doc(`${ownerUid}_${listId}`)
    .update({
      sharedWithUid: null,
      updatedAt: Date.now(),
    });
};

export const deleteSharedListDoc = async (ownerUid: string, listId: number): Promise<void> => {
  await firestore().collection('sharedLists').doc(`${ownerUid}_${listId}`).delete();
};

// ===========================
// ESCUTA: MINHAS LISTAS COMPARTILHADAS (dono) — traz o documento inteiro
// ===========================
// Corrigido: antes só repassava { id, sharedWithUid }, descartando qualquer
// edição feita pelo receptor (itens, nome, notas). Agora traz o ShoppingList
// completo, igual a listenToSharedListsWithMe, para que o dono também receba
// em tempo real o que o parceiro alterou.

export const listenToMySharedLists = (
  ownerUid: string,
  onUpdate: (lists: ShoppingList[]) => void,
  onError?: (error: unknown) => void,
): (() => void) => {
  return firestore()
    .collection('sharedLists')
    .where('ownerUid', '==', ownerUid)
    .onSnapshot(
      snap => {
        if (!snap) return;
        const lists = snap.docs.map(d => d.data() as ShoppingList);
        onUpdate(lists);
      },
      error => {
        console.warn('[listenToMySharedLists] falha na escuta (rede/permissão):', error);
        onError?.(error);
      },
    );
};

// ===========================
// CÓDIGOS DE CONVITE (one-time, single-use)
// ===========================

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateCode = () => {
  let code = '';
  for (let i = 0; i < 8; i++) code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  return code;
};

export interface InviteCodeData {
  ownerUid: string;
  ownerDisplayName: string;
  createdAt: number;
  expiresAt: number; // timestamp ms — 24h após criação
  used: boolean;
}

const INVITE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const createInviteCode = async (ownerUid: string, ownerDisplayName: string): Promise<string> => {
  let code = generateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await firestore().collection('invites').doc(code).get();
    if (!existing.data()) break;
    code = generateCode();
  }
  const now = Date.now();
  await firestore().collection('invites').doc(code).set({
    ownerUid,
    ownerDisplayName,
    createdAt: now,
    expiresAt: now + INVITE_TTL_MS,
    used: false,
  });
  return code;
};

export const lookupInviteCode = async (code: string): Promise<InviteCodeData | null> => {
  const ref = firestore().collection('invites').doc(code.toUpperCase());
  const doc = await ref.get();
  const data = doc.data() as InviteCodeData | undefined;
  if (!data) return null;
  // Expirou — deleta automaticamente e retorna null
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await ref.delete().catch(() => {});
    return null;
  }
  return data;
};

// ===========================
// SOLICITAÇÕES DE CONEXÃO (aceite/recusa)
// ===========================

export interface ShareRequest {
  id: string;
  fromUid: string;
  fromDisplayName: string;
  toUid: string;
  createdAt: number;
}

export const createShareRequest = async (
  inviteCode: string,
  fromUid: string,
  fromDisplayName: string,
  toUid: string,
): Promise<void> => {
  const db = firestore();
  const inviteRef = db.collection('invites').doc(inviteCode.toUpperCase());

  await db.runTransaction(async tx => {
    const doc = await tx.get(inviteRef);
    const data = doc.data() as InviteCodeData | undefined;
    if (!data || (data.expiresAt && Date.now() > data.expiresAt)) {
      throw Object.assign(new Error('Código inválido ou expirado.'), { code: 'INVITE_NOT_FOUND' });
    }
    if (data.used) {
      throw Object.assign(new Error('Código já utilizado.'), { code: 'INVITE_ALREADY_USED' });
    }
    tx.update(inviteRef, { used: true });
    tx.set(db.collection('shareRequests').doc(), {
      fromUid,
      fromDisplayName,
      toUid,
      createdAt: Date.now(),
    });
  });
};

export const listenToIncomingRequests = (
  uid: string,
  onUpdate: (requests: ShareRequest[]) => void,
): (() => void) => {
  return firestore()
    .collection('shareRequests')
    .where('toUid', '==', uid)
    .onSnapshot(
      snap => {
        if (!snap) return;
        const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShareRequest));
        onUpdate(requests);
      },
      error => console.warn('[listenToIncomingRequests] falha na escuta:', error),
    );
};

export const acceptShareRequest = async (
  request: ShareRequest,
  toDisplayName: string,
): Promise<void> => {
  const batch = firestore().batch();
  // Cria conexão bidirecional
  batch.set(firestore().collection('shares').doc(), {
    fromUid: request.fromUid,
    fromDisplayName: request.fromDisplayName,
    toUid: request.toUid,
    toDisplayName,
    createdAt: Date.now(),
  });
  // Remove solicitação
  batch.delete(firestore().collection('shareRequests').doc(request.id));
  await batch.commit();
};

export const rejectShareRequest = async (requestId: string): Promise<void> => {
  await firestore().collection('shareRequests').doc(requestId).delete();
};

// ===========================
// LIMPEZA AO DESCONECTAR
// ===========================

/**
 * Ao desconectar de um parceiro, zera sharedWithUid em todos os documentos
 * compartilhados entre os dois (nos dois sentidos), sem deletá-los.
 * O dono mantém o item; o receptor deixa de vê-lo pelo listener.
 */
export const cleanupSharedDocsOnDisconnect = async (
  myUid: string,
  partnerUid: string,
): Promise<void> => {
  const db = firestore();
  const nullify = { sharedWithUid: null, updatedAt: Date.now() };

  // Consultas de campo único + filtro no cliente — evita índice composto e
  // respeita as regras (ownerUid==me OU sharedWithUid==me sempre são legíveis).
  const [owned, sharedWithMe] = await Promise.all([
    db.collection('sharedLists').where('ownerUid', '==', myUid).get(),
    db.collection('sharedLists').where('sharedWithUid', '==', myUid).get(),
  ]);

  const docs = [
    ...owned.docs.filter(d => (d.data() as any).sharedWithUid === partnerUid),
    ...sharedWithMe.docs.filter(d => (d.data() as any).ownerUid === partnerUid),
  ];
  if (docs.length === 0) return;

  const seen = new Set<string>();
  const batch = db.batch();
  for (const d of docs) {
    if (seen.has(d.ref.path)) continue;
    seen.add(d.ref.path);
    batch.update(d.ref, nullify);
  }
  await batch.commit();
};

/**
 * Desativar o compartilhamento por completo (regra de ouro).
 * - Todas as listas que EU sou dono: sharedWithUid → null (somem para os parceiros).
 * - Todas as listas compartilhadas COMIGO: sharedWithUid → null (saio de cada uma).
 * Nada é deletado; o dono mantém a própria lista. Ao reativar, os compartilhamentos
 * de lista NÃO voltam sozinhos — precisam ser refeitos um a um.
 * Lança em caso de falha (ex.: offline) para que a UI não desative sem revogar.
 */
export const disableAllSharing = async (myUid: string): Promise<void> => {
  const db = firestore();
  const nullify = { sharedWithUid: null, updatedAt: Date.now() };

  const [owned, sharedWithMe] = await Promise.all([
    db.collection('sharedLists').where('ownerUid', '==', myUid).get(),
    db.collection('sharedLists').where('sharedWithUid', '==', myUid).get(),
  ]);

  const docs = [
    ...owned.docs.filter(d => (d.data() as any).sharedWithUid != null),
    ...sharedWithMe.docs,
  ];
  if (docs.length === 0) return;

  // Deduplica por caminho (uma lista que eu compartilho comigo mesmo é impossível,
  // mas mantém a garantia caso as duas queries retornem o mesmo doc).
  const seen = new Set<string>();
  const batch = db.batch();
  for (const d of docs) {
    if (seen.has(d.ref.path)) continue;
    seen.add(d.ref.path);
    batch.update(d.ref, nullify);
  }
  await batch.commit();
};
