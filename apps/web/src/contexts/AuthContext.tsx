import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@dashboard/shared-types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión desde localStorage al montar el provider.
  useEffect(() => {
    const savedToken = localStorage.getItem('dash_token');
    if (savedToken) {
      setToken(savedToken);
      api.getMe(savedToken)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('dash_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const { token: newToken } = await api.login(email, pass);
      setToken(newToken);
      localStorage.setItem('dash_token', newToken);

      // Obtener datos completos del usuario según recomendaciones de SPECS e integración
      const fullUser = await api.getMe(newToken);
      setUser(fullUser);

      // Redirigir explícitamente al dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Error al loguear:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dash_token');
    window.location.href = '/login';
  };

  const refreshMe = async () => {
    if (token) {
      const me = await api.getMe(token);
      setUser(me);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth es seguro para SSR: si se usa fuera de un AuthProvider (como durante el pre-renderizado de Astro),
 * retorna un estado por defecto con loading: true para evitar errores fatales.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      token: null,
      loading: true,
      login: async () => {},
      logout: () => {},
      refreshMe: async () => {},
    };
  }
  return context;
};
