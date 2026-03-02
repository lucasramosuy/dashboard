import React, { createContext, useContext, useEffect } from "react";
import type { UserPublic } from "@dashboard/shared-types";
import { api } from "../lib/api";
import { authClient } from "../lib/auth-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { logger, toError } from "../lib/logger";

const queryClient = new QueryClient();

interface AuthContextType {
  user: UserPublic | null;
  token: string | null; // We keep this typed for backward compatibility, but won't use it
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
  const { data: sessionData, isPending, error, refetch } = authClient.useSession();

  const user = sessionData?.user as UserPublic | null;
  const loading = isPending;
  const token = null; // ya no usamos tokens manuales front-to-back

  useEffect(() => {
    // Si hay un error de sesión y no estamos cargando, podríamos loguear
    if (error && !isPending) {
      console.error("[AuthContext] Error validando sesión:", error);
    }
  }, [error, isPending]);

  const login = async (email: string, pass: string) => {
    try {
      await api.login(email, pass);
      await refetch();
    } catch (err: unknown) {
      const error = toError(err);
      logger.error("[Auth Error] Error al loguear:", error);
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
      await api.register(data);
      await refetch();
    } catch (err: unknown) {
      const error = toError(err);
      logger.error("[Auth Error] Error al registrar:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      window.location.replace("/login");
    } catch (err: unknown) {
      const error = toError(err);
      logger.error("[Auth Error] Error al cerrar sesión:", error);
      // Fallback seguro por si la sesión de red falla pero necesitamos limpiar UI
      window.location.replace("/login");
    }
  };

  const refreshMe = async () => {
    await refetch();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshMe }}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
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
