import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Gmail modify & full mail scopes for delete operations
provider.addScope('https://www.googleapis.com/auth/gmail.modify');
provider.addScope('https://mail.google.com/');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('gmail_access_token') : null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = sessionStorage.getItem('gmail_access_token');
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') sessionStorage.removeItem('gmail_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Nie udało się pobrać tokenu dostępu z autoryzacji Google');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gmail_access_token', cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Błąd logowania:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('Błąd domeny (auth/unauthorized-domain): Musisz dodać "localhost" (lub Twój adres lokalny) do Autoryzowanych Domen w Firebase Console -> Authentication -> Settings -> Authorized domains.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Okno logowania zostało zamknięte przed zakończeniem autoryzacji.');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Przeglądarka zablokowała wyskakujące okno (popup). Zezwól na wyskakujące okienka dla tej strony.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = sessionStorage.getItem('gmail_access_token');
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('gmail_access_token');
  }
};
