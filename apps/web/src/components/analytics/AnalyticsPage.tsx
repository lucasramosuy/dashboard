import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
export const AnalyticsPage: React.FC = () => (
  <AuthProvider>
    <AnalyticsDashboard />
  </AuthProvider>
);
