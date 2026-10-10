import React from "react";
import { AppShell } from "../layout/AppShell";
import { ActivityPanel } from "./ActivityPanel";
import { DashboardSummary } from "../dashboard/DashboardSummary";

export const DashboardPage: React.FC = () => {
  return (
    <AppShell>
      <DashboardSummary />
      <ActivityPanel />
    </AppShell>
  );
};
