import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LoginForm } from './LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LoginForm />
      </ThemeProvider>
    </AuthProvider>
  );
};
