import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

const TOKEN_KEY = 'kt_auth_token';
const REFRESH_KEY = 'kt_auth_refresh';
const REMEMBER_KEY = 'kt_remember_me';
const API_BASE = '/api/v1';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  loginWithApiKey: (key: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextValue {
  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    isAuthenticated: false,
    isLoading: true,
  }));

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Store the token and schedule a refresh before it expires.
  const persistSession = useCallback((token: string, user: AuthUser, expiresIn: number) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, String(Date.now() + expiresIn * 1000));
    setState({ user, token, isAuthenticated: true, isLoading: false });

    // Schedule logout slightly before the token expires.
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const timeout = Math.max((expiresIn - 60) * 1000, 60000);
    refreshTimerRef.current = setTimeout(() => {
      // Token is about to expire -- force re-login.
      setState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false }));
    }, timeout);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  // Validate the stored token on mount.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setState({ user, token, isAuthenticated: true, isLoading: false });
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      }
    };

    validate();
  }, [clearSession]);

  // Intercept 401 responses globally via a fetch wrapper.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        // Only redirect if this is not a login/auth request.
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (!url.includes('/auth/login') && !url.includes('/auth/me')) {
          clearSession();
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [clearSession]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = (body as { message?: string })?.message ?? 'Invalid credentials';
      throw new Error(message);
    }

    const data = (await res.json()) as {
      token: string;
      expires_in: number;
      user: AuthUser;
    };

    if (localStorage.getItem(REMEMBER_KEY) === 'true') {
      persistSession(data.token, data.user, data.expires_in);
    } else {
      // Session-only (still store token for the current tab).
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    }
  }, [persistSession]);

  const loginWithApiKey = useCallback(async (key: string) => {
    // Validate the API key by calling /auth/me with it.
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${key}`,
        'X-API-Key': key,
      },
    });

    if (!res.ok) {
      throw new Error('Invalid API key');
    }

    const user = (await res.json()) as AuthUser;
    persistSession(key, user, 4 * 60 * 60); // Treat API key as a long-lived token.
  }, [persistSession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return { ...state, login, loginWithApiKey, logout };
}

export { AuthContext };

export function AuthProvider({ children, value }: { children: ReactNode; value: AuthContextValue }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
