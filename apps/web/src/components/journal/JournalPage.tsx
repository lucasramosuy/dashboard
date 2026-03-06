import React from "react";
import { AppShell } from "../layout/AppShell";
import { JournalView } from "../journal/JournalView";

export const JournalPage: React.FC = () => (
  <AppShell>
    <JournalView />
  </AppShell>
);
