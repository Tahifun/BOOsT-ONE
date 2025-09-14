// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { safeJson } from '../utils/safeJson';

type User =
  | {
      id?: string;
      email?: string;
      displayName?: string;
      role?: "USER" | "SUPERUSER";
    }
  | null;

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  currentUser: User;
  login: (jwt: string, _isPro?: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "CB_AUTH_TOKEN";

export const AuthProvider = ({ children }: PropsWithChildren) => {
  // Token synchron aus localStorage lesen (Lazy-Init)
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        if (!token) {
          setCurrentUser(null);
          return;
        }
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!res.ok) {
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {}
          setToken(null);
          setCurrentUser(null);
          return;
        }

        const parsed = await safeJson<any>(res);
        if (!parsed.ok || !parsed.data) {
          try {
            localStorage.removeItem(TOKEN_KEY);
          } catch {}
          setToken(null);
          setCurrentUser(null);
          return;
        }

        const me = parsed.data;
        if (!cancelled) {
          setCurrentUser({
            id: me?.id ?? me?._id ?? undefined,
            email: me?.email ?? undefined,
            displayName: me?.displayName ?? me?.username ?? undefined,
            role: me?.role ?? "USER",
          });
        }
      } catch {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
        setToken(null);
        setCurrentUser(null);
      }
    };

    bootstrap().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = (jwt: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, jwt);
    } catch {}
    setToken(jwt);
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(null);
    setCurrentUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      isLoading,
      currentUser,
      login,
      logout,
    }),
    [token, isLoading, currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

