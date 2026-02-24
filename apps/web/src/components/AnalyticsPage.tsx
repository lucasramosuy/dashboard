import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export const AnalyticsPage: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <AnalyticsDashboard />
    </ThemeProvider>
  </AuthProvider>
);
