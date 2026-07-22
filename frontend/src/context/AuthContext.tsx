import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, clearToken, setToken as saveToken, getToken } from "@/lib/api";
import { setUnauthorizedHandler } from "@/lib/authEvents";
import { useToast } from "./ToastContext";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadUser = async () => {
    if (!getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Registered once; called by api.ts / stream.ts whenever an authenticated
  // request comes back 401 (token expired, revoked, or otherwise invalid).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const wasAuthenticated = !!getToken();
      clearToken();
      setUser(null);
      queryClient.clear();
      if (wasAuthenticated) {
        showToast("Your session has expired. Please log in again.", "error");
        navigate("/login", { state: { sessionExpired: true }, replace: true });
      }
    });
    return () => setUnauthorizedHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    saveToken(res.access_token);
    setUser(res.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await authApi.signup({ name, email, password });
    saveToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // token may already be invalid/expired; clear locally regardless
    }
    clearToken();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout, refreshUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
