import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { JournalView } from "./JournalView";

export const JournalPage: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <JournalView />
    </ThemeProvider>
  </AuthProvider>
);
