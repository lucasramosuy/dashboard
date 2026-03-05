import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { JournalView } from '../journal/JournalView';

export const JournalPage: React.FC = () => (
  <AuthProvider>
    <JournalView />
  </AuthProvider>
);
