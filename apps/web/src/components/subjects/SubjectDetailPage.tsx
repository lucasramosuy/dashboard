import React from "react";
import { AppShell } from "../layout/AppShell";
import { SubjectDetail } from "../subjects/SubjectDetail";

interface Props {
  id: string;
}

export const SubjectDetailPage: React.FC<Props> = ({ id }) => (
  <AppShell>
    <SubjectDetail id={id} />
  </AppShell>
);
