import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserPublic } from "@dashboard/shared-types";
import { api } from "../lib/api";

interface AuthContextType {
  user: UserPublic | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión desde localStorage al montar el provider.
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");

    // Blindaje Anti-401: Si no hay token, detenerse inmediatamente sin llamar a la API
    if (!savedToken || savedToken === "undefined" || savedToken === "null") {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    api
      .getMe(savedToken)
      .then(setUser)
      .catch((err) => {
        console.error("[AuthContext] Error validando token inicial:", err);
        localStorage.removeItem("auth_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.login(email, pass);
      const newToken = response.token;

      // Persistencia atómica
      localStorage.setItem("auth_token", newToken);
      const verifiedToken = localStorage.getItem("auth_token");
      if (verifiedToken !== newToken) {
        throw new Error("Error crítico: El token no se pudo persistir en localStorage");
      }

      // ✅ Usar user que ya viene en la respuesta del login, sin segunda llamada
      setToken(newToken);
      setUser(response.user);
    } catch (error) {
      console.error("[Auth Error] Error al loguear:", error);
      localStorage.removeItem("auth_token");
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    inviteCode: string;
  }) => {
    try {
      const response = await api.register(data);
      const newToken = response.token;

      localStorage.setItem("auth_token", newToken);
      setToken(newToken);
      setUser(response.user);
    } catch (error) {
      console.error("[Auth Error] Error al registrar:", error);
      localStorage.removeItem("auth_token");
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    window.location.replace("/login");
  };

  const refreshMe = async () => {
    if (token) {
      const me = await api.getMe(token);
      setUser(me);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (typeof window !== "undefined") {
      // Solo en cliente, nunca en SSR
      console.warn("useAuth debe usarse dentro de <AuthProvider>");
    }
    return {
      user: null,
      token: null,
      loading: true,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      refreshMe: async () => {},
    };
  }
  return context;
};

export default AuthProvider;
