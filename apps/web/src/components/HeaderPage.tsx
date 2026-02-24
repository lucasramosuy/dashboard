import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { HeaderBar } from './HeaderBar';

export const HeaderPage: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <HeaderBar />
    </ThemeProvider>
  </AuthProvider>
);
