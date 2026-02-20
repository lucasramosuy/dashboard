import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * AppProviders es el único punto de entrada para la hidratación de React en el layout.
 * Al envolver el contenido principal, garantiza que todos los componentes hijos
 * compartan el mismo contexto de Auth y Theme.
 */
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
};
