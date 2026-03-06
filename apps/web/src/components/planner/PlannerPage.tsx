import React from "react";
import { AppShell } from "../layout/AppShell";
import { PlannerBoard } from "./PlannerBoard";

export const PlannerPage: React.FC = () => (
  <AppShell>
    <PlannerBoard />
  </AppShell>
);
