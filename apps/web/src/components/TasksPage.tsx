import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { TaskList } from "./TaskList";
export const TasksPage: React.FC = () => (
  <AuthProvider>
    <TaskList />
  </AuthProvider>
);
