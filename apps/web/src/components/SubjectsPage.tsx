import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { SubjectList } from "./SubjectList";
export const SubjectsPage: React.FC = () => (
  <AuthProvider>
    <SubjectList />
  </AuthProvider>
);
