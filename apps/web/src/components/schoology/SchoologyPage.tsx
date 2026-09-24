import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AppShell } from "../layout/AppShell";
import { IcalSettingsCard } from "../planner/IcalSettingsCard";
import { IcalEventList } from "../planner/IcalEventList";
import { SchoologySkeleton } from "../ui/Skeleton";

const SchoologyContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <SchoologySkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex flex-col gap-1 mb-2">
        <h1 className="m-0 text-2xl sm:text-3xl font-bold tracking-tight text-theme-text">Integración Schoology</h1>
        <p className="text-theme-text-muted m-0 text-sm sm:text-base">
          Sincronizá tus tareas y eventos desde tu calendario de Schoology.
        </p>
      </header>
      <section className="flex flex-col gap-6">
        <IcalSettingsCard />
        <IcalEventList />
      </section>
    </div>
  );
};

export const SchoologyPage: React.FC = () => {
  return (
    <AppShell>
      <SchoologyContent />
    </AppShell>
  );
};
