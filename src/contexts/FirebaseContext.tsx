// ===========================
// CONTEXTO: FIREBASE / AUTH
// ===========================

import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { loadSettings, saveSettings } from '../utils/storage';
import { saveUserProfile } from '../utils/firestore';

// ─── Configuração do Google Sign-In ───────────────────────────────────────────
// webClientId: Firebase Console > Configurações do projeto > Android app >
//              google-services.json > oauth_client[type=3].client_id
// Deve terminar com .apps.googleusercontent.com
GoogleSignin.configure({
  webClientId: '299827637081-36iqniaen93qoqi917qpi14r0m3tpgmk.apps.googleusercontent.com',
  offlineAccess: false,
});

export interface GoogleSignInResult {
  name: string;
  email: string;
}

interface FirebaseContextValue {
  user: FirebaseAuthTypes.User | null;
  userId: string | null;
  sharingEnabled: boolean;
  isGoogleConnected: boolean;
  setSharingEnabled: (enabled: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<GoogleSignInResult | null>;
  signOutGoogle: () => Promise<void>;
  isInitializing: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  userId: null,
  sharingEnabled: false,
  isGoogleConnected: false,
  setSharingEnabled: async () => {},
  signInWithGoogle: async () => null,
  signOutGoogle: async () => {},
  isInitializing: true,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [sharingEnabled, setSharingEnabledState] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const isGoogleConnected = user !== null && !user.isAnonymous;

  useEffect(() => {
    loadSettings().then(s => {
      if (s.sharingEnabled) {
        setSharingEnabledState(true);
        // Sessão Google já é restaurada automaticamente pelo Firebase SDK.
        // Login anônimo só é criado se não houver sessão ativa.
        signInAnonymouslyIfNeeded();
      }
    });

    const unsubscribe = auth().onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      setIsInitializing(false);
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureUserProfile = async (firebaseUser: FirebaseAuthTypes.User) => {
    const settings = await loadSettings();
    const name = firebaseUser.displayName ?? settings.displayName;
    if (name) {
      await saveUserProfile(firebaseUser.uid, name);
    }
  };

  const signInAnonymouslyIfNeeded = async () => {
    try {
      const current = auth().currentUser;
      if (current) {
        await ensureUserProfile(current);
        return;
      }
      await auth().signInAnonymously();
      const newUser = auth().currentUser;
      if (newUser) await ensureUserProfile(newUser);
    } catch (error) {
      console.error('[Firebase] Erro no login anônimo:', error);
    }
  };

  // Retorna null apenas quando o próprio usuário cancela (não é um erro).
  // Qualquer outra falha (sem Play Services, sem internet, etc.) propaga a
  // exceção para o chamador decidir como avisar o usuário.
  const signInWithGoogle = async (): Promise<GoogleSignInResult | null> => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (isCancelledResponse(response)) return null;
    if (!isSuccessResponse(response)) {
      throw new Error('google-signin-failed');
    }

    const { idToken, user: googleUser } = response.data;
    if (!idToken) {
      throw new Error('google-signin-no-token');
    }

    const credential = auth.GoogleAuthProvider.credential(idToken);
    const current = auth().currentUser;

    if (current?.isAnonymous) {
      // Vincula conta anônima existente à conta Google (preserva o UID)
      try {
        await current.linkWithCredential(credential);
      } catch (linkError: any) {
        // Conta Google já existe em outra sessão Firebase — faz sign-in normal
        if (
          linkError.code === 'auth/credential-already-in-use' ||
          linkError.code === 'auth/email-already-in-use'
        ) {
          await auth().signInWithCredential(credential);
        } else {
          throw linkError;
        }
      }
    } else {
      await auth().signInWithCredential(credential);
    }

    const name = googleUser.name ?? googleUser.email ?? 'Usuário';
    const email = googleUser.email ?? '';

    await saveSettings({ displayName: name });
    const uid = auth().currentUser?.uid;
    if (uid) await saveUserProfile(uid, name);

    return { name, email };
  };

  const signOutGoogle = async (): Promise<void> => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
      await signInAnonymouslyIfNeeded();
    } catch (error) {
      console.error('[Firebase] Erro ao desconectar Google:', error);
      throw error;
    }
  };

  const setSharingEnabled = async (enabled: boolean) => {
    setSharingEnabledState(enabled);
    await saveSettings({ sharingEnabled: enabled });
    if (enabled && !isGoogleConnected) {
      // Sem conta Google, compartilhamento usa sessão anônima
      await signInAnonymouslyIfNeeded();
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      userId: user?.uid ?? null,
      sharingEnabled,
      isGoogleConnected,
      setSharingEnabled,
      signInWithGoogle,
      signOutGoogle,
      isInitializing,
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}
