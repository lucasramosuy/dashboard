import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TaskDetail } from "./TaskDetail";

interface Props {
  id: string;
}

export const TaskDetailPage: React.FC<Props> = ({ id }) => (
  <AuthProvider>
    <ThemeProvider>
      <TaskDetail id={id} />
    </ThemeProvider>
  </AuthProvider>
);
