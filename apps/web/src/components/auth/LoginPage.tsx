import React from "react";
import { AppShell } from "../layout/AppShell";
import { LoginForm } from "../auth/LoginForm";

export const LoginPage: React.FC = () => (
  <AppShell>
    <LoginForm />
  </AppShell>
);
