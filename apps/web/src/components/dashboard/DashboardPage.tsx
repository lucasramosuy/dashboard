import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { DashboardSummary } from '../dashboard/DashboardSummary';

export const DashboardPage: React.FC = () => {
  return (
    <AuthProvider>
      <DashboardSummary />
    </AuthProvider>
  );
};
