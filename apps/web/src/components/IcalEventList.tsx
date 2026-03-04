import React from "react";
import { useIcalEvents } from "../hooks/useDashboardQueries";
import { IcalEvent } from "@dashboard/shared-types";

// Helper para parsear la fecha y capitalizar el primer caracter
const formatDate = (date: Date) => {
  const str = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const IcalEventList: React.FC = () => {
  const { data: events, isPending, error } = useIcalEvents();

  if (isPending) {
    return (
      <div className="oat-card" style={{ marginTop: "1rem" }}>
        <p className="oat-text-secondary">Cargando eventos sincronizados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oat-card" style={{ marginTop: "1rem", borderColor: "var(--oat-error)" }}>
        <p style={{ color: "var(--oat-error)" }}>Error al cargar eventos: {error.message}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="oat-card" style={{ marginTop: "1rem", textAlign: "center", padding: "2rem" }}>
        <p className="oat-text-secondary">
          No hay eventos sincronizados pendientes. Configura tu URL de Schoology y sincroniza para
          comenzar.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2 className="oat-text-bold" style={{ fontSize: "1.25rem", margin: "0" }}>
        Próximos eventos
      </h2>
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {events.map((e: IcalEvent) => (
          <div key={e.id} className="oat-card" style={{ padding: "1rem" }}>
            <h3 className="oat-text-bold" style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>
              {e.title}
            </h3>
            {e.description && (
              <p
                className="oat-text-secondary"
                style={{ fontSize: "0.875rem", margin: "0 0 1rem 0", whiteSpace: "pre-wrap" }}
              >
                {e.description.length > 200
                  ? `${e.description.substring(0, 200)}...`
                  : e.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                alignItems: "flex-start",
              }}
            >
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--oat-primary)",
                    textDecoration: "underline",
                  }}
                >
                  Ver en plataforma ↗
                </a>
              )}
              <div
                style={{
                  display: "inline-block",
                  background: "var(--oat-bg)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  color: "var(--oat-primary)",
                  border: "1px solid var(--oat-border)",
                }}
              >
                📅{" "}
                {formatDate(e.start_date instanceof Date ? e.start_date : new Date(e.start_date))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
