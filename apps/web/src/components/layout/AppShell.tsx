import React from "react";
import * as Sentry from "@sentry/react";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { Agentation } from "agentation";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ padding: "2rem", color: "red", background: "var(--dash-bg)" }}>
          Ocurrió un error en la interfaz. Por favor recarga la página.
        </div>
      }
    >
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Agentation />
        </AuthProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
};
