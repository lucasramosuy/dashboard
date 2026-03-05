import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { SubjectDetail } from '../subjects/SubjectDetail';

interface Props {
  id: string;
}

export const SubjectDetailPage: React.FC<Props> = ({ id }) => (
  <AuthProvider>
    <ThemeProvider>
      <SubjectDetail id={id} />
    </ThemeProvider>
  </AuthProvider>
);
