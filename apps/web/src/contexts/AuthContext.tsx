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
      const { token: newToken, user: newUser } = await api.login(email, pass);
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('dash_token', newToken);
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
 * useAuth es estricto: debe usarse siempre dentro de un AuthProvider.
 * Lanzar un error ayuda a detectar fallos de configuración en el árbol de componentes (islas de Astro)
 * y evita que la aplicación se quede en un estado de 'loading' infinito por falta de contexto.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
