import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SubjectList } from './SubjectList';

export const SubjectsPage: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <SubjectList />
    </ThemeProvider>
  </AuthProvider>
);
