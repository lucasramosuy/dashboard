import React from "react";
import { AuthProvider } from "../../contexts/AuthContext";
import { IcalSettingsCard } from '../planner/IcalSettingsCard';
import { IcalEventList } from '../planner/IcalEventList';

export const SchoologyPage: React.FC = () => {
  return (
    <AuthProvider>
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold m-0 mb-2 text-theme-text">Integración Schoology</h1>
          <p className="text-theme-text-muted">
            Administra la sincronización automática de tus tareas y eventos desde tu calendario de
            Schoology.
          </p>
        </header>
        <section>
          <IcalSettingsCard />
          <IcalEventList />
        </section>
      </div>
    </AuthProvider>
  );
};
