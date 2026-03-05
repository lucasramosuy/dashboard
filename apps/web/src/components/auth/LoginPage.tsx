import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { LoginForm } from '../auth/LoginForm';

export const LoginPage: React.FC = () => (
  <AuthProvider>
    <LoginForm />
  </AuthProvider>
);
