import React from "react";
import { AppShell } from "../layout/AppShell";
import { AnalyticsDashboard } from "../analytics/AnalyticsDashboard";

export const AnalyticsPage: React.FC = () => (
  <AppShell>
    <AnalyticsDashboard />
  </AppShell>
);
