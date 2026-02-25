import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { LoginForm } from "./LoginForm";

export const LoginPage: React.FC = () => (
  <AuthProvider>
    <LoginForm />
  </AuthProvider>
);
