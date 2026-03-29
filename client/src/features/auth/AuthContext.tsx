/* eslint-disable react-refresh/only-export-components -- useAuth is intentionally co-located */
/**
 * Global auth state for the SPA:
 * - **JWT in storage** — demo sign-in / guest; sent as `Authorization: Bearer` (see `api-client`).
 * - **OIDC session** — server sets `wt_session`; `readMe` still runs so the UI knows `userId`, display name, etc.
 * - **`refreshMe`** — call after profile changes; uses a generation counter so slow 401s cannot wipe a newer session.
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getStoredToken, setStoredToken } from '@/lib/auth-storage';
import {
  createGuestSession,
  type MeResponse,
  postSessionLogout,
  readMe,
  signIn as apiSignIn,
  signUp as apiSignUp,
} from '@/lib/workout-api';
import { useAppDispatch } from '@/state';

type AuthContextValue = {
  token: string | null;
  me: MeResponse | null;
  loading: boolean;
  setSessionToken: (token: string | null) => void;
  signUp: (displayName: string) => Promise<void>;
  signIn: (displayName: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [me, setMe] = useState<MeResponse | null>(null);
  /** True until we finish probing session (Bearer and/or OIDC cookie). */
  const [loading, setLoading] = useState(true);
  /**
   * Ignore stale `readMe` results: the initial unauthenticated probe can return 401
   * after guest login completes and would otherwise clear the new JWT from storage.
   */
  const refreshGeneration = useRef(0);
  const dispatchDisplay = useAppDispatch();

  const refreshMe = useCallback(async () => {
    const gen = ++refreshGeneration.current;
    setLoading(true);
    try {
      const profile = await readMe();
      if (gen !== refreshGeneration.current) return;
      setMe(profile);
    } catch {
      if (gen !== refreshGeneration.current) return;
      setMe(null);
      setStoredToken(null);
      setToken(null);
    } finally {
      if (gen === refreshGeneration.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [token, refreshMe]);

  const meUiPrefsKey = useMemo(
    () => JSON.stringify(me?.uiPreferences ?? null),
    [me?.uiPreferences],
  );
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (loading) return;
    const current = meRef.current;
    if (!current) return;
    const raw = current.uiPreferences;
    if (raw == null || typeof raw !== 'object') return;
    if (Object.keys(raw).length === 0) return;
    if (raw.textScale !== undefined) {
      dispatchDisplay({ type: 'textScale/set', payload: raw.textScale });
    }
    if (raw.highContrast !== undefined) {
      dispatchDisplay({
        type: 'highContrast/set',
        payload: raw.highContrast,
      });
    }
    if (raw.themeMode !== undefined) {
      dispatchDisplay({ type: 'themeMode/set', payload: raw.themeMode });
    } else if (raw.darkMode !== undefined) {
      dispatchDisplay({
        type: 'themeMode/set',
        payload: raw.darkMode ? 'dark' : 'light',
      });
    }
  }, [dispatchDisplay, loading, meUiPrefsKey]);

  const setSessionToken = useCallback((t: string | null) => {
    setStoredToken(t);
    setToken(t);
  }, []);

  const signUp = useCallback(
    async (displayName: string) => {
      const { token: newToken } = await apiSignUp(displayName);
      setSessionToken(newToken);
    },
    [setSessionToken],
  );

  const signIn = useCallback(
    async (displayName: string) => {
      const { token: newToken } = await apiSignIn(displayName);
      setSessionToken(newToken);
    },
    [setSessionToken],
  );

  const continueAsGuest = useCallback(async () => {
    const { token: newToken } = await createGuestSession();
    setSessionToken(newToken);
  }, [setSessionToken]);

  const signOut = useCallback(() => {
    void postSessionLogout()
      .catch(() => {
        /* still clear local state */
      })
      .finally(() => {
        setSessionToken(null);
        setMe(null);
      });
  }, [setSessionToken]);

  const value = useMemo(
    () => ({
      token,
      me,
      loading,
      setSessionToken,
      signUp,
      signIn,
      continueAsGuest,
      signOut,
      refreshMe,
    }),
    [
      token,
      me,
      loading,
      setSessionToken,
      signUp,
      signIn,
      continueAsGuest,
      signOut,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
