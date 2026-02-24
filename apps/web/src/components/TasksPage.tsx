import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { TaskList } from './TaskList';

export const TasksPage: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <TaskList />
    </ThemeProvider>
  </AuthProvider>
);
