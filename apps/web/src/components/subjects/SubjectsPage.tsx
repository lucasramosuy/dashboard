import React from "react";
import { AppShell } from "../layout/AppShell";
import { SubjectList } from "../subjects/SubjectList";

export const SubjectsPage: React.FC = () => (
  <AppShell>
    <SubjectList />
  </AppShell>
);
