import React from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { IcalSettingsCard } from "./IcalSettingsCard";
import { IcalEventList } from "./IcalEventList";

export const SchoologyPage: React.FC = () => {
  return (
    <AuthProvider>
      <div
        className="oat-container"
        style={{ padding: "2rem 1rem", maxWidth: "800px", margin: "0 auto" }}
      >
        <header style={{ marginBottom: "2rem" }}>
          <h1 className="oat-text-bold" style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>
            Integración Schoology
          </h1>
          <p className="oat-text-secondary">
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
