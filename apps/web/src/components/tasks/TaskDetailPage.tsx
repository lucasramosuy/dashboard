import React from "react";
import { AppShell } from "../layout/AppShell";
import { TaskDetail } from "../tasks/TaskDetail";

interface Props {
  id: string;
}

export const TaskDetailPage: React.FC<Props> = ({ id }) => (
  <AppShell>
    <TaskDetail id={id} />
  </AppShell>
);
