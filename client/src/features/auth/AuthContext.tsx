/* eslint-disable react-refresh/only-export-components -- useAuth is intentionally co-located */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const refreshMe = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await readMe();
      setMe(profile);
    } catch {
      setMe(null);
      setStoredToken(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [token, refreshMe]);

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
