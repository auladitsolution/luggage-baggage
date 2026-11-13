"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { IUserSession } from "@/types/auth";

interface AuthContextType {
  user: IUserSession | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("lumina_auth_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const handleAuthChange = () => {
      fetchSession();
    };

    window.addEventListener("auth_state_changed", handleAuthChange);
    return () => window.removeEventListener("auth_state_changed", handleAuthChange);
  }, [fetchSession]);

  const logout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      try {
        localStorage.removeItem("lumina_auth_token");
      } catch {}
      setUser(null);
      window.dispatchEvent(new Event("auth_state_changed"));
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshAuth: fetchSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

