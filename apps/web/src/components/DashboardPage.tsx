import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { DashboardSummary } from './DashboardSummary';

export const DashboardPage: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DashboardSummary />
      </ThemeProvider>
    </AuthProvider>
  );
};
