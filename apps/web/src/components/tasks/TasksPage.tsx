import React from "react";
import { AppShell } from "../layout/AppShell";
import { TaskList } from "../tasks/TaskList";

export const TasksPage: React.FC = () => (
  <AppShell>
    <TaskList />
  </AppShell>
);
