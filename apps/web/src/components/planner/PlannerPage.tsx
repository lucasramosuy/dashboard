import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { PlannerBoard } from "./PlannerBoard";

export const PlannerPage: React.FC = () => (
  <AuthProvider>
    <PlannerBoard />
  </AuthProvider>
);
